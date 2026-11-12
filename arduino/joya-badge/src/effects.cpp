// The twelve JoyaBikes 2023 animations, each in two versions:
//  - strip: the original, which treats the 13 LEDs as a line in chain order
//  - badge: the same animation driven by each LED's x, y on the badge
// Time comes from get_millisecond_timer() (the synced, speed scaled clock),
// so five badges in a room show the same thing at the same moment.

#include "effects.h"

#include <math.h>

const char* const kEffectNames[kNumEffects] = {
    "Chase", "Ripples", "Plasma", "Noise", "Sinelon", "Serendipity",
    "Sweep", "Bars",    "Fire",   "Blur",  "Juggle",  "Confetti"};

// ---------------------------------------------------------------------------
// Geometry from Faceted_Badge.kicad_pcb (mm). Chain order D1..D13: one LED in
// the top row, then 2, 3, 4, 3 on a diamond lattice with 9 mm steps.
// ---------------------------------------------------------------------------
static constexpr float kLedX[NUM_LEDS] = {37.5, 28.5, 46.5, 19.5, 37.5, 55.5, 10.5,
                                          28.5, 46.5, 64.5, 19.5, 37.5, 55.5};
static constexpr float kLedY[NUM_LEDS] = {8,  17, 17, 26, 26, 26, 37.5,
                                          37.5, 37.5, 37.5, 48, 48, 48};
static constexpr float kCX = 37.5f, kCY = 28.0f;
// Normalised -1..1 over the LED box.
static float NX[NUM_LEDS], NY[NUM_LEDS];
// The ten outer LEDs clockwise from the top.
static constexpr uint8_t kRim[10] = {0, 2, 5, 9, 12, 11, 10, 6, 3, 1};
// Lattice neighbours: closer than 15.5 mm.
static uint8_t neigh[NUM_LEDS][6];
static uint8_t neighCount[NUM_LEDS];

static constexpr float kTwoPi = 6.28318530718f;

