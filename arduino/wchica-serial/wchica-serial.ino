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

// This variable is persisted even after reseting the arduino. That allows
// cycling through different programs of light
__attribute__((section(".noinit"))) unsigned int program;

Stars starsProgram;
Rainbow rainbowProgram;

WSerial wserial;

void setup()
{
  randomSeed(analogRead(0));

  program = (program + 1) % 2;
  // program = 0;

  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 300);

  Serial.begin(576000);

  for (int i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = CRGB::Black;
  }

  leds[0] = CRGB::Black;
  leds[1] = CRGB::Red;
  leds[2] = CRGB::Green;
  leds[3] = CRGB::Blue;

  FastLED.show();
}

void loop()
{
  if (wserial.available())
    wserial.readLeds(leds, NUM_LEDS);
  else
    arduinoProgram();
}

unsigned long time = 0;
void arduinoProgram()
{
  if (program == 0)
    rainbowProgram.draw(leds, NUM_LEDS, time);
  else
    starsProgram.draw(leds, NUM_LEDS, time);

  // TODO: remove or add a comment about this
  byte debugCycle = (time / 10) % 3;
  if (debugCycle == 0)
    leds[0].setRGB(10, 0, 20);
  else
    leds[0].setRGB(0, 0, 0);

  FastLED.show();
  time++;
}
