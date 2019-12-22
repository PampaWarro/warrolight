#include <FastLED.h>
#include <Warrolight.h>

// How many leds in your strip?
#define NUM_LEDS 150

// For led chips like Neopixels, which have a data line, ground, and power, you
// just need to define DATA_PIN.  For led chipsets that are SPI based (four
// wires - data, clock, ground, and power), like the LPD8806 define both
// DATA_PIN and CLOCK_PIN
#define DATA_PIN 6

// Define the array of leds
CRGB leds[NUM_LEDS];
unsigned long time = 0;

MultiProgram program;

void setup()
{
  randomSeed(analogRead(0));

  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 150);
  FastLED.show();
}

void loop()
{
  program.draw(leds, NUM_LEDS, time);
  FastLED.show();
  time++;
}
