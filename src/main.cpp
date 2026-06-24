#include <Arduino.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <LiquidCrystal_I2C.h>
#include <SdFat.h>
#include <RtcDS1307.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <esp_sleep.h>
#include <ArduinoJson.h>
#include <SPI.h>       // the RFID reader talks over SPI
#include <MFRC522.h>

//pin definitions
#define TEMP_PIN 4   // DS18B20 data line
#define DOOR_PIN 5   // Reed Switch
#define BUZZER_PIN 18  // Buzzer

//temperature threshold
#define TEMP_NORMAL_MIN 2.0
#define TEMP_NORMAL_MAX 8.0

//timing
#define READ_INTERVAL 5000   // Read sensors every 5 seconds
#define DOOR_ALERT_TIME 10000  // Door open alert after 10 seconds

//wifi + MQTT definitions
#define WIFI_SSID "Wokwi-GUEST"   // Wokwi's built-in WiFi
#define WIFI_PASSWORD ""  // no password in Wokwi
#define MQTT_BROKER "broker.hivemq.com"  // free public MQTT broker
#define MQTT_PORT 1883
#define MQTT_TOPIC "medicalcart/trolley01/data"

// SD timing
#define LOG_INTERVAL 20000
unsigned long lastLogTime   = 0;    // SD logging timer

//sensor setup
OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

//LCD setup
LiquidCrystal_I2C lcd(0x27, 16, 2);

//wifi + MQTT setup
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

// MFRC522
#define RFID_SS  27   // RC522 chip-select
#define RFID_RST 26   // RC522 reset
#define AUTH_WINDOW 10000 // a badge stays valid for 10 s before onppening the door

// RFID reader object
MFRC522 rfid(RFID_SS, RFID_RST);

// the authorized badges
String NURSE_A = "11223344";      
String DOCTOR_B = "55667788";
String PHARMACIST_C = "C0FFEE99";

String currentUser = "---";      // last user  
float  lastTemp = 0;
unsigned long lastAuthTime = 0;     // when a valid badge was last scanned
bool   accessPreAuthorized = false; // scan result

//Buzzer setup
unsigned long lastBuzzTime = 0;
bool buzzState = false;

// SD card setup
#define SD_SCK  14
#define SD_MOSI 13
#define SD_MISO 12
#define SD_CS   15

SdFat sd;
SdFile logFile;
bool sdOK = false; // needed in the SD card fail section


RtcDS1307<TwoWire> rtc(Wire);

volatile bool doorJustOpened = false;
void IRAM_ATTR doorISR() {
  doorJustOpened = true;
}
// light sleep function
void enterLightSleep() {
    Serial.println("Entering Light Sleep...");
    // Wake up after READ_INTERVAL milliseconds
    esp_sleep_enable_timer_wakeup((uint64_t)READ_INTERVAL * 1000);
    Serial.flush();

    esp_light_sleep_start();
    Serial.println("ESP32 woke up");
}


void connectMQTT()
{
    if (WiFi.status() != WL_CONNECTED)
    {
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        while (WiFi.status() != WL_CONNECTED)
        {
            delay(500);
            Serial.print(".");
        }


        Serial.println("\nWiFi connected");
    }


    mqtt.setServer(MQTT_BROKER, MQTT_PORT);


    while (!mqtt.connected())
    {
        Serial.println("Connecting MQTT...");
        if (mqtt.connect("MedicalCartMonitor"))
        {
            Serial.println("MQTT connected");
        }
        else
        {
            delay(1000);
        }
    }
}

