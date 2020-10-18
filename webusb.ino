/*********************************************************************
 Adafruit invests time and resources providing this open source code,
 please support Adafruit and open-source hardware by purchasing
 products from Adafruit!

 MIT license, check LICENSE for more information
 Copyright (c) 2019 Ha Thach for Adafruit Industries
 All text above, and the splash screen below must be included in
 any redistribution
*********************************************************************/
#include "Adafruit_TinyUSB.h"
Adafruit_USBD_WebUSB usb_web;
WEBUSB_URL_DEF(landingPage, 1, "speedence.com");

int led_pin = LED_BUILTIN;
int previous = 0;
int wheel = 0;
int pedal = 1;
int wait;
void setup() {
  pinMode(led_pin, OUTPUT);
  pinMode(11, INPUT_PULLUP);
  usb_web.setLandingPage(&landingPage);
  usb_web.setLineStateCallback(line_state_callback);
  usb_web.begin();
  Serial.begin(115200);
  while(!USBDevice.mounted()) delay(1);
  Serial.println("TinyUSB WebUSB Serial example");
  randomSeed(analogRead(A0));
  wait = random(200, 500);
 
  attachInterrupt(digitalPinToInterrupt(12), sendWheel, LOW);
  attachInterrupt(digitalPinToInterrupt(13), sendPedal, LOW);
}

// function to echo to both Serial and WebUSB
void echo_all(char chr) {
  Serial.write(chr);
  // print extra newline for Serial
  if ( chr == '\r' ) Serial.write('\n');
  usb_web.write(chr);
}

void loop() {
  // delay(100);
  // Serial.println(30000);
  // Serial.println(analogRead(A0));
  int now = millis();
  if (now - previous > wait && !digitalRead(11)) {
    previous = now;
    wait = random(200, 500);
    usb_web.println(counter++);
  }
}

void sendWheel() {
  wheel += 2;
  usb_web.println(wheel);
}

void sendPedal() {
  pedal += 2;
  usb_web.println(pedal);
}

void line_state_callback(bool connected) {
  digitalWrite(led_pin, connected);
  if (connected) usb_web.print("Connected");
}