void effectsInit() {
  for (int i = 0; i < NUM_LEDS; i++) {
    NX[i] = (kLedX[i] - kCX) / 27.0f;
    NY[i] = (kLedY[i] - kCY) / 20.0f;
    neighCount[i] = 0;
    for (int j = 0; j < NUM_LEDS; j++) {
      if (j == i) continue;
      const float dx = kLedX[i] - kLedX[j], dy = kLedY[i] - kLedY[j];
      if (dx * dx + dy * dy < 15.5f * 15.5f && neighCount[i] < 6) {
        neigh[i][neighCount[i]++] = j;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 2D helpers
// ---------------------------------------------------------------------------
// Smooth 0..1 oscillator with the same period as beatsin16(bpm), no quantising.
static float beatf(uint32_t ms, uint16_t bpm, float phase = 0) {
  const uint32_t period = 60000UL / bpm;
  const float u = (ms % period) / static_cast<float>(period);
  return sinf(u * kTwoPi + phase) * 0.5f + 0.5f;
}

// A point on the rim path, t in LED units (0..10 wraps).
static void rimPoint(float t, float& x, float& y) {
  t = fmodf(t, 10.0f);
  if (t < 0) t += 10.0f;
  const int i = static_cast<int>(t);
  const float f = t - i;
  const uint8_t a = kRim[i % 10], b = kRim[(i + 1) % 10];
  x = kLedX[a] + (kLedX[b] - kLedX[a]) * f;
  y = kLedY[a] + (kLedY[b] - kLedY[a]) * f;
}

// Unit square -> a point inside the gem, a few mm in from the edge.
static void inBoard(float sx, float sy, float& x, float& y) {
  const float yy = 7.0f + 42.0f * sy;
  float half = (yy <= 37.5f ? yy : 37.5f - (yy - 37.5f) * (17.0f / 21.8f)) - 6.0f;
  if (half < 2.0f) half = 2.0f;
  x = 37.5f + (sx * 2.0f - 1.0f) * half;
  y = yy;
}

static uint8_t nearest(float x, float y) {
  uint8_t best = 0;
  float bestD = 1e9f;
  for (int i = 0; i < NUM_LEDS; i++) {
    const float dx = x - kLedX[i], dy = y - kLedY[i];
    const float d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

static CRGB scaled(const CRGB& c, float w) {
  return CRGB(static_cast<uint8_t>(c.r * w + 0.5f),
              static_cast<uint8_t>(c.g * w + 0.5f),
              static_cast<uint8_t>(c.b * w + 0.5f));
}

// A point of light at x, y (mm); each LED takes what lands within ~sigma of it.
// add=true adds (saturating), add=false keeps the max per channel.
static void splat(float x, float y, const CRGB& c, float sigma, bool add) {
  const float s2 = 2.0f * sigma * sigma;
  for (int i = 0; i < NUM_LEDS; i++) {
    const float dx = x - kLedX[i], dy = y - kLedY[i];
    const float w = expf(-(dx * dx + dy * dy) / s2);
    if (w < 0.03f) continue;
    const CRGB d = scaled(c, w);
    if (add) {
      leds[i] += d;
    } else {
      leds[i] |= d;
    }
  }
}

// Blur across the lattice: each LED keeps (255-amt)/255 of its light and
// shares the rest equally with its real neighbours.
static void blur2d(uint8_t amt) {
  const uint8_t keep = 255 - amt;
  CRGB out[NUM_LEDS];
  for (int i = 0; i < NUM_LEDS; i++) {
    out[i] = leds[i];
    out[i].nscale8(keep);
  }
  for (int i = 0; i < NUM_LEDS; i++) {
    if (!neighCount[i]) continue;
    const float share = amt / static_cast<float>(neighCount[i]) / 255.0f;
    const CRGB part = scaled(leds[i], share);
    for (int k = 0; k < neighCount[i]; k++) out[neigh[i][k]] += part;
  }
  for (int i = 0; i < NUM_LEDS; i++) leds[i] = out[i];
}

#define qsubd(x, b) ((x > b) ? b : 0)
#define qsuba(x, b) ((x > b) ? x - b : 0)

// ---------------------------------------------------------------------------
// 1. Chase (sinechase)
// ---------------------------------------------------------------------------
static void sinechase_strip() {
  fadeToBlackBy(leds, NUM_LEDS, 40);
  uint8_t dothue = 0;
  for (int i = 0; i < 8; i++) {
    leds[(i * NUM_LEDS / 8 + beatsin16(1 + i, 0, 2 * NUM_LEDS)) % NUM_LEDS] |=
        CHSV(dothue, 200, 255);
    dothue += 32;
  }
}

// Eight hue dots run around the rim, each at its own tempo.
static void sinechase_badge() {
  const uint32_t ms = get_millisecond_timer();
  fadeToBlackBy(leds, NUM_LEDS, 40);
  uint8_t dothue = 0;
  for (int i = 0; i < 8; i++) {
    const float t = i * 10.0f / 8.0f + beatf(ms, 1 + i) * 20.0f;
    float x, y;
    rimPoint(t, x, y);
    splat(x, y, CRGB(CHSV(dothue, 200, 255)), 6.0f, /*add=*/false);
    dothue += 32;
  }
}

// ---------------------------------------------------------------------------
// 2. Ripples (rippless)
// ---------------------------------------------------------------------------
static void rippless_strip() {
#define maxRipples 10
  struct Ripple {
    uint8_t brightness;
    int8_t color;
    int16_t pos;
    int8_t velocity;
    uint8_t life;
    uint8_t maxLife;
    uint8_t fade;
    bool exist;

    void Move() {
      pos += velocity;
      life++;
      if (pos > NUM_LEDS - 1) {
        velocity *= -1;
        pos = NUM_LEDS - 1;
      }
      if (pos < 0) {
        velocity *= -1;
        pos = 0;
      }
      brightness = scale8(brightness, fade);
      if (life > maxLife) exist = false;
    }
    void Init(uint8_t Fade, uint8_t MaxLife) {
      pos = random8(NUM_LEDS / 8, NUM_LEDS - NUM_LEDS / 8);
      velocity = 1;
      life = 0;
      maxLife = MaxLife;
      exist = true;
      brightness = 255;
      color = get_millisecond_timer();
      fade = Fade;
    }
  };
  static Ripple ripples[maxRipples];
  for (int i = 0; i < maxRipples; i += 2) {
    if (random8() > 224 && !ripples[i].exist) {
      ripples[i].Init(192, 10);
      ripples[i + 1] = ripples[i];
      ripples[i + 1].velocity *= -1;
    }
  }
  for (int i = 0; i < maxRipples; i++) {
    if (ripples[i].exist) {
      leds[ripples[i].pos] = ColorFromPalette(
          currentPalette, ripples[i].color, ripples[i].brightness, LINEARBLEND);
      ripples[i].Move();
    }
  }
  fadeToBlackBy(leds, NUM_LEDS, 160);
}

// A ripple starts at a random LED and grows as a ring across the lattice.
static void rippless_badge() {
  struct Ring {
    float x, y;
    uint8_t life, bri, color;
    bool exist;
  };
  static Ring rings[5] = {};
  const uint32_t ms = get_millisecond_timer();
  for (auto& r : rings) {
    if (random8() > 232 && !r.exist) {
      const uint8_t at = random8(NUM_LEDS);
      r.x = kLedX[at];
      r.y = kLedY[at];
      r.life = 0;
      r.exist = true;
      r.bri = 255;
      r.color = ms;
    }
  }
  for (auto& r : rings) {
    if (!r.exist) continue;
    const float rad = r.life * 3.2f;
    const CRGB c = ColorFromPalette(currentPalette, r.color, r.bri, LINEARBLEND);
    for (int i = 0; i < NUM_LEDS; i++) {
      const float dx = r.x - kLedX[i], dy = r.y - kLedY[i];
      const float d = sqrtf(dx * dx + dy * dy);
      const float w = 1.0f - fabsf(d - rad) / 5.0f;
      if (w > 0) leds[i] |= scaled(c, w);
    }
    r.life++;
    r.bri = scale8(r.bri, 200);
    if (r.life > 12) r.exist = false;
  }
  fadeToBlackBy(leds, NUM_LEDS, 120);
}

// ---------------------------------------------------------------------------
// 3. Plasma
// ---------------------------------------------------------------------------
static void plasma_strip() {
  int thisPhase = beatsin8(6, -64, 64);
  int thatPhase = beatsin8(7, -64, 64);
  for (int k = 0; k < NUM_LEDS; k++) {
    int colorIndex =
        cubicwave8((k * 23) + thisPhase) / 2 + cos8((k * 15) + thatPhase) / 2;
    int thisBright = qsuba(colorIndex, beatsin8(8, 0, 96));
    leds[k] = ColorFromPalette(currentPalette, colorIndex, thisBright, LINEARBLEND);
  }
}

// One wave runs across the gem, the other down it, on an axis that turns
// once every 40 s.
static void plasma_badge() {
  const uint32_t ms = get_millisecond_timer();
  const int thisPhase = beatsin8(6, -64, 64);
  const int thatPhase = beatsin8(7, -64, 64);
  const uint8_t cut = beatsin8(8, 0, 96);
  const float th = (ms % 40000UL) / 40000.0f * kTwoPi;
  const float c = cosf(th), s = sinf(th);
  for (int k = 0; k < NUM_LEDS; k++) {
    const float p = (NX[k] * c + NY[k] * s + 1.0f) * 127.5f;
    const float q = (-NX[k] * s + NY[k] * c + 1.0f) * 127.5f;
    const int colorIndex =
        cubicwave8(static_cast<uint8_t>(lroundf(p * 1.2f) + thisPhase)) / 2 +
        cos8(static_cast<uint8_t>(lroundf(q * 0.8f) + thatPhase)) / 2;
    const int thisBright = qsuba(colorIndex, cut);
    leds[k] = ColorFromPalette(currentPalette, colorIndex, thisBright, LINEARBLEND);
  }
}

// ---------------------------------------------------------------------------
// 4. Noise (noise16_1)
// ---------------------------------------------------------------------------
static void noise16_1_strip() {
  static uint16_t scale = 1000;
  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    uint16_t shift_x = beatsin8(5);
    uint16_t shift_y = get_millisecond_timer() / 100;
    uint16_t real_x = (i + shift_x) * scale;
    uint16_t real_y = (i + shift_y) * scale;
    uint32_t real_z = get_millisecond_timer() * 20;
    uint8_t noise = inoise16(real_x, real_y, real_z) >> 8;
    uint8_t index = sin8(noise * 3);
    uint8_t bri = noise;
    leds[i] = ColorFromPalette(currentPalette, index, bri, LINEARBLEND);
  }
}

// Noise sampled at each LED's x, y with a tighter zoom, so patches of colour
// cross the badge.
static void noise16_1_badge() {
  const uint32_t ms = get_millisecond_timer();
  const uint8_t sx = beatsin8(5);
  const float sy = ms / 100.0f;
  for (int i = 0; i < NUM_LEDS; i++) {
    const float u = (kLedX[i] - 10.5f) / 9.0f, v = (kLedY[i] - 8.0f) / 9.0f;
    const uint32_t nx = static_cast<uint32_t>(u * 6000.0f + sx * 1000.0f);
    const uint32_t ny = static_cast<uint32_t>(v * 6000.0f + sy * 1000.0f);
    const uint8_t noise = inoise16(nx, ny, ms * 20) >> 8;
    leds[i] = ColorFromPalette(currentPalette, sin8(noise * 3), noise, LINEARBLEND);
  }
}

// ---------------------------------------------------------------------------
// 5. Sinelon
// ---------------------------------------------------------------------------
static void sinelon_strip() {
  static uint8_t thisbeat = 23;
  static uint8_t thatbeat = 28;
  static uint8_t thisfade = 32;
  static uint8_t thisbri = 255;
  static int myhue = 0;
  fadeToBlackBy(leds, NUM_LEDS, thisfade);
  int pos1 = beatsin16(thisbeat, 0, NUM_LEDS - 1);
  int pos2 = beatsin16(thatbeat, 0, NUM_LEDS - 1);
  leds[(pos1 + pos2) / 2] +=
      ColorFromPalette(currentPalette, myhue++, thisbri, LINEARBLEND);
}

// The two beats drive x and y: a Lissajous curve over the whole badge.
static void sinelon_badge() {
  static uint8_t myhue = 0;
  const uint32_t ms = get_millisecond_timer();
  fadeToBlackBy(leds, NUM_LEDS, 32);
  float x, y;
  inBoard(beatf(ms, 23), beatf(ms, 28), x, y);
  splat(x, y, ColorFromPalette(currentPalette, myhue++, 255, LINEARBLEND), 6.0f,
        /*add=*/true);
}

// ---------------------------------------------------------------------------
// 6. Serendipity (serendipitous)
// ---------------------------------------------------------------------------
static uint16_t serX = 0x012, serY = 0x015;
static CRGB serendipitousStep() {
  static uint16_t Xorig = 0x012;
  static uint16_t Yorig = 0x015;
  EVERY_N_SECONDS(5) {
    serX = Xorig;
    serY = Yorig;
  }
  uint16_t Xn = serX - (serY / 3);
  uint16_t Yn = serY + (serX / 1.5);
  serX = Xn;
  serY = Yn;
  uint8_t index = (sin8(serX) + cos8(serY)) / 2;
  return ColorFromPalette(currentPalette, index, 255, LINEARBLEND);
}

static void serendipitous_strip() {
  CRGB newcolor = serendipitousStep();
  nblend(leds[map(serX, 0, 65535, 0, NUM_LEDS - 1)], newcolor, 224);
  fadeToBlackBy(leds, NUM_LEDS, 6);
}

// X and Y pick a point on the badge, so the mosaic follows the attractor.
static void serendipitous_badge() {
  CRGB newcolor = serendipitousStep();
  float x, y;
  inBoard(serX / 65535.0f, serY / 65535.0f, x, y);
  nblend(leds[nearest(x, y)], newcolor, 224);
  fadeToBlackBy(leds, NUM_LEDS, 6);
}

// ---------------------------------------------------------------------------
// 7. Sweep (sawtooth)
// ---------------------------------------------------------------------------
static void sawtooth_strip() {
  fadeToBlackBy(leds, NUM_LEDS, 3);
  int bpm = 10;
  int ms_per_beat = 60000 / bpm;
  int ms_per_led = 60000 / bpm / NUM_LEDS;
  int cur_led = ((get_millisecond_timer() % ms_per_beat) / ms_per_led) % (NUM_LEDS);
  leds[cur_led] = ColorFromPalette(currentPalette, 0, 255, LINEARBLEND);
}

// A soft line sweeps across the badge and turns 60 degrees each 6 s beat.
static void sawtooth_badge() {
  const uint32_t ms = get_millisecond_timer();
  fadeToBlackBy(leds, NUM_LEDS, 3);
  const uint32_t beat = ms / 6000;
  const float ph = (ms % 6000) / 6000.0f;
  const float th = beat * (kTwoPi / 6.0f);
  const float c = cosf(th), s = sinf(th);
  const float pos = -1.2f + 2.4f * ph;
  const CRGB col = ColorFromPalette(currentPalette, 0, 255, LINEARBLEND);
  for (int i = 0; i < NUM_LEDS; i++) {
    const float p = NX[i] * c + NY[i] * s;
    const float w = 1.0f - fabsf(p - pos) / 0.28f;
    if (w > 0) leds[i] |= scaled(col, w);
  }
}

// ---------------------------------------------------------------------------
// 8. Bars (one_sine_pal)
// ---------------------------------------------------------------------------
static void one_sine_pal_strip() {
  static int8_t thisspeed = 8;
  static uint8_t allfreq = 32;
  static int thisphase = 0;
  static uint8_t thiscutoff = 192;
  static uint8_t bgclr = 0;
  static uint8_t bgbright = 10;
  uint8_t colorIndex = get_millisecond_timer() >> 4;
  thisphase += thisspeed;
  for (int k = 0; k < NUM_LEDS - 1; k++) {
    int thisbright = qsubd(cubicwave8((k * allfreq) + thisphase), thiscutoff);
    leds[k] = CHSV(bgclr, 255, bgbright);
    leds[k] += ColorFromPalette(currentPalette, colorIndex, thisbright, LINEARBLEND);
    colorIndex += 3;
  }
  bgclr++;
}

// Graded bars travel across the badge on an axis that turns once per 30 s.
static void one_sine_pal_badge() {
  static int thisphase = 0;
  static uint8_t bgclr = 0;
  const uint32_t ms = get_millisecond_timer();
  thisphase += 8;
  const uint8_t base = (ms >> 4) & 255;
  const float th = (ms % 30000UL) / 30000.0f * kTwoPi;
  const float c = cosf(th), s = sinf(th);
  for (int k = 0; k < NUM_LEDS; k++) {
    const float p = (NX[k] * c + NY[k] * s) * 3.0f;
    const uint8_t w = cubicwave8(static_cast<uint8_t>(lroundf(p * 32.0f) + thisphase));
    const uint8_t b = w > 150 ? static_cast<uint8_t>(min(255L, lroundf((w - 150) * 2.4f))) : 0;
    leds[k] = CHSV(bgclr, 255, 10);
    leds[k] += ColorFromPalette(currentPalette,
                                static_cast<uint8_t>(base + lroundf(p * 3.0f)), b,
                                LINEARBLEND);
  }
  bgclr++;
}

// ---------------------------------------------------------------------------
// 9. Fire (inoise8_fire)
// ---------------------------------------------------------------------------
static void inoise8_fire_strip() {
  static uint32_t xscale = 20;
  static uint32_t yscale = 1;
  static uint8_t index = 0;
  for (int i = 0; i < NUM_LEDS; i++) {
    index = inoise8(i * xscale, get_millisecond_timer() * yscale * NUM_LEDS / 255);
    leds[i] = ColorFromPalette(currentPalette, min(i * (index) >> 6, 255), 255,
                               LINEARBLEND);
  }
}

// Heat sits in the bottom row and rises with noise: the gem burns from its base.
static void inoise8_fire_badge() {
  const uint32_t ms = get_millisecond_timer();
  for (int i = 0; i < NUM_LEDS; i++) {
    const float yb = (48.0f - kLedY[i]) / 40.0f;
    const uint8_t n = inoise8(static_cast<uint16_t>(kLedX[i] * 5.0f),
                              static_cast<uint16_t>(kLedY[i] * 6.0f + ms / 7));
    const long idx = lroundf((0.12f + 1.35f * (1.0f - yb)) * n);
    leds[i] = ColorFromPalette(currentPalette, static_cast<uint8_t>(min(255L, idx)),
                               255, LINEARBLEND);
  }
}

// ---------------------------------------------------------------------------
// 10. Blur
// ---------------------------------------------------------------------------
static void blur_strip() {
  uint8_t blurAmount = dim8_raw(beatsin8(3, 64, 192));
  blur1d(leds, NUM_LEDS, blurAmount);
  uint16_t i = beatsin16(9, 0, NUM_LEDS - 1);
  uint16_t j = beatsin16(7, 0, NUM_LEDS - 1);
  uint16_t k = beatsin16(5, 0, NUM_LEDS - 1);
  uint16_t ms = get_millisecond_timer();
  leds[(i + j) / 2] = CHSV(ms / 29, 100, 255);
  leds[(j + k) / 2] = CHSV(ms / 41, 100, 255);
  leds[(k + i) / 2] = CHSV(ms / 73, 100, 255);
  leds[(k + i + j) / 3] = CHSV(ms / 53, 200, 255);
}

// Blur along the lattice to real neighbours; the three points wander in 2D.
static void blur_badge() {
  const uint32_t ms32 = get_millisecond_timer();
  const uint16_t ms = ms32;
  blur2d(dim8_raw(beatsin8(3, 64, 192)));
  const float a = beatf(ms32, 9), b = beatf(ms32, 7), c = beatf(ms32, 5);
  float x0, y0, x1, y1, x2, y2;
  inBoard(a, b, x0, y0);
  inBoard(b, c, x1, y1);
  inBoard(c, a, x2, y2);
  leds[nearest(x0, y0)] = CHSV(ms / 29, 100, 255);
  leds[nearest(x1, y1)] = CHSV(ms / 41, 100, 255);
  leds[nearest(x2, y2)] = CHSV(ms / 73, 100, 255);
  leds[nearest((x0 + x1 + x2) / 3.0f, (y0 + y1 + y2) / 3.0f)] = CHSV(ms / 53, 200, 255);
}

// ---------------------------------------------------------------------------
// 11. Juggle (juggle_pal)
// ---------------------------------------------------------------------------
struct JuggleParams {
  uint8_t numdots = 32;
  uint8_t thisfade = 8;
  uint8_t thisdiff = 16;
  uint8_t thishue = 0;
  uint8_t thisbeat = 5;
  uint8_t lastSecond = 99;
  // The 30 s cycle: 1 dot, then 4, then 8.
  void tick() {
    uint8_t secondHand = (get_millisecond_timer() / 1000) % 30;
    if (lastSecond != secondHand) {
      lastSecond = secondHand;
      switch (secondHand) {
        case 0:
          numdots = 1; thisbeat = 3; thisdiff = 16; thisfade = 2; thishue = 0;
          break;
        case 10:
          numdots = 4; thisbeat = 2; thisdiff = 16; thisfade = 8; thishue = 128;
          break;
        case 20:
          numdots = 8; thisbeat = 1; thisdiff = 0; thisfade = 8; thishue = random8();
          break;
        case 30:
          break;
      }
    }
    fadeToBlackBy(leds, NUM_LEDS, thisfade);
  }
};
static JuggleParams juggle;

static void juggle_pal_strip() {
  juggle.tick();
  uint8_t curhue = juggle.thishue;
  for (int i = 0; i < juggle.numdots; i++) {
    leds[beatsin16(juggle.thisbeat + i, 0, NUM_LEDS - 1)] +=
        ColorFromPalette(currentPalette, curhue, 255, LINEARBLEND);
    curhue += juggle.thisdiff;
  }
}

// Each dot orbits the badge at its own tempo.
static void juggle_pal_badge() {
  const uint32_t ms = get_millisecond_timer();
  juggle.tick();
  uint8_t curhue = juggle.thishue;
  for (int i = 0; i < juggle.numdots; i++) {
    float x, y;
    inBoard(beatf(ms, juggle.thisbeat + i),
            beatf(ms, juggle.thisbeat + i, kTwoPi / 4.0f + i * 0.7f), x, y);
    splat(x, y, ColorFromPalette(currentPalette, curhue, 255, LINEARBLEND), 6.0f,
          /*add=*/true);
    curhue += juggle.thisdiff;
  }
}

// ---------------------------------------------------------------------------
// 12. Confetti (confetti_pal): position does not matter, one version.
// ---------------------------------------------------------------------------
static void confetti_pal() {
  static uint8_t thisfade = 8;
  static int thishue = 50;
  static uint8_t thisinc = 1;
  static uint8_t thisbri = 255;
  static int huediff = 256;
  fadeToBlackBy(leds, NUM_LEDS, thisfade);
  int pos = random16(NUM_LEDS);
  leds[pos] = ColorFromPalette(currentPalette, thishue + random16(huediff) / 4,
                               thisbri, LINEARBLEND);
  thishue = thishue + thisinc;
}

// ---------------------------------------------------------------------------
typedef void (*EffectFn)();
static const EffectFn kStrip[kNumEffects] = {
    sinechase_strip,  rippless_strip,      plasma_strip,   noise16_1_strip,
    sinelon_strip,    serendipitous_strip, sawtooth_strip, one_sine_pal_strip,
    inoise8_fire_strip, blur_strip,        juggle_pal_strip, confetti_pal};
static const EffectFn kBadge[kNumEffects] = {
    sinechase_badge,  rippless_badge,      plasma_badge,   noise16_1_badge,
    sinelon_badge,    serendipitous_badge, sawtooth_badge, one_sine_pal_badge,
    inoise8_fire_badge, blur_badge,        juggle_pal_badge, confetti_pal};

void drawEffect(uint8_t index, bool badge) {
  if (index >= kNumEffects) index = 0;
  (badge ? kBadge : kStrip)[index]();
}