//function used to read the uid and decide if the user is authorized to open the door or not
void readRFID() {
    if (!rfid.PICC_IsNewCardPresent()) return; // no card case
    if (!rfid.PICC_ReadCardSerial())   return; // couldn't read case


    // Build the UID as text so we can get the exact uid value without a change
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
        if (rfid.uid.uidByte[i] < 0x10) uid += "0";
        uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    Serial.print("Card scanned, UID = "); Serial.println(uid);

    // Match the UID against the authorized list
    String user = "UNKNOWN";
    if      (uid == NURSE_A)      user = "Nurse A";
    else if (uid == DOCTOR_B)     user = "Doctor B";
    else if (uid == PHARMACIST_C) user = "Pharmacist C";

    String ts = getTimestamp(); // get current time

    if (user == "UNKNOWN") {
        // ACCESS DENIED (for unknokn user)
        currentUser = "UNKNOWN";
        Serial.println("ACCESS DENIED");
        lcd.clear();
        lcd.setCursor(0, 0); lcd.print("ACCESS DENIED!!");
        lcd.setCursor(0, 1); lcd.print("Unknown card");
        logToSD(ts, lastTemp, "-", "UNKNOWN", "ACCES_NON_AUTORISE");
        publishMQTT(lastTemp, "-", "UNKNOWN", "ACCES_NON_AUTORISE", ts);
        for (int i = 0; i < 5; i++) {          // 5 short beeps
            digitalWrite(BUZZER_PIN, HIGH); delay(150);
            digitalWrite(BUZZER_PIN, LOW);  delay(150);
        }
    } else {
        // ACCESS GRANTED (for known users)
        currentUser = user;
        accessPreAuthorized = true;
        lastAuthTime = millis();
        Serial.print("ACCESS GRANTED: "); Serial.println(user);
        lcd.clear();
        lcd.setCursor(0, 0); lcd.print("ACCESS GRANTED");
        lcd.setCursor(0, 1); lcd.print(user);
        logToSD(ts, lastTemp, "-", user, "ACCES_AUTORISE");// save to sd card
        publishMQTT(lastTemp, "-", user, "ACCES_AUTORISE", ts); // send mqtt message
        delay(1500);                          
    }

    rfid.PICC_HaltA();        // done reading this card
    rfid.PCD_StopCrypto1();
}

// write one row to the sd card including the user
void logToSD(String ts, float temp, String door, String user, String state) {
    if (!sdOK) return;
    if (logFile.open("coldchain.csv", O_RDWR | O_CREAT | O_AT_END)) {
        logFile.print(ts);    logFile.print(", ");
        logFile.print(temp);  logFile.print(", ");
        logFile.print(door);  logFile.print(", ");
        logFile.print(user);  logFile.print(", ");
        logFile.println(state);
        logFile.close();
    } else {
        Serial.println("SD write failed!");
    }
}
// make sure bli hadshi khdam: publish one JSON message to MQTT
void publishMQTT(float temp, String door, String user, String state, String ts) {
    if (!mqtt.connected()) mqtt.connect("MedicalCartMonitor");
    StaticJsonDocument<256> doc;
    doc["id"]          = "trolley01";
    doc["temperature"] = temp;
    doc["door"]        = door;
    doc["user"]        = user;
    doc["state"]       = state;
    doc["timestamp"]   = ts;
    char buffer[256];
    serializeJson(doc, buffer);
    mqtt.publish(MQTT_TOPIC, buffer);
}

