#ifndef _WARROLIGHT_H_INCLUDED
#define _WARROLIGHT_H_INCLUDED

#include <stdint.h>
#include <FastLED.h>

// For led chips like Neopixels, which have a data line, ground, and power, you just
// need to define DATA_PIN.  For led chipsets that are SPI based (four wires - data, clock,
// ground, and power), like the LPD8806 define both DATA_PIN and CLOCK_PIN
#define DATA_PIN 6
#define DATA_PIN2 7

#define NUM_LEDS_PROGRAM 150
#define STRIP_NUM_LEDS 150

// This variable is persisted even after reseting the arduino. That allows cycling through
// different programs of light
__attribute__((section(".noinit"))) unsigned int program;

bool withIp = false;

int NUM_LEDS = STRIP_NUM_LEDS;

// Define the array of leds
CRGB leds[STRIP_NUM_LEDS];
CRGB leds2[STRIP_NUM_LEDS];

const uint8_t ENCODING_POS_RGB = 1;
const uint8_t ENCODING_POS_VGA = 2;
const uint8_t ENCODING_VGA = 3;
const uint8_t ENCODING_RGB = 4;
const uint8_t ENCODING_RGB565 = 5;

void writeLeds(int pos, uint8_t r, uint8_t g, uint8_t b);
void writeLedsHSB(int pos, uint8_t h, uint8_t s, uint8_t b);
void writeLedsRgb565(int pos, uint8_t ba, uint8_t bb);

void writeLedFrame(char data[], int offset);
void initParams();
void arduinoProgram();

void broadcastAlive();
void broadcastPerf(int frames);
void setupUDPConnection(unsigned int port, uint8_t ipSegment);
bool checkForNewUDPMsg(char packetBuffer[]);

uint8_t vgaRed(uint8_t vga);
uint8_t vgaBlue(uint8_t vga);
uint8_t vgaGreen(uint8_t vga);

uint8_t sines[] = {0, 12, 25, 38, 50, 63, 75, 87, 99, 110, 122, 133, 143, 154, 164, 173, 182, 191, 199, 207, 214, 221, 227, 232, 237, 241, 245, 248, 251, 253, 254, 254, 254, 254, 252, 250, 248, 245, 241, 236, 231, 226, 220, 213, 206, 198, 190, 181, 172, 162, 152, 142, 131, 120, 108, 97, 85, 73, 61, 48, 35, 23, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 17, 29, 42, 54, 67, 79, 91, 103, 114, 125, 136, 147, 157, 167, 176, 185, 194, 202, 209, 216, 223, 229, 234};

#endif
