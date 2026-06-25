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


//pin definitions
#define TEMP_PIN 4   // DS18B20 data line
#define DOOR_PIN 5   // Reed Switch
#define BUZZER_PIN 18  // Buzzer
#define MAINT_BTN_PIN 19 //maintenance button

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

String currentUser = "UNKNOWN";      // last user  
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

RtcDS1307<TwoWire> rtc(Wire);


volatile bool doorJustOpened = false;

void IRAM_ATTR doorISR() {
  doorJustOpened = true;
}

void reconnectMQTT() {
    if (!mqtt.connected()) {
        mqtt.connect("MedicalCartMonitor");
    }
}

// light sleep function
void enterLightSleep() {
    Serial.println("Entering Light Sleep...");
    esp_sleep_enable_timer_wakeup((uint64_t)READ_INTERVAL * 1000);
    Serial.flush();
    esp_light_sleep_start();
    Serial.println("Woke up");

    // Reconnect WiFi if dropped during sleep
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi lost, reconnecting...");
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        unsigned long t = millis();
        while (WiFi.status() != WL_CONNECTED && millis() - t < 5000) {
            delay(100);
        }
    }

    // Reconnect MQTT if dropped
    reconnectMQTT();
}

void connectMQTT() {
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        Serial.print(".");
    }
    Serial.println("WiFi connected");
    mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    mqtt.connect("MedicalCartMonitor");
    WiFi.setSleep(false); // prevent WiFi from sleeping on its own
}

/*
void testSD() {
    Serial.println("=== SD CARD TEST ===");
    
    // WRITE TEST
    if (logFile.open("test.txt", O_RDWR | O_CREAT | O_AT_END)) {
        logFile.println("SD card works!");
        logFile.close();
        Serial.println("Write: OK");
    } else {
        Serial.println("Write: FAILED");
        return;
    }

    // READ TEST
    if (logFile.open("test.txt", O_READ)) {
        Serial.print("Read: ");
        while (logFile.available()) {
            Serial.write(logFile.read());
        }
        logFile.close();
    } else {
        Serial.println("Read: FAILED");
    }

    Serial.println("=== END TEST ===");
}
*/

void setup() {
    
    Serial.begin(115200);

    //setting pin modes
    pinMode(DOOR_PIN, INPUT_PULLUP);
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(MAINT_BTN_PIN, INPUT_PULLUP);

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

    // Starting SD card
    SPI.begin(SD_SCK, SD_MISO, SD_MOSI, SD_CS);
    if (!sd.begin(SD_CS)) {
        Serial.println("SD card failed!");
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("SD CARD ERROR");
    } else {
        Serial.println("SD card ready.");
        //testSD();
        logFile.open("coldchain.csv", O_RDWR | O_CREAT | O_AT_END);
        logFile.println("timestamp, temperature, door, state");
        logFile.close();
    }

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

}

//STATE MACHINE
enum State { NORMAL, ALERTE_TEMP, ALERTE_PORTE, PANNE_CAPTEUR, MAINTENANCE };
State currentState = NORMAL;

//update LCD
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
bool doorWasOpen = false;

unsigned long btnPressStart    = 0;
bool          btnWasPressed    = false;
bool          maintenanceMode  = false;
unsigned long maintStartTime   = 0;

String getTimestamp() {
    RtcDateTime now = rtc.GetDateTime();
    char buf[20];
    snprintf(buf, sizeof(buf), "%04d-%02d-%02d %02d:%02d:%02d",
        now.Year(), now.Month(), now.Day(),
        now.Hour(), now.Minute(), now.Second());
    return String(buf);
}

