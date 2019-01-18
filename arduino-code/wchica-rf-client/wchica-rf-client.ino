#include <bitswap.h>
#include <chipsets.h>
#include <color.h>
#include <colorpalettes.h>
#include <colorutils.h>
#include <controller.h>
#include <cpp_compat.h>
#include <dmx.h>
#include <FastLED.h>
#include <fastled_config.h>
#include <fastled_delay.h>
#include <fastled_progmem.h>
#include <fastpin.h>
#include <fastspi.h>
#include <fastspi_bitbang.h>
#include <fastspi_dma.h>
#include <fastspi_nop.h>
#include <fastspi_ref.h>
#include <fastspi_types.h>
#include <hsv2rgb.h>
#include <led_sysdefs.h>
#include <lib8tion.h>
#include <noise.h>
#include <pixelset.h>
#include <pixeltypes.h>
#include <platforms.h>
#include <power_mgt.h>

#include "FastLED.h"

#include <SPI.h>
#include <nRF24L01.h>
#include <RF24.h>

__attribute__((section(".noinit"))) unsigned int program;
__attribute__((section(".noinit"))) unsigned int lastTime;
unsigned int globalSeed = lastTime;

// How many leds in your strip?
// #define NUM_LEDS 150
#define NUM_LEDS 150

// For led chips like Neopixels, which have a data line, ground, and power, you just
// need to define DATA_PIN.  For led chipsets that are SPI based (four wires - data, clock,
// ground, and power), like the LPD8806 define both DATA_PIN and CLOCK_PIN
#define DATA_PIN 6
#define DATA_PIN2 7
#define CLOCK_PIN 13

// Define the array of leds
CRGB leds[NUM_LEDS];

// This variable is persisted even after reseting the arduino. That allows cycling through
// different programs of light
// __attribute__((section(".noinit"))) unsigned int program;

RF24 radio(7, 8); // CE, CSN
const byte address[6] = "90909";

#define PAYLOAD_SIZE 32

void setup() {
  // Uncomment/edit one of the following lines for your leds arrangement.
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);

  FastLED.setMaxPowerInVoltsAndMilliamps(5, 150);

  if (program > 100)
    program = 0;
  else
    program = (program + 1) % 5;

  // Generate random seed using analog pin noise
  randomSeed(analogRead(0));

  // Global seed makes sure each time the lights are different
  globalSeed = random(32000);

  initParams();

  // Show with lights selected program
  for (int i = 0; i < 50; i++) {
    writeLeds(i, 0, 0, 0);
  }

  writeLeds(0 + program, 255, 50, 255); // pink

  FastLED.show();
  delay(300);

  //Serial.begin(9600);
  radio.begin();
  radio.openReadingPipe(0, 0xF0F0F0F0F0);

  // Max power 1000 mah
  radio.setChannel(92);
  //radio.setChannel(103);

  // Max power 700 mah
  //radio.setChannel(81);
  //radio.setChannel(114);

  radio.setPALevel(RF24_PA_HIGH);
  //radio.enableDynamicPayloads();
  radio.setPayloadSize(PAYLOAD_SIZE);
  radio.setDataRate(RF24_2MBPS);
  radio.setAutoAck(false);
  radio.startListening();
}

byte ENCODING_POS_RGB = 1;
byte ENCODING_POS_VGA = 2;
byte ENCODING_VGA = 3;
byte ENCODING_RGB = 4;
byte ENCODING_RGB565 = 5;

int j = 0;
byte pos = 3;
byte r = 0;
byte g = 0;
byte b = 0;

byte vgaRed(byte vga) {
  return ((vga & 0xE0) >> 5) * 32;
}
byte vgaBlue(byte vga) {
  return ((vga & 0x03)) * 64;
}
byte vgaGreen(byte vga) {
  return ((vga & 0x1C) >> 2) * 32;
}

void writeLeds(int pos, byte r, byte g, byte  b) {
  if (pos < 150) {
    leds[pos].red = r;
    leds[pos].green = g;
    leds[pos].blue = b;
  }
}

void writeLedsRgb565(int pos, byte ba, byte bb) {
  int rgb565 = ((int)(ba & 0xff) << 8) | ((int)(bb & 0xff)) ;
  byte b = ((rgb565 & 0x001f)) << 3;
  byte g = ((rgb565 & 0x7E0) >> 5) << 2;
  byte r = ((rgb565) >> 11) << 3;
  writeLeds(pos, r, g, b);
}

void writeLedsHSB(int pos, byte h, byte s, byte  b) {
  if (pos < 150) {
    leds[pos].setHSV(h, s, b);
  }
}


int stripSize = NUM_LEDS;

int waitingCounter = 0;

byte data[PAYLOAD_SIZE];
unsigned long lastFrame = millis();
unsigned long lastAnimationFrame = millis();

void loop() {
  int ledSize = 3;

  unsigned long nowMs = millis();

  if (radio.available()) {
    while (radio.available()) {                     // While there is data ready
      radio.read( &data, sizeof(data));             // Get the payload
    }
    int pos = data[0];
    //Serial.print("Received ");
    //Serial.println(pos);

    int offset = data[0];
    for (int i = 2; i + 2 < PAYLOAD_SIZE; i += ledSize) {
      if (ledSize == 3) {
        writeLeds(offset + i / ledSize, data[i], data[i + 1], data[i + 2]);
      } else if (ledSize == 2) {
        writeLedsRgb565(offset + i / ledSize, data[i], data[i + 1]);
      }
    }
    if (offset + 30 / ledSize > 145) {
      FastLED.show();
    }
    lastFrame = nowMs;
  } else {
    if ((nowMs - lastFrame) > 1000 && (nowMs - lastAnimationFrame) > 20) {
      arduinoProgram();
      FastLED.show();
      lastAnimationFrame = nowMs;
    }
  }
}

