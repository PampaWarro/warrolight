#include <Warrolight.h>

void Stars::setup()
{
  memset(m_stars, 0, sizeof(m_stars));
  memset(m_starsColors, 0, sizeof(m_starsColors));
  memset(m_starsSaturation, 0, sizeof(m_starsSaturation));
  int i = random(0, 1000);
  m_chance = 1000 - i;
  m_decay = 9999 - i;
  m_tone = random(0, 255);
  m_init = true;
}

void Stars::draw(CRGB *leds, unsigned int numLeds, unsigned long time)
{
  if (!m_init)
  {
    setup();
  }

  for (unsigned int i = 0; i < numLeds; i++)
  {
    if (random(0, m_chance) == 0)
    {
      m_stars[i] = min(255, (int)m_stars[i] + (int)random(20, 255));
      m_starsColors[i] = random(0, 10) + (time / 10 % 255);
      m_starsSaturation[i] = random(0, 150) + 50;
    }
    if (m_stars[i] > 0)
    {
      m_stars[i] = max(0, (int) (((long)m_stars[i]) * m_decay / 10000));
    }

    int h = ((int)m_starsColors[i] + m_tone) % 255;
    int s = m_starsSaturation[i];
    int v = m_stars[i];

    leds[i].setHSV(h, s, v);
  }

  if (time % (60 * 3 * 10) == 0)
  {
    m_init = false;
  }
}

void Rainbow::setup()
{
  //m_speed = random(1, 1);
  m_init = true;
}

void Rainbow::draw(CRGB *leds, unsigned int numLeds, unsigned long time)
{
  if (!m_init)
  {
    setup();
  }

  for (unsigned int i = 0; i < numLeds; i++)
  {
    int h = (i * 2 + time * 3 * m_speed) % 255;
    int s = 255;
    int v = sin8(i * 6 + time * m_speed);

    leds[i].setHSV(h, s, v);
  }
}

void Explosion::setup()
{
  m_intensity = random(5, 25);
  m_life = m_intensity;
  m_center = random(1, 25);
  m_tone = random(1, 255);
  m_saturation = random(0, 255);
  m_init = true;
}

void Explosion::draw(CRGB *leds, unsigned int numLeds, unsigned long time)
{
  if (!m_init || m_life < 0)
  {
    setup();
  }

  for (unsigned int i = 0; i < numLeds; i++)
  {
    int d = abs(i % 25 - m_center);
    if (d < (m_intensity - m_life))
    {
      long fb = min(255, max(0, (255 / m_intensity) * m_life));
      byte b = (byte)round(256 * ((fb / 256.0 * fb / 256.0)));
      leds[i].setHSV(m_tone, m_saturation, b);
    }
    else
    {
      leds[i] = CRGB::Black;
    }
  }

  m_life--;
}

void Pulse::setup()
{
  m_tone = random(1, 255);
  m_speed = random(1, 2);
  m_init = true;
}

void Pulse::draw(CRGB *leds, unsigned int numLeds, unsigned long time)
{
  if (!m_init)
  {
    setup();
  }

  int pulse =
      (int)200 * (sin(time / 30.0 * m_speed * 2) + 1) / 2 + 50;

  for (unsigned int i = 0; i < numLeds; i++)
  {
    leds[i].setHSV(m_tone % 255, 200, pulse);
  }
}

void MultiProgram::setup()
{
  m_program = random(0, MULTIPROGRAM_NUM_PROGRAMS);
  m_init = true;
}

void MultiProgram::setProgram(int program) {
  m_program = program % MULTIPROGRAM_NUM_PROGRAMS;
}

void MultiProgram::draw(CRGB *leds, unsigned int numLeds, unsigned long time)
{
  if (!m_init)
  {
    setup();
  }

  if (time % MULTIPROGRAM_INTERVAL == 0)
  {
    m_program = (m_program + 1) % MULTIPROGRAM_NUM_PROGRAMS;
  }

  switch (m_program)
  {
  case 0:
    m_stars.draw(leds, numLeds, time);
    break;
  case 1:
    m_rainbow.draw(leds, numLeds, time);
    break;
  case 2:
    m_explosion.draw(leds, numLeds, time);
    break;
  case 3:
    m_pulse.draw(leds, numLeds, time);
    break;
  }
}
