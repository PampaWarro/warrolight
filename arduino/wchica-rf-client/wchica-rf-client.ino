#include <FastLED.h>
#include <RF24.h>
#include <SPI.h>
#include <Warrolight.h>
#include <nRF24L01.h>

// How many leds in your strip?
// #define NUM_LEDS 150
#define NUM_LEDS 150

// For led chips like Neopixels, which have a data line, ground, and power, you
// just need to define DATA_PIN.  For led chipsets that are SPI based (four
// wires - data, clock, ground, and power), like the LPD8806 define both
// DATA_PIN and CLOCK_PIN
#define DATA_PIN 6
#define DATA_PIN2 7

#define RADIO_PAYLOAD_SIZE 32

// Define the array of leds
CRGB leds[NUM_LEDS];

// This variable is persisted even after reseting the arduino. That allows
// cycling through different programs of light
// __attribute__((section(".noinit"))) unsigned int program;

RF24 radio(7, 8); // CE, CSN
// RF24 radio(8, 7); // Para galeras invertidas

bool debugMode = false;

void setup()
{
  randomSeed(analogRead(0));

  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);

  FastLED.setMaxPowerInVoltsAndMilliamps(5, 600);

  for (int i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = CRGB::Black;
  }

  leds[0] = CRGB::Black;
  leds[1] = CRGB::Red;
  leds[2] = CRGB::Green;
  leds[3] = CRGB::Blue;

  FastLED.show();
  // Serial.begin(9600);
  radio.begin();

//   radio.openReadingPipe(0, 0xF0F0F0F0F5);
//   radio.setChannel(72);
//   radio.setChannel(103);

  radio.openReadingPipe(0, 0xF0F0F0F0F0);
//   radio.setChannel(121);
  radio.setChannel(114);

  radio.setPALevel(RF24_PA_HIGH);
  // radio.enableDynamicPayloads();
  radio.setPayloadSize(RADIO_PAYLOAD_SIZE);
  radio.setDataRate(RF24_1MBPS);
  radio.setAutoAck(false);
  radio.startListening();
}

void writeLeds(int pos, byte r, byte g, byte b)
{
  if (pos < 150)
  {
    leds[pos].setRGB(r, g, b);
  }
}

void writeLedsRgb565(int pos, byte ba, byte bb)
{
  int rgb565 = ((int)(ba & 0xff) << 8) | ((int)(bb & 0xff));
  byte b = ((rgb565 & 0x001f)) << 3;
  byte g = ((rgb565 & 0x7E0) >> 5) << 2;
  byte r = ((rgb565) >> 11) << 3;
  writeLeds(pos, r, g, b);
}

int stripSize = NUM_LEDS;

int waitingCounter = 0;
int partsCount = 0;
int lastFrame = 0;
boolean painted = false;

byte data[RADIO_PAYLOAD_SIZE];
unsigned long lastFrameMs = millis();

void loop()
{
  int ledSize = 3;

  unsigned long nowMs = millis();

  if (radio.available())
  {
    while (radio.available())
    {                                  // While there is data ready
      radio.read(&data, sizeof(data)); // Get the payload
    }

    int pos = data[0];

    // Reserved special position to indicate a configuration packet
    if(pos == 255) {
      debugMode = data[1] > 0;
      return;
    }

    byte frame = data[1];
    // Serial.print("Received ");
    // Serial.println(pos);

    if (frame != lastFrame)
    {
      if (painted)
      {
        painted = false;
      }
      else
      {
        painted = true;
        partsCount = 0;
        /*for (int i = 0; i < 75; i+=1) {
          writeLeds(i, 255,0,0);
        }*/
        // Show whatever is in the buffer, clearly the end of last frame was
        // lost Mark second led with purple dot
        // writeLeds(1, 200,0,255);
        FastLED.show();
      }
    }
    lastFrame = frame;
    partsCount++;

    int offset = data[0];
    for (int i = 2; i + 2 < RADIO_PAYLOAD_SIZE; i += ledSize)
    {
      if (ledSize == 3)
      {
        writeLeds(offset + i / ledSize, data[i], data[i + 1], data[i + 2]);
      }
      else if (ledSize == 2)
      {
        writeLedsRgb565(offset + i / ledSize, data[i], data[i + 1]);
      }
    }

    if ((offset + 30 / ledSize) > 145)
    {

      // For debugging lost packets in the frame
      /*if(partsCount != 15) {
        for (int i = 0; i < 20; i+=1) {
          writeLeds(i, 255,0,0);
        }
      }*/

      partsCount = 0;
      FastLED.show();
      //FastLED.show();
      painted = true;

      // If in debug mode, pre-fill all leds in red so that sections missed by missing packets are easily visible
      if(debugMode) {
        for (int k = 0; k < NUM_LEDS;k++) {
          leds[k].setRGB(255, 0, 0);
        }
      }
    }
    lastFrameMs = nowMs;
  }
  else
  {
    long timeSinceLastSignal = (nowMs - lastFrameMs);
    if (timeSinceLastSignal > 3000)
    {
      // Indicate no signal in more than 3 seconds
      byte ledToTurnOn = 0;
      if (timeSinceLastSignal % 300 > 150)
      {
        ledToTurnOn = 1;
      }

      writeLeds(ledToTurnOn, 255, 0, 0);
      writeLeds((ledToTurnOn + 1) % 2, 0, 0, 0);
      writeLeds(2, 0, 0, 0);
      writeLeds(3, 0, 0, 0);
      FastLED.show();
    }
    /*if((nowMs - lastFrame) > 1000) {
      arduinoProgram();
      FastLED.show();
    } */
  }
}
