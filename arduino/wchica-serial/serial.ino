boolean connected = false;

bool availableFromSerial()
{
  return connected || Serial.available() >= 2;
}

void reconnect()
{
  connected = false;
  drainSerial();
}

void drainSerial()
{
  // Drain incoming bytes
  while (Serial.available() > 0)
    Serial.read();
}

unsigned long lastConnectionTime = millis();

void readLedsFromSerial(CRGB *leds, int numLeds)
{
  if (!connected)
  {
    if (Serial.available() >= 3)
    {
      char a = Serial.read();
      char b = Serial.read();
      char c = Serial.read();
      if (a == 'X' && b == 'X' && c == 'X')
      {
        drainSerial();
        connected = true;
        Serial.println("YEAH");
        lastConnectionTime = millis();
      }
      else
      {
        drainSerial();
        delay(50);
      }
    }
    return;
  }

  if (Serial.available() < 2)
  {
    if ((millis() - lastConnectionTime) > 2000)
    {
      lastConnectionTime = millis();
      delay(500);
      reconnect();
    }
    return;
  }

  lastConnectionTime = millis();

  int encoding = Serial.read();
  int ok = false;

  if (encoding == ENCODING_POS_RGB)
    ok = readPosRGB(leds, numLeds);
  else if (encoding == ENCODING_POS_VGA)
    ok = readPosVGA(leds, numLeds);
  else if (encoding == ENCODING_VGA)
    ok = readVGA(leds, numLeds);
  else if (encoding == ENCODING_RGB)
    ok = readRGB(leds, numLeds);

  if (!ok)
  {
    reconnect();
    return;
  }

  FastLED.show();

  Serial.println("OK");
}

bool readPosRGB(CRGB *leds, int numLeds)
{
  int j = Serial.read();
  char data[4 * j];
  int total = Serial.readBytes(data, 4 * j);
  if (total != 4 * j)
    return false;

  for (int i = 0; i < numLeds; i++)
    leds[i] = CRGB::Black;

  for (int i = 0; i < j; i++)
  {
    int pos = data[0 + i * 4];
    int r = data[1 + i * 4];
    int g = data[2 + i * 4];
    int b = data[3 + i * 4];
    leds[pos].setRGB(r, g, b);
  }
  return true;
}

bool readPosVGA(CRGB *leds, int numLeds)
{
  int j = Serial.read();
  char data[2 * j];
  int total = Serial.readBytes(data, 2 * j);
  if (total != 2 * j)
    return false;

  for (int i = 0; i < numLeds; i++)
    leds[i] = CRGB::Black;

  for (int i = 0; i < j; i++)
  {
    int pos = data[0 + i * 2];
    byte vga = data[1 + i * 2];
    leds[pos].setRGB(vgaRed(vga), vgaGreen(vga), vgaBlue(vga));
  }
  return true;
}

bool readVGA(CRGB *leds, int numLeds)
{
  char data[numLeds];
  int readTotal = Serial.readBytes(data, numLeds);
  if (readTotal != numLeds)
    return false;

  for (int i = 0; i < numLeds; i++)
  {
    byte vga = data[i];
    leds[i].setRGB(vgaRed(vga), vgaGreen(vga), vgaBlue(vga));
  }
  return true;
}

bool readRGB(CRGB *leds, int numLeds)
{
  char data[3 * numLeds];
  int total = Serial.readBytes(data, 3 * numLeds);
  if (total != 3 * numLeds)
    return false;

  for (int i = 0; i < numLeds; i++)
  {
    int r = data[i * 3];
    int g = data[1 + i * 3];
    int b = data[2 + i * 3];
    leds[i].setRGB(r, g, b);
  }

  return true;
}
