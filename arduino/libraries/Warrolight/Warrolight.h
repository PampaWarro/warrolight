#ifndef __INC_WARROLIGHT_H
#define __INC_WARROLIGHT_H

#include <FastLED.h>

// encoding constants
const byte ENCODING_POS_RGB = 1;
const byte ENCODING_POS_VGA = 2;
const byte ENCODING_VGA = 3;
const byte ENCODING_RGB = 4;
const byte ENCODING_RGB565 = 5;

// VGA functions
byte vgaRed(byte vga);
byte vgaBlue(byte vga);
byte vgaGreen(byte vga);

class Stars
{
public:
  void setup();
  void draw(CRGB *leds, unsigned int numLeds, unsigned long time);

private:
  bool m_init = false;

  int m_chance = 1000;
  int m_decay = 9900;
  int m_tone = 0;

  // TODO: assumes 150 leds as strip size
  byte m_stars[150];
  byte m_starsColors[150];
  byte m_starsSaturation[150];
};

class Rainbow
{
public:
  void setup();
  void draw(CRGB *leds, unsigned int numLeds, unsigned long time);

private:
  bool m_init = false;
  int m_speed = 5;
};

class Explosion
{
public:
  void setup();
  void draw(CRGB *leds, unsigned int numLeds, unsigned long time);

private:
  bool m_init = false;

  int m_tone;
  int m_saturation;

  int m_life = 30;
  int m_center = 5;
  int m_intensity = 30;
};

class Pulse
{
public:
  void setup();
  void draw(CRGB *leds, unsigned int numLeds, unsigned long time);

private:
  bool m_init = false;

  int m_tone;
  int m_speed;
};

class MultiProgram
{
public:
  void setup();
  void draw(CRGB *leds, unsigned int numLeds, unsigned long time);

private:
  bool m_init = false;
  int m_program = 0;

#define MULTIPROGRAM_INTERVAL 2000
#define MULTIPROGRAM_NUM_PROGRAMS 4
  Stars m_stars;
  Rainbow m_rainbow;
  Explosion m_explosion;
  Pulse m_pulse;
};

#endif
