#include <Arduino.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <LiquidCrystal_I2C.h>
#include <SdFat.h>
#include <RtcDS3231.h>
#include <WiFi.h>
#include <PubSubClient.h>

//pin definitions
#define TEMP_PIN 4   // DS18B20 data line
#define DOOR_PIN 5   // Reed Switch
#define BUZZER_PIN 18  // Buzzer

//temperature threshold
#define TEMP_NORMAL_MIN 2.0
#define TEMP_NORMAL_MAX 8.0

//timing
#define READ_INTERVAL 2000   // Read sensors every 2 seconds
#define DOOR_ALERT_TIME 10000  // Door open alert after 10 seconds

//wifi + MQTT definitions
#define WIFI_SSID "Wokwi-GUEST"   // Wokwi's built-in WiFi
#define WIFI_PASSWORD ""  // no password in Wokwi
#define MQTT_BROKER "broker.hivemq.com"  // free public MQTT broker
#define MQTT_PORT 1883
#define MQTT_TOPIC "medicalcart/alert"

//sensor setup
OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

//LCD setup
LiquidCrystal_I2C lcd(0x27, 16, 2);

//wifi + MQTT setup
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

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

RtcDS3231<TwoWire> rtc(Wire);


volatile bool doorJustOpened = false;

void IRAM_ATTR doorISR() {
  doorJustOpened = true;
}

void connectMQTT() {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
    }
    Serial.println("WiFi connected");
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    mqtt.connect("MedicalCartMonitor");
}


void setup() {
    
    Serial.begin(115200);

    //setting pin modes
    pinMode(DOOR_PIN, INPUT_PULLUP);
    pinMode(BUZZER_PIN, OUTPUT);

    //starting temp sensor
    sensors.begin();

    // Start RTC
    Wire.begin(21, 22);
    rtc.Begin();
    if (!rtc.IsDateTimeValid()) {
        rtc.SetDateTime(RtcDateTime(__DATE__, __TIME__));
    }

    // Connect to WiFi and MQTT
    connectMQTT();

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

    //Starting SD card
    if (!sd.begin(SD_CS, SD_SCK_MHZ(4))) {
        Serial.println("SD card failed!");
        lcd.clear();
        lcd.print("SD CARD ERROR");
    } else {
        Serial.println("SD card ready.");
        // Create or open log file
        logFile.open("coldchain.csv", O_RDWR | O_CREAT | O_AT_END);
        logFile.println("time_ms, temperature, door, state");
        logFile.close();
    }

    //door interruption
    attachInterrupt(digitalPinToInterrupt(DOOR_PIN), doorISR, CHANGE);

}

//STATE MACHINE
enum State { NORMAL, ALERTE_TEMP, ALERTE_PORTE, PANNE_CAPTEUR };
State currentState = NORMAL;

//TIMING VARIABLES
unsigned long lastReadTime = 0;
unsigned long doorOpenTime = 0;
bool doorWasOpen           = false;

String getTimestamp() {
    RtcDateTime now = rtc.GetDateTime();
    char buf[20];
    snprintf(buf, sizeof(buf), "%04d-%02d-%02d %02d:%02d:%02d",
        now.Year(), now.Month(), now.Day(),
        now.Hour(), now.Minute(), now.Second());
    return String(buf);
}

void loop() {
    
    unsigned long now = millis();
    if (now - lastReadTime >= READ_INTERVAL) {
        lastReadTime = now;

        // Read temperature
        sensors.requestTemperatures();
        float temp = sensors.getTempCByIndex(0);

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
        lcd.clear();
        lcd.setCursor(0, 0);

        if (currentState == PANNE_CAPTEUR) {
            lcd.print("SENSOR FAULT!");
            lcd.setCursor(0, 1);
            lcd.print("Check wiring");
        } 
        else if (currentState == ALERTE_TEMP) {
            lcd.print("Temp: "); lcd.print(temp); lcd.print(" C !");
            lcd.setCursor(0, 1);
            lcd.print("TEMP ALERT");

        }
        else if (currentState == ALERTE_PORTE) {
            lcd.print("Temp: "); lcd.print(temp); lcd.print(" C OK");
            lcd.setCursor(0, 1);
            lcd.print("DOOR OPEN >10s!");

        } 
        else {
            lcd.print("Temp: "); lcd.print(temp); lcd.print(" C OK");
            lcd.setCursor(0, 1);
            if (doorOpen) {
                lcd.print("Door: OPEN");     // Door open but <10s, no alert yet
            } else {
                lcd.print("Door: CLOSED");
            }   
        }

        //SD CARD LOGGING
        String timestamp = getTimestamp();
        String stateStr;
        if (currentState == NORMAL)         stateStr = "NORMAL";
        else if (currentState == ALERTE_TEMP)  stateStr = "ALERTE TEMP";
        else if (currentState == ALERTE_PORTE) stateStr = "ALERTE PORTE";
        else if (currentState == PANNE_CAPTEUR) stateStr = "PANNE CAPTEUR";

        if (logFile.open("coldchain.csv", O_RDWR | O_CREAT | O_AT_END)) {
            logFile.print(timestamp);
            logFile.print(", ");
            logFile.print(temp);
            logFile.print(", ");
            logFile.print(doorOpen ? "OPEN" : "CLOSED");
            logFile.print(", ");
            logFile.println(stateStr);
            logFile.close();
        } else {
            Serial.println("SD write failed!");
        }

        //MQTT ALERT
        if (currentState != NORMAL) {
            if (!mqtt.connected()) {
                mqtt.connect("MedicalCartMonitor");
            }
            String message = getTimestamp() + " | " + stateStr + " | Temp: " + String(temp) + "C";
            mqtt.publish(MQTT_TOPIC, message.c_str());
        }
        mqtt.loop();

    }

    //BUZZER REACTION
    if (currentState == NORMAL) {
        digitalWrite(BUZZER_PIN, LOW);
        buzzState = false;
    } 
    else {
        if (now - lastBuzzTime >= 500) {
            lastBuzzTime = now;
            buzzState = !buzzState;
            digitalWrite(BUZZER_PIN, buzzState ? HIGH : LOW);
        }
    }



}