void setup() {
  
    setCpuFrequencyMhz(80);   // Reduce CPU from 240MHz to 80MHz(for power consumption)
    btStop();    
    Serial.begin(115200);
    //setting pin modes
    pinMode(DOOR_PIN, INPUT_PULLUP);
    pinMode(BUZZER_PIN, OUTPUT);
    //starting temp sensor
    sensors.begin();

    // Start RTC
    Wire.begin(21, 22);
    rtc.Begin();
    // --- TEMP DEBUG: remove after confirming ---
    RtcDateTime now = rtc.GetDateTime();
    Serial.print("RTC time: ");
    Serial.print(now.Year());  Serial.print("-");
    Serial.print(now.Month()); Serial.print("-");
    Serial.print(now.Day());   Serial.print(" ");
    Serial.print(now.Hour());  Serial.print(":");
    Serial.print(now.Minute());Serial.print(":");
    Serial.println(now.Second());

    if (!rtc.IsDateTimeValid()) {
      Serial.println("RTC: time not valid, setting now...");
      rtc.SetDateTime(RtcDateTime(__DATE__, __TIME__));
}  else {
    Serial.println("RTC: time is valid");
}
// --- END TEMP DEBUG ---

    // Connect to WiFi and MQTT
    connectMQTT();

    // Start the SPI bus (shared by the SD card AND the RFID reader)
    SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
    pinMode(SD_CS,   OUTPUT); digitalWrite(SD_CS,   HIGH);
    pinMode(RFID_SS, OUTPUT); digitalWrite(RFID_SS, HIGH);

    if (!sd.begin(SD_CS)) {
    Serial.println("SD card failed!");
    sdOK = false;
    // publish an MQTT alert immediately
    if (mqtt.connected()) {
        mqtt.publish(MQTT_TOPIC,
            "{\"id\":\"trolley01\",\"state\":\"PANNE_SD\"}");
    }}
    else {
        sdOK = true;
        Serial.println("SD card ready.");
        logFile.open("coldchain.csv", O_RDWR | O_CREAT | O_AT_END);
        logFile.println("timestamp, temperature, door,user, state");// added user
        logFile.close();
    }
    // NEW: start the RFID reader (uses the SPI bus we just started)
    rfid.PCD_Init();
    Serial.println("RFID reader ready.");

    //starting LCD
    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("Medical Cart");
    lcd.setCursor(0, 1);
    lcd.print("Starting...");
    delay(2000); //to show the message briefly only at the beginning, won't be anymore delay()
    lcd.clear();
    Serial.println("System ready.");
  
    //door interruption
    attachInterrupt(digitalPinToInterrupt(DOOR_PIN), doorISR, CHANGE);
    // Wake up when door pin becomes HIGH
    esp_sleep_enable_ext0_wakeup((gpio_num_t)DOOR_PIN, 1);
}

//STATE MACHINE
enum State { NORMAL, ALERTE_TEMP, ALERTE_PORTE, PANNE_CAPTEUR };
State currentState = NORMAL;


void updateLCD(float temp, bool doorOpen)
{
    lcd.setCursor(0,0);
    lcd.print("                ");
    lcd.setCursor(0,1);
    lcd.print("                ");
    lcd.setCursor(0,0);
    switch(currentState)
    {
        case NORMAL:
            lcd.print("Temp:");
            lcd.print(temp,1);
            lcd.print(" C");
            lcd.setCursor(0,1);

            if(doorOpen)
                lcd.print("Door OPEN");
            else
                lcd.print("Door CLOSED");
            break;

        case ALERTE_TEMP:
            lcd.print("TEMP ALERT!");
            lcd.setCursor(0,1);
            lcd.print(temp,1);
            lcd.print(" C");
            break;
      
        case ALERTE_PORTE:
            lcd.print("DOOR ALERT");
            lcd.setCursor(0,1);
            lcd.print(">10 sec");
            break;
      
        case PANNE_CAPTEUR:
            lcd.print("SENSOR FAULT");
            lcd.setCursor(0,1);
            lcd.print("Check DS18B20");
            break;
    }
}

//TIMING VARIABLES
unsigned long lastReadTime = 0;
unsigned long doorOpenTime = 0;
bool doorWasOpen           = false;


String getTimestamp() {
    if (!rtc.IsDateTimeValid()) {
        Serial.println("RTC invalid — using fallback timestamp");
        return String("0000-00-00 00:00:00");  // something is wrong with the RTC
    }

    RtcDateTime now = rtc.GetDateTime();
    char buf[20];
    snprintf(buf, sizeof(buf), "%04d-%02d-%02d %02d:%02d:%02d",
        now.Year(), now.Month(), now.Day(),
        now.Hour(), now.Minute(), now.Second());
    return String(buf);
}

