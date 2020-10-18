#include <Adafruit_TinyUSB.h>
Adafruit_USBD_WebUSB webusb;
WEBUSB_URL_DEF(landingPage, 1, "speedence.com");

int wheel = 1;
int pedal = 2;
void setup() {
  webusb.setLandingPage(&landingPage); // When plugged in to compatible devices, will ask user to go to this page
  webusb.setLineStateCallback(line_state_callback); // I don't know what this does to be honest
  webusb.begin(); // Start up usb_web
  while(!USBDevice.mounted()) delay(1);
  attachInterrupt(digitalPinToInterrupt(12), sendWheel, LOW);
  attachInterrupt(digitalPinToInterrupt(13), sendPedal, LOW);
}

void loop() {}
void sendWheel() { wheel += 2; webusb.print(wheel); }
void sendPedal() { pedal += 2; webusb.print(pedal); }
void line_state_callback(bool connected) { if (connected) webusb.print(0); }
