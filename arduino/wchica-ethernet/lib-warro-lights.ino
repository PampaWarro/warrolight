#include <FastLED.h>
#include <Warrolight.h>

#define STRIP_NUM_LEDS 150

int NUM_LEDS = STRIP_NUM_LEDS;

#define DATA_PIN 6
#define DATA_PIN2 7

// Define the array of leds
CRGB leds[STRIP_NUM_LEDS];

void setupLeds(int numLeds, int dataPin1, int dataPin2)
{
  NUM_LEDS = numLeds;

  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, 0, STRIP_NUM_LEDS);
  FastLED.addLeds<WS2812B, DATA_PIN2, GRB>(leds, STRIP_NUM_LEDS, STRIP_NUM_LEDS);

  FastLED.setMaxPowerInVoltsAndMilliamps(5, 5000);

  for (int i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = CRGB::Black;
  }

  for (int i = 0; i < 2; i++)
  {
    leds[0 + i * STRIP_NUM_LEDS] = CRGB::Black;
    leds[1 + i * STRIP_NUM_LEDS] = CRGB::Red;
    leds[2 + i * STRIP_NUM_LEDS] = CRGB::Green;
    leds[3 + i * STRIP_NUM_LEDS] = CRGB::Blue;
  }

  FastLED.show();
}

void writeLedFrame(char data[], int offset)
{
  int encoding = data[0 + offset];
  if (encoding == ENCODING_RGB)
  {
    for (int i = 0; i < NUM_LEDS; i++)
    {
      int r = data[1 + i * 3 + offset];
      int g = data[1 + 1 + i * 3 + offset];
      int b = data[1 + 2 + i * 3 + offset];

      leds[i].setRGB(r, g, b);
    }
  }
  else
  {
    Serial.println("Unexpected encoding byte");
  }
  FastLED.show();
}
