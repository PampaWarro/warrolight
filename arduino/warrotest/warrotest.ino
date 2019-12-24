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

void setup()
{
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);

  Serial.begin(1152000 / 2);

  FastLED.showColor(CRGB::Black);

  leds[0] = CRGB::Black;
  leds[1] = CRGB::Red;
  leds[2] = CRGB::Green;
  leds[3] = CRGB::Blue;
  FastLED.show();
}

void loop()
{
  int stripSize = NUM_LEDS;
  if (Serial.available() >= 2)
  {
    int encoding = Serial.read();
    if (encoding == ENCODING_POS_RGB)
    {
      int j = Serial.read();
      char data[4 * j];
      int total = Serial.readBytes(data, 4 * j);
      if (total == 4 * j)
      {
        for (int i = 0; i < stripSize; i++)
        {
          leds[i] = CRGB::Black;
        }
        for (int i = 0; i < j; i++)
        {
          int pos = data[0 + i * 4];
          leds[pos].red = data[1 + i * 4];
          leds[pos].green = data[2 + i * 4];
          leds[pos].blue = data[3 + i * 4];
        }
      }
    }
    else if (encoding == ENCODING_POS_VGA)
    {
      int j = Serial.read();
      char data[2 * j];
      int total = Serial.readBytes(data, 2 * j);
      if (total == 2 * j)
      {
        for (int i = 0; i < stripSize; i++)
        {
          leds[i] = CRGB::Black;
        }
        for (int i = 0; i < j; i++)
        {
          int pos = data[0 + i * 2];
          byte vga = data[1 + i * 2];
          leds[pos].red = vgaRed(vga);
          leds[pos].green = vgaGreen(vga);
          leds[pos].blue = vgaBlue(vga);
        }
      }
    }
    else if (encoding == ENCODING_VGA)
    {
      int j = stripSize;
      char data[j];
      int readTotal = Serial.readBytes(data, j);
      if (readTotal == j)
      {
        for (int i = 0; i < j; i++)
        {
          byte vga = data[i];
          int pos = i;
          leds[pos].red = vgaRed(vga);
          leds[pos].green = vgaGreen(vga);
          leds[pos].blue = vgaBlue(vga);
        }
      }
    }
    else if (encoding == ENCODING_RGB)
    {
      int j = stripSize;
      char data[3 * j];
      int total = Serial.readBytes(data, 3 * j);
      if (total == 3 * j)
      {
        for (int i = 0; i < j; i++)
        {
          int pos = i;
          leds[pos].red = data[i * 3];
          leds[pos].green = data[1 + i * 3];
          leds[pos].blue = data[2 + i * 3];
        }
      }
    }
    FastLED.show();

    Serial.println("OK");
  }
}
