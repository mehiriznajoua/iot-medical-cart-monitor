#include <Arduino.h>
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
#define TEMP_WARN_MIN     1.0
#define TEMP_WARN_MAX     9.0

//TIMING
#define READ_INTERVAL     2000   // Read sensors every 2 seconds
#define DOOR_ALERT_TIME   10000  // Door open alert after 10 seconds

//SENSOR SETUP
OneWire oneWire(TEMP_PIN);
DallasTemperature sensors(&oneWire);

//LCD SETUP
LiquidCrystal_I2C lcd(0x27, 16, 2);

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

void loop() {
    
}