void handleMaintenanceButton() {
    bool btnPressed = (digitalRead(MAINT_BTN_PIN) == LOW);

    if (btnPressed && !btnWasPressed) {
        // Button just pressed — start timer
        btnPressStart = millis();
        btnWasPressed = true;
    }
    else if (!btnPressed && btnWasPressed) {
        // Button released
        btnWasPressed = false;
        btnPressStart = 0;
    }
    else if (btnPressed && btnWasPressed) {
        // Button held — check 3 second threshold
        if (millis() - btnPressStart >= 3000) {
            if (!maintenanceMode) {
                // Enter maintenance
                maintenanceMode = true;
                maintStartTime  = millis();
                currentState    = MAINTENANCE;

                lcd.clear();
                lcd.setCursor(0, 0); lcd.print("MAINTENANCE MODE");
                lcd.setCursor(0, 1); lcd.print("Alerts suppressed");

                // Log to SD
                if (logFile.open("coldchain.csv", O_RDWR | O_CREAT | O_AT_END)) {
                    logFile.print(getTimestamp());
                    logFile.println(", -, -, MAINTENANCE_START");
                    logFile.close();
                }

                // Publish to MQTT
                String msg = "{\"id\":\"trolley01\",\"state\":\"MAINTENANCE\",\"timestamp\":\"" + getTimestamp() + "\"}";
                mqtt.publish(MQTT_TOPIC, msg.c_str());

                Serial.println("MAINTENANCE MODE ON");
                btnPressStart = millis(); // reset to avoid re-triggering
            } else {
                // Exit maintenance
                unsigned long duration = (millis() - maintStartTime) / 1000;
                maintenanceMode = false;
                currentState    = NORMAL;

                lcd.clear();
                lcd.setCursor(0, 0); lcd.print("MAINTENANCE END");
                lcd.setCursor(0, 1); lcd.print("Duration: " + String(duration) + "s");
                delay(2000);

                // Log duration to SD
                if (logFile.open("coldchain.csv", O_RDWR | O_CREAT | O_AT_END)) {
                    logFile.print(getTimestamp());
                    logFile.print(", -, -, MAINTENANCE_END_");
                    logFile.print(duration);
                    logFile.println("s");
                    logFile.close();
                }

                // Publish to MQTT
                String msg = "{\"id\":\"trolley01\",\"state\":\"NORMAL\",\"timestamp\":\"" + getTimestamp() + "\"}";
                mqtt.publish(MQTT_TOPIC, msg.c_str());

                Serial.println("MAINTENANCE MODE OFF — duration: " + String(duration) + "s");
                btnPressStart = millis();
            }
        }
    }
}

void loop() {

    handleMaintenanceButton();

    // Skip all sensor reading and alerts during maintenance
    if (maintenanceMode) {
        mqtt.loop();
        return;
    }

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

        // Read door
        bool doorOpen = digitalRead(DOOR_PIN) == HIGH;

        // door timer
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

        // determine state
        bool tempAlert = (temp < TEMP_NORMAL_MIN || temp > TEMP_NORMAL_MAX);

         if (temp == -127.0) {
            currentState = PANNE_CAPTEUR;

            // FAIL-SAFE: sound the buzzer immediately
            digitalWrite(BUZZER_PIN, HIGH);

            // FAIL-SAFE: publish critical alert via MQTT
            DynamicJsonDocument doc(256);
            doc["id"]    = "trolley01";
            doc["temp"]  = "ERROR";
            doc["door"]  = doorOpen ? "OPEN" : "CLOSED";
            doc["state"] = "PANNE_CAPTEUR";

            char message[200];
            serializeJson(doc, message);

            mqtt.publish(MQTT_TOPIC, message);

            // FAIL-SAFE: log the fault to SD card
            if (logFile.open("coldchain.csv", O_RDWR | O_CREAT | O_AT_END)) {
                logFile.print(getTimestamp());
                logFile.println(", -127, -, PANNE_CAPTEUR");
                logFile.close();
            }

        } 
        else if (tempAlert) {
            currentState = ALERTE_TEMP;
        } 
        else if (doorAlert) {
            currentState = ALERTE_PORTE;
        } 
        else {
            currentState = NORMAL;
        }

        //SERIAL DEBUG
        Serial.print("Temp: "); Serial.print(temp);
        Serial.print(" C | Door: "); Serial.println(doorOpen ? "OPEN" : "CLOSED");
        Serial.print("State: ");
        if (currentState == NORMAL)          Serial.println("NORMAL");
        if (currentState == ALERTE_TEMP)     Serial.println("ALERTE_TEMP");
        if (currentState == ALERTE_PORTE)    Serial.println("ALERTE_PORTE");
        if (currentState == PANNE_CAPTEUR)   Serial.println("PANNE_CAPTEUR");
    
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
        else if (currentState == ALERTE_TEMP)  stateStr = "ALERTE_TEMP";
        else if (currentState == ALERTE_PORTE) stateStr = "ALERTE_PORTE";
        else if (currentState == PANNE_CAPTEUR) stateStr = "PANNE_CAPTEUR";
        if (currentState != PANNE_CAPTEUR) {
            if (now - lastLogTime >= LOG_INTERVAL) {
            lastLogTime = now;  
            
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
            }
        }

        //MQTT PUBLISH
        reconnectMQTT();
        DynamicJsonDocument doc(256);
        doc["id"] = "trolley01";
        doc["temperature"] = temp;
        doc["door"] = doorOpen ? "OPEN" : "CLOSED";
        doc["state"] = stateStr;
        doc["timestamp"] = timestamp;

        char buffer[256];
        serializeJson(doc, buffer);
        mqtt.publish(MQTT_TOPIC, buffer);
        mqtt.loop();

    }

    //BUZZER REACTION
    now = millis();
    if (currentState == NORMAL) {
        digitalWrite(BUZZER_PIN, LOW);
        buzzState = false;

        // Save power
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