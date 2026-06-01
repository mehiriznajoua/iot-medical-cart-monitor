#include <Arduino.h>
#include <Wire.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include <LiquidCrystal_I2C.h>

//PIN DEFINITIONS
#define TEMP_PIN      4   // DS18B20 data line
#define DOOR_PIN      5   // Reed Switch
#define BUZZER_PIN    18  // Buzzer

//TEMPERATURE THRESHOLDS
#define TEMP_NORMAL_MIN   2.0
#define TEMP_NORMAL_MAX   8.0

//TIMING
#define READ_INTERVAL     2000   // Read sensors every 2 seconds
#define DOOR_ALERT_TIME   10000  // Door open alert after 10 seconds

//SENSOR SETUP
OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

//LCD SETUP
LiquidCrystal_I2C lcd(0x27, 16, 2);

//BUZZER SETUP
unsigned long lastBuzzTime = 0;
bool buzzState = false;

void setup() {
    
    Serial.begin(115200);

    //setting pin modes
    pinMode(DOOR_PIN, INPUT_PULLUP);
    pinMode(BUZZER_PIN, OUTPUT);

    //starting temp sensor
    sensors.begin();

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

}

//STATE MACHINE
enum State { NORMAL, ALERTE_TEMP, ALERTE_PORTE, PANNE_CAPTEUR };
State currentState = NORMAL;

//TIMING VARIABLES
unsigned long lastReadTime = 0;
unsigned long doorOpenTime = 0;
bool doorWasOpen           = false;

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
        if (doorOpen && !doorWasOpen) {
            doorOpenTime = now;
            doorWasOpen  = true;
        } else if (!doorOpen) {
            doorWasOpen = false;
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
        if (currentState == ALERTE_TEMP)     Serial.println("ALERTE_TEMP");
        if (currentState == ALERTE_PORTE)    Serial.println("ALERTE_PORTE");
        if (currentState == PANNE_CAPTEUR)   Serial.println("PANNE_CAPTEUR");
    
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