void loop() {
    readRFID();   // check the RFID reader on every loop

    if (WiFi.status() != WL_CONNECTED) {
    connectMQTT();
    }

    if (!mqtt.connected()) {
    mqtt.connect("MedicalCartMonitor");
    }
   
    unsigned long now = millis();
    if (now - lastReadTime >= READ_INTERVAL) {
        lastReadTime = now;

        // Read temperature
        sensors.requestTemperatures();
        float temp = sensors.getTempCByIndex(0);
        lastTemp = temp;   // NEW: remember it for access logs

        // Read door
        bool doorOpen = digitalRead(DOOR_PIN) == HIGH;

        //DOOR TIMER
        if (doorJustOpened) {
            doorJustOpened = false;    // Reset the interrupt flag
            if (doorOpen && !doorWasOpen) {
                doorOpenTime = now;
                doorWasOpen  = true;
            }
            else if (!doorOpen) {
                doorWasOpen = false;     // Door closed, reset
            }
        }
        bool doorAlert = doorOpen && (now - doorOpenTime >= DOOR_ALERT_TIME);

        //DETERMINE STATE
        bool tempAlert = (temp < TEMP_NORMAL_MIN || temp > TEMP_NORMAL_MAX);

        if (temp == -127.0) {
        currentState = PANNE_CAPTEUR;

        // FAIL-SAFE: sound the buzzer immediately
        digitalWrite(BUZZER_PIN, HIGH);
        logToSD(getTimestamp(), -127, "-", "---", "PANNE_CAPTEUR"); // CHANGED: helper + user col
        } else if (tempAlert) {
            currentState = ALERTE_TEMP;
        } else if (doorAlert) {
            currentState = ALERTE_PORTE;
        } else {
            currentState = NORMAL;
        }

        //SERIAL DEBUG
        Serial.print("Temp: "); Serial.print(temp);
        Serial.print(" C | Door: "); Serial.println(doorOpen ? "OPEN" : "CLOSED");
        Serial.print("State: ");
        if (currentState == NORMAL)          Serial.println("NORMAL");
        if (currentState == ALERTE_TEMP)     Serial.println("ALERTE TEMP");
        if (currentState == ALERTE_PORTE)    Serial.println("ALERTE PORTE");
        if (currentState == PANNE_CAPTEUR)   Serial.println("PANNE CAPTEUR");
   
        Serial.print("DOOR PIN RAW: ");
        Serial.println(digitalRead(DOOR_PIN));

        //LCD REACTION
        updateLCD(temp, doorOpen);

        //SD CARD LOGGING
        String timestamp = getTimestamp();
        // Reconnect WiFi if sleep disconnected it
        if (WiFi.status() != WL_CONNECTED) {
          connectMQTT();
          }
        // Reconnect MQTT if needed
        if (!mqtt.connected()) {
          mqtt.connect("MedicalCartMonitor");
        }
        // rest of SD logging
        String stateStr;
        if (currentState == NORMAL)         stateStr = "NORMAL";
        else if (currentState == ALERTE_TEMP)  stateStr = "ALERTE TEMP";
        else if (currentState == ALERTE_PORTE) stateStr = "ALERTE PORTE";
        else if (currentState == PANNE_CAPTEUR) stateStr = "PANNE CAPTEUR";
        if (sdOK && currentState != PANNE_CAPTEUR) {
          if (now - lastLogTime >= LOG_INTERVAL) {
            lastLogTime = now;  
            logToSD(timestamp, temp, doorOpen ? "OPEN" : "CLOSED", currentUser, stateStr);
          }
        } else {
            Serial.println("SD write failed!");
        }

        //MQTT ALERT
        if (currentState != NORMAL && currentState != PANNE_CAPTEUR) {
            if (!mqtt.connected()) {
                mqtt.connect("MedicalCartMonitor");
            }
            // MQTT every cycle
            publishMQTT(temp, doorOpen ? "OPEN" : "CLOSED", currentUser, stateStr, timestamp);
        }
        mqtt.loop();

    }

    //BUZZER REACTION
    now = millis();
    if (currentState == NORMAL) {
        digitalWrite(BUZZER_PIN, LOW);
        buzzState = false;
        enterLightSleep();
    }
    else {
        if (now - lastBuzzTime >= 500) {
            lastBuzzTime = now;
            buzzState = !buzzState;
            digitalWrite(BUZZER_PIN, buzzState ? HIGH : LOW);
        }
    }
}

