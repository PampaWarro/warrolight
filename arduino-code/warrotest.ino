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

// How many leds in your strip?
#define NUM_LEDS 150

// For led chips like Neopixels, which have a data line, ground, and power, you just
// need to define DATA_PIN.  For led chipsets that are SPI based (four wires - data, clock,
// ground, and power), like the LPD8806 define both DATA_PIN and CLOCK_PIN
#define DATA_PIN 6
#define CLOCK_PIN 13

// Define the array of leds
CRGB leds[NUM_LEDS];

void setup() { 
      // Uncomment/edit one of the following lines for your leds arrangement.
      FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
      
      Serial.begin(1152000);           // set up Serial library at 1152000 bps, the same than in Node.js
      //Serial.println("Hello world!");  // prints hello with ending line break 

      for(int i = 0; i<NUM_LEDS; i++){
        leds[i] = CRGB::Black;
      }
      
      leds[0] = CRGB::Black;
      leds[1] = CRGB::Red;
      leds[2] = CRGB::Green;
      leds[3] = CRGB::Blue;
      FastLED.show();
}

byte ENCODING_POS_RGB = 1;
byte ENCODING_POS_VGA = 2;
byte ENCODING_VGA = 3;
byte ENCODING_RGB = 4;

int j = 0;
byte pos = 3;
byte r = 0;
byte g = 0;
byte b = 0;

byte vgaRed(byte vga){return ((vga & 0xE0) >> 5) * 32;}
byte vgaBlue(byte vga){return ((vga & 0x03)) * 64;}
byte vgaGreen(byte vga){return ((vga & 0x1C) >> 2) * 32;}

void loop() { 
  int c = 0;
  int stripSize = NUM_LEDS;
  if(Serial.available() >= 2) {
    int encoding = Serial.read();
    if(encoding == ENCODING_POS_RGB){
        int j = Serial.read();
        char data[4*j];
        int total = Serial.readBytes(data, 4*j);
        if(total == 4*j){
          for(int i = 0; i<stripSize; i++){
            leds[i] = CRGB::Black;
          }
          for(int i = 0; i<j; i++){
            pos = data[0+i*4];
            leds[pos].red = data[1+i*4];
            leds[pos].green = data[2+i*4];
            leds[pos].blue = data[3+i*4];
          }
        }
    } else if (encoding == ENCODING_POS_VGA) {
       int j = Serial.read();
        char data[2*j];
        int total = Serial.readBytes(data, 2*j);
        if(total == 2*j){
          for(int i = 0; i<stripSize; i++){
            leds[i] = CRGB::Black;
          }
          for(int i = 0; i<j; i++){
            pos = data[0+i*2];
            byte vga = data[1+i*2];
            leds[pos].red = vgaRed(vga);
            leds[pos].green = vgaGreen(vga);
            leds[pos].blue = vgaBlue(vga);
          }
        }
     } else if (encoding == ENCODING_VGA) {
        int j = stripSize;
        char data[j];
        int readTotal = Serial.readBytes(data, j);
        if(readTotal == j){
          for(int i = 0; i<j; i++){
            byte vga = data[i];
            int pos = i;
            leds[pos].red = vgaRed(vga);
            leds[pos].green = vgaGreen(vga);
            leds[pos].blue = vgaBlue(vga);
          }
        }
    } else if (encoding == ENCODING_RGB) {
        int j = stripSize;
        char data[3*j];
        int total = Serial.readBytes(data, 3*j);
        if(total == 3*j){
          for(int i = 0; i<j; i++){
            int pos = i;            
            leds[pos].red = data[i*3];
            leds[pos].green = data[1+i*3];
            leds[pos].blue = data[2+i*3];
          }
        }
    }
    FastLED.show();
         
    Serial.println("OK"); // ASCII printable characters
    //Serial.println(c, DEC);     
  }
  /*
  while (Serial.available() >= 12) {
     // read the incoming byte:
     pos = Serial.read();
     r = Serial.read();
     g = Serial.read();
     b = Serial.read();
     
     leds[pos].red = r;
     leds[pos].blue = b;
     leds[pos].green = g;
    
     c++;
  }*/
}

