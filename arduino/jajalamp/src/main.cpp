#include <Arduino.h>

//
#define USE_GET_MILLISECOND_TIMER
#include <FastLED.h>
#include <TMC2209.h>
//

#include <ESPNOWPixels.h>
#include <WifiEspNow.h>

#include "gradientPalettes.h"

#define NUM_LEDS 12
#define DATA_PIN D5
static constexpr uint8_t kBroadcastAddress[]{0xff, 0xff, 0xff,
                                             0xff, 0xff, 0xff};
static const uint8_t kClient = random(4);
static constexpr int kChannel = 7;
static constexpr std::string_view kGatewayHostname = "hash-totems-gw";

#define PALETTE_CHANGE_INTERVAL 23
#define ANIMATION_CHANGE_INTERVAL 59

CRGB leds[NUM_LEDS];
std::vector<CRGBPalette16> palettes = {
    gr65_hult_gp,                 //
    es_rivendell_15_gp,           //
    es_ocean_breeze_068_gp,       //
    Colorfull_gp,                 //
    Blue_Cyan_Yellow_gp,          //
    Coral_reef_gp,                //
    PartyColors_p,                //
    OceanColors_p,                //
    retro2_16_gp,                 //
    BlacK_Red_Magenta_Yellow_gp,  //
    es_emerald_dragon_08_gp,      //
    RainbowStripeColors_p,        //
    es_vintage_57_gp,             //
    departure_gp,                 //
    Analogous_1_gp,               //
    es_vintage_01_gp,             //
    lava_gp,                      //
    RainbowColors_p,              //
    fire_gp,                      //
    es_ocean_breeze_036_gp,       //
    ib_jul01_gp,                  //
    GMT_drywet_gp,                //
    BlacK_Magenta_Red_gp,         //
    Magenta_Evening_gp,           //
    rgi_15_gp,                    //
    rainbowsherbet_gp,            //
    LavaColors_p,                 //
    Sunset_Real_gp,               //
    ib15_gp,                      //
    es_landscape_33_gp,           //
    ForestColors_p,               //
    HeatColors_p,                 //
    es_autumn_19_gp,              //
    es_pinksplash_08_gp,          //
    Pink_Purple_gp,               //
    Fuschia_7_gp,                 //
    es_pinksplash_07_gp,          //
    BlacK_Blue_Magenta_White_gp,  //
    gr64_hult_gp,                 //
};
CRGBPalette16 currentPalette = palettes[0];

void sinechase();
void noise16_1();
void plasma();
void sinelon();
void serendipitous();
void sawtooth();
void one_sine_pal();
void juggle_pal();
void inoise8_fire();
void confetti_pal();
void blur();
void rippless();
std::vector<std::function<void()>> animations = {
    sinechase,      //
    rippless,       //
    plasma,         //
    noise16_1,      //
    sinelon,        //
    serendipitous,  //
    sawtooth,       //
    one_sine_pal,   //
    inoise8_fire,   //
    blur,           //
    juggle_pal,     //
    confetti_pal,   //
};

// stepper instantiation
// Instantiate TMC2209
HardwareSerial& serial_stream = Serial1;

const int32_t RUN_VELOCITY = 20000;
const int32_t STOP_VELOCITY = 0;

// current values may need to be reduced to prevent overheating depending on
// specific motor and power supply voltage
const uint8_t RUN_CURRENT_PERCENT = 100;

TMC2209 stepper_driver;
bool invert_direction = false;
int32_t stepper_map_value = 20000;

static constexpr std::string_view kMillisHeader = "MILLIS";
static constexpr size_t kMillisMsgLen =
    /*kMillisHeader.size()=*/6 + WL_MAC_ADDR_LENGTH + sizeof(unsigned long);
static long millis_offset = 0;
static uint8_t my_mac[WL_MAC_ADDR_LENGTH];
static uint8_t millis_mac[WL_MAC_ADDR_LENGTH];
uint32_t get_millisecond_timer() { return millis() + millis_offset; }

std::optional<unsigned long> last_frame_millis;
std::unique_ptr<std::vector<CRGB>> latest_frame = nullptr;

bool handleNewFrame(const CRGB* pixels, size_t length) {
  last_frame_millis = millis();
  auto new_frame = std::make_unique<std::vector<CRGB>>(pixels, pixels + length);
  {
#if defined(ARDUINO_ARCH_ESP32)
    std::lock_guard lock(mutex);
#endif
    latest_frame = std::move(new_frame);
  }
  return true;
}

ESPNOWReceiver espNowReceiver(kGatewayHostname, 150, kClient, handleNewFrame);

bool maybeHandleMillisMsg(const uint8_t* buf, size_t count) {
  if (count != kMillisMsgLen) return false;
  std::string_view header(
      static_cast<const char*>(static_cast<const void*>(buf)),
      kMillisHeader.length());
  if (header != kMillisHeader) return false;
  const uint8_t* mac = buf + kMillisHeader.length();
  const bool same_mac = std::equal(mac, mac + WL_MAC_ADDR_LENGTH, my_mac);
  const uint8_t* msg_millis_bytes = mac + WL_MAC_ADDR_LENGTH;
  unsigned long msg_millis;
  memcpy(&msg_millis, msg_millis_bytes, sizeof(unsigned long));

  unsigned long current_millis = get_millisecond_timer();
  if (msg_millis > current_millis) {
    const unsigned long diff = msg_millis - current_millis;
    if (!same_mac || diff > 1000) {
      millis_offset += diff;
      std::copy(mac, mac + WL_MAC_ADDR_LENGTH, millis_mac);
    }
  }
  return true;
}

void handleMessage(const uint8_t mac[WIFIESPNOW_ALEN], const uint8_t* buf,
                   size_t count, void* arg) {
  if (!maybeHandleMillisMsg(buf, count)) {
    espNowReceiver.handlePacket(mac, buf, count);
  }
}

void setup() {
  Serial.begin(9600);
  Serial.println("\nJoyaBikes 2023");
  Serial.print("Client id: ");
  Serial.println(kClient);
  FastLED.addLeds<WS2812B, DATA_PIN, RBG>(leds, NUM_LEDS);
  FastLED.setMaxPowerInVoltsAndMilliamps(24, 250);
  FastLED.setDither(DISABLE_DITHER);

  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WiFi.macAddress().c_str(), "", kChannel, /*bssid=*/nullptr,
             /*connect=*/false);
  WiFi.disconnect(/*wifioff=*/false);

  Serial.print("MAC address of this node is ");
  Serial.println(WiFi.macAddress());
  Serial.print("WiFi channel is ");
  Serial.println(WiFi.channel());

  WiFi.macAddress(millis_mac);
  WiFi.macAddress(my_mac);

  WifiEspNow.onReceive(handleMessage, nullptr);
  WifiEspNow.begin();
  WifiEspNow.addPeer(kBroadcastAddress);
  // add stepper setup
  stepper_driver.setup(serial_stream);

  stepper_driver.setRunCurrent(RUN_CURRENT_PERCENT);
  stepper_driver.enableCoolStep();
  stepper_driver.enable();
  stepper_driver.moveAtVelocity(20000);
}

void updatePalette();
void draw();
void updateStepperSpeed();
void moveStepper();

void loop() {
  auto frame = std::move(latest_frame);
  if (frame) {
    std::copy(frame->begin(), std::min(frame->end(), frame->begin() + NUM_LEDS),
              leds);
    uint8_t dothue = 0;
    for (int i = 0; i < 4; i++) {
      leds[beatsin16(1 + 1 * i, 0, NUM_LEDS)] |= CHSV(dothue, 128, 64);
      dothue += 64;
    }
    // set to max speed with show.
    // leds[NUM_LEDS -1].b = 254;
    FastLED.show();
  }
  if (!last_frame_millis || millis() - *last_frame_millis > 10000) {
    EVERY_N_MILLIS(17) {
      updatePalette();
      draw();
      // set to max speed with show.
      // I think this is for the 'headless' use case where we just want them to
      // spin
      leds[NUM_LEDS - 1].b = 254;
      FastLED.show();
    }
  }
  EVERY_N_SECONDS(1) {
    auto current_millis = get_millisecond_timer();
    uint8_t millis_msg[kMillisMsgLen];
    size_t offset = 0;
    std::copy(kMillisHeader.data(), kMillisHeader.data() + kMillisHeader.size(),
              millis_msg + offset);
    offset += kMillisHeader.size();
    std::copy(millis_mac, millis_mac + WL_MAC_ADDR_LENGTH, millis_msg + offset);
    offset += WL_MAC_ADDR_LENGTH;
    uint8_t* current_millis_bytes =
        static_cast<uint8_t*>(static_cast<void*>(&current_millis));
    std::copy(current_millis_bytes,
              current_millis_bytes + sizeof(decltype(current_millis)),
              millis_msg + offset);
    for (size_t i = 0; i < 3; ++i) {
      WifiEspNow.send(kBroadcastAddress, millis_msg, kMillisMsgLen);
    }
  }
  EVERY_N_SECONDS(1) {
    auto current_millis = get_millisecond_timer();
    Serial.print("Current millis: ");
    Serial.println(current_millis);
    updateStepperSpeed();
    moveStepper();
  }
}

void updatePalette() {
  uint32_t seconds = get_millisecond_timer() / 1000;
  uint8_t maxChanges = 12;
  auto& targetPalette =
      palettes[(seconds / PALETTE_CHANGE_INTERVAL) % palettes.size()];
  nblendPaletteTowardPalette(currentPalette, targetPalette, maxChanges);
}

void draw() {
  uint32_t seconds = get_millisecond_timer() / 1000;
  auto& animation =
      animations[(seconds / ANIMATION_CHANGE_INTERVAL) % animations.size()];
  animation();
}

void updateStepperSpeed() {
  /*
  // this is a hack.
  // The idea is to just take the blue channel from the last led in the LED
  // array of arrays
  //  If we just bump the number of pixels + 1, we can address that directly in
  //  transmit and use it to  control the stepper speed
  // right now its getting a random value from the pattern and mapping that to a
  // very slow speed range we could also hard code a static value nearby show as
  // commented above, or add to specific patterns to force the last pixel blue
  // channel to a given speed. 20000 is pretty slow but fine and works at a
  // large voltage range
  stepper_map_value = map(leds[NUM_LEDS - 1].b, 0, 255, STOP_VELOCITY, 20000);
  Serial.println(stepper_map_value);
  // we could probably do a direction here using the red or green channel

  if (leds[NUM_LEDS - 1].r <= 100) {
    invert_direction = true;
  }

  // this flips the direction if the above condition sets the flag to true.
  // just a copy of the move at velocity example but it could be better
  if (invert_direction) {
    stepper_driver.enableInverseMotorDirection();
  } else {
    stepper_driver.disableInverseMotorDirection();
  }
  invert_direction = not invert_direction;
*/
}

void moveStepper() {
  // move at velocity
  stepper_driver.moveAtVelocity(stepper_map_value);
}

void rippless() {
#define maxRipples \
  10  // Min is 2 and value has to be divisible by two because each ripple has a
      // left and right component. This cuts down on bouncing code.

  //----------------- Ripple structure definition
  //----------------------------------------------------------------

  struct ripple {  // Reko Meriö's structures

    // Local definitions

    // Persistent local variables

    // Temporary local variables
    uint8_t brightness;  // 0 to 255
    int8_t color;        // 0 to 255
    int16_t pos;         // -1 to NUM_LEDS  (up to 127 LED's)
    int8_t velocity;     // 1 or -1
    uint8_t life;        // 0 to 20
    uint8_t maxLife;     // 10. If it's too long, it just goes on and on. . .
    uint8_t fade;        // 192
    bool exist;          // 0 to 1

    void Move() {
      pos += velocity;
      life++;

      if (pos > NUM_LEDS - 1) {  // Bounce back from far end.
        velocity *= -1;
        pos = NUM_LEDS - 1;
      }

      if (pos < 0) {  // Bounce back from 0.
        velocity *= -1;
        pos = 0;
      }

      brightness =
          scale8(brightness,
                 fade);  // Adjust brightness accordingly to strip length

      if (life > maxLife) exist = false;  // Kill it once it's expired.

    }  // Move()

    void Init(uint8_t Fade, uint8_t MaxLife) {  // Typically 216, 20

      pos = random8(
          NUM_LEDS / 8,
          NUM_LEDS - NUM_LEDS / 8);     // Avoid spawning too close to edge.
      velocity = 1;                     // -1 or 1
      life = 0;                         // 0 to Maxlife
      maxLife = MaxLife;                // 10 called
      exist = true;                     // 0, 1
      brightness = 255;                 // 0 to 255
      color = get_millisecond_timer();  // hue;
      fade = Fade;                      // 192 called

    }  // Init()

  };  // struct ripple

  typedef struct ripple Ripple;

  static Ripple ripples[maxRipples];
  for (int i = 0; i < maxRipples;
       i +=
       2) {  // Check to see if ripple has expired, and if so, create a new one.
    if (random8() > 224 &&
        !ripples[i]
             .exist) {  // Randomly create a new ripple if this one has expired.
      ripples[i].Init(
          192,
          10);  // Initialize the ripple array with Fade and MaxLife values.
      ripples[i + 1] = ripples[i];  // Everything except velocity is the same
                                    // for the ripple's other half. Position
                                    // starts out the same for both halves.
      ripples[i + 1].velocity *=
          -1;  // We want the other half of the ripple to go opposite direction.
    }
  }

  for (int i = 0; i < maxRipples; i++) {  // Move the ripple if it exists
    if (ripples[i].exist) {
      leds[ripples[i].pos] = ColorFromPalette(
          currentPalette, ripples[i].color, ripples[i].brightness, LINEARBLEND);
      ripples[i].Move();
    }
  }

  fadeToBlackBy(leds, NUM_LEDS, 160);
}

void blur() {
  uint8_t blurAmount = dim8_raw(beatsin8(
      3, 64, 192));  // A sinewave at 3 Hz with values ranging from 64 to 192.
  blur1d(leds, NUM_LEDS,
         blurAmount);  // Apply some blurring to whatever's already on the
                       // strip, which will eventually go black.

  uint16_t i = beatsin16(9, 0, NUM_LEDS);
  uint16_t j = beatsin16(7, 0, NUM_LEDS);
  uint16_t k = beatsin16(5, 0, NUM_LEDS);

  // The color of each point shifts over time, each at a different speed.
  uint16_t ms = get_millisecond_timer();
  leds[(i + j) / 2] = CHSV(ms / 29, 100, 255);
  leds[(j + k) / 2] = CHSV(ms / 41, 100, 255);
  leds[(k + i) / 2] = CHSV(ms / 73, 100, 255);
  leds[(k + i + j) / 3] = CHSV(ms / 53, 200, 255);
}

void confetti_pal() {
  static uint8_t thisfade =
      8;  // How quickly does it fade? Lower = slower fade rate.
  static int thishue = 50;       // Starting hue.
  static uint8_t thisinc = 1;    // Incremental value for rotating hues
  static uint8_t thisbri = 255;  // Brightness of a sequence. Remember,
                                 // max_bright is the overall limiter.
  static int huediff = 256;      // Range of random #'s to use for hue
  fadeToBlackBy(leds, NUM_LEDS, thisfade);  // Low values = slower fade.
  int pos = random16(NUM_LEDS);             // Pick an LED at random.
  leds[pos] = ColorFromPalette(currentPalette, thishue + random16(huediff) / 4,
                               thisbri, LINEARBLEND);
  thishue = thishue + thisinc;  // It increments here.
}

void inoise8_fire() {
  static uint32_t xscale = 20;  // How far apart they are
  static uint32_t yscale = 1;   // How fast they move
  static uint8_t index = 0;

  for (int i = 0; i < NUM_LEDS; i++) {
    index = inoise8(i * xscale, get_millisecond_timer() * yscale * NUM_LEDS /
                                    255);  // X location is constant, but we
                                           // move along the Y at the rate of
                                           // get_millisecond_timer()
    leds[i] = ColorFromPalette(
        currentPalette, min(i * (index) >> 6, 255), 255,
        LINEARBLEND);  // With that value, look up the 8 bit colour palette
                       // value and assign it to the current LED.
  }  // The higher the value of i => the higher up the palette index (see
     // palette definition). Also, the higher the value of i => the brighter the
     // LED.
}

void juggle_pal() {  // Several colored dots, weaving in and out of sync with
                     // each other
  static uint8_t numdots = 32;  // Number of dots in use.
  static uint8_t thisfade =
      8;  // How long should the trails be. Very low value = longer trails.
  static uint8_t thisdiff = 16;  // Incremental change in hue between each dot.
  static uint8_t thishue = 0;    // Starting hue.
  static uint8_t curhue = 0;     // The current hue
  static uint8_t thisbright = 255;  // How bright should the LED/display be.
  static uint8_t thisbeat = 5;      // Higher = faster movement.

  uint8_t secondHand = (get_millisecond_timer() / 1000) %
                       30;  // IMPORTANT!!! Change '30' to a different value
                            // to change duration of the loop.
  static uint8_t lastSecond = 99;  // Static variable, means it's only defined
                                   // once. This is our 'debounce' variable.

  if (lastSecond !=
      secondHand) {  // Debounce to make sure we're not repeating an assignment.
    lastSecond = secondHand;
    switch (secondHand) {
      case 0:
        numdots = 1;
        thisbeat = 3;
        thisdiff = 16;
        thisfade = 2;
        thishue = 0;
        break;  // You can change values here, one at a time , or altogether.
      case 10:
        numdots = 4;
        thisbeat = 2;
        thisdiff = 16;
        thisfade = 8;
        thishue = 128;
        break;
      case 20:
        numdots = 8;
        thisbeat = 1;
        thisdiff = 0;
        thisfade = 8;
        thishue = random8();
        break;  // Only gets called once, and not continuously for the next
                // several seconds. Therefore, no rainbows.
      case 30:
        break;
    }
  }

  curhue = thishue;  // Reset the hue values.
  fadeToBlackBy(leds, NUM_LEDS, thisfade);

  for (int i = 0; i < numdots; i++) {
    leds[beatsin16(thisbeat + i, 0, NUM_LEDS)] +=
        ColorFromPalette(currentPalette, curhue, thisbright,
                         LINEARBLEND);  // Munge the values and pick a
                                        // colour from the palette
    curhue += thisdiff;
  }
}

void one_sine_pal() {  // This is the heart of this program. Sure is short.
#define qsubd(x, b) \
  ((x > b) ? b : 0)  // Digital unsigned subtraction macro. if result <0, then
                     // => 0. Otherwise, take on fixed value.
#define qsuba(x, b) \
  ((x > b) ? x - b  \
           : 0)  // Analog Unsigned subtraction macro. if result <0, then => 0

  static int8_t thisspeed =
      8;  // You can change the speed of the wave, and use negative values.
  static uint8_t allfreq =
      32;  // You can change the frequency, thus distance between bars.
  static int thisphase = 0;  // Phase change value gets calculated.
  static uint8_t thiscutoff =
      192;  // You can change the cutoff value to display this wave. Lower value
            // = longer wave.
  static uint8_t bgclr = 0;      // A rotating background colour.
  static uint8_t bgbright = 10;  // Brightness of background colour

  uint8_t colorIndex = get_millisecond_timer() >> 4;

  thisphase += thisspeed;  // You can change direction and speed individually.

  for (int k = 0; k < NUM_LEDS - 1;
       k++) {  // For each of the LED's in the strand, set a brightness based on
               // a wave as follows:
    int thisbright =
        qsubd(cubicwave8((k * allfreq) + thisphase),
              thiscutoff);  // qsub sets a minimum value called thiscutoff. If <
                            // thiscutoff, then bright = 0. Otherwise, bright =
                            // 128 (as defined in qsub)..
    leds[k] =
        CHSV(bgclr, 255,
             bgbright);  // First set a background colour, but fully saturated.
    leds[k] +=
        ColorFromPalette(currentPalette, colorIndex, thisbright,
                         LINEARBLEND);  // Let's now add the foreground colour.
    colorIndex += 3;
  }

  bgclr++;
}

void sawtooth() {
  fadeToBlackBy(leds, NUM_LEDS, 3);
  int bpm = 10;
  int ms_per_beat =
      60000 / bpm;  // 500ms per beat, where 60,000 = 60 seconds * 1000 ms
  int ms_per_led = 60000 / bpm / NUM_LEDS;

  int cur_led = ((get_millisecond_timer() % ms_per_beat) / ms_per_led) %
                (NUM_LEDS);  // Using millis to count up the strand, with
                             // %NUM_LEDS at the end as a safety factor.

  leds[cur_led] =
      ColorFromPalette(currentPalette, 0, 255,
                       LINEARBLEND);  // I prefer to use palettes instead
                                      // of CHSV or CRGB assignments.
}

void serendipitous() {
  static uint16_t Xorig = 0x012;
  static uint16_t Yorig = 0x015;
  static uint16_t X = Xorig;
  static uint16_t Y = Yorig;
  static uint16_t Xn;
  static uint16_t Yn;
  static uint8_t index;

  EVERY_N_SECONDS(5) {
    X = Xorig;
    Y = Yorig;
  }

  //  Xn = X-(Y/2); Yn = Y+(Xn/2);
  //  Xn = X-Y/2;   Yn = Y+Xn/2;
  //  Xn = X-(Y/2); Yn = Y+(X/2.1);
  Xn = X - (Y / 3);
  Yn = Y + (X / 1.5);
  //  Xn = X-(2*Y); Yn = Y+(X/1.1);

  X = Xn;
  Y = Yn;

  index = (sin8(X) + cos8(Y)) / 2;  // Guarantees maximum value of 255

  CRGB newcolor = ColorFromPalette(currentPalette, index, 255, LINEARBLEND);

  //  nblend(leds[X%NUM_LEDS-1], newcolor, 224);          // Try and smooth it
  //  out a bit. Higher # means less smoothing.
  nblend(leds[map(X, 0, 65535, 0, NUM_LEDS)], newcolor,
         224);  // Try and smooth it out a bit. Higher # means less smoothing.

  fadeToBlackBy(leds, NUM_LEDS, 6);  // 8 bit, 1 = slow, 255 = fast
}

void sinelon() {  // a colored dot sweeping back and forth, with fading trails
  static uint8_t thisbeat = 23;  // Beats per minute for first part of dot.
  static uint8_t thatbeat = 28;  // Combined the above with this one.
  static uint8_t thisfade =
      32;  // How quickly does it fade? Lower = slower fade rate.
  static uint8_t thisbri = 255;  // Brightness of a sequence.
  static int myhue = 0;

  fadeToBlackBy(leds, NUM_LEDS, thisfade);
  int pos1 = beatsin16(thisbeat, 0, NUM_LEDS);
  int pos2 = beatsin16(thatbeat, 0, NUM_LEDS);

  leds[(pos1 + pos2) / 2] +=
      ColorFromPalette(currentPalette, myhue++, thisbri, LINEARBLEND);
}

void plasma() {  // This is the heart of this program. Sure is short. . . and
                 // fast.

  int thisPhase =
      beatsin8(6, -64, 64);  // Setting phase change for a couple of waves.
  int thatPhase = beatsin8(7, -64, 64);

  for (int k = 0; k < NUM_LEDS;
       k++) {  // For each of the LED's in the strand, set a brightness based on
               // a wave as follows:

    int colorIndex = cubicwave8((k * 23) + thisPhase) / 2 +
                     cos8((k * 15) + thatPhase) /
                         2;  // Create a wave and add a phase change and add
                             // another wave with its own phase change.. Hey,
                             // you can even change the frequencies if you wish.
    int thisBright = qsuba(
        colorIndex,
        beatsin8(8, 0, 96));  // qsub gives it a bit of 'black' dead space by
                              // setting sets a minimum value. If colorIndex <
                              // current value of beatsin8(), then bright = 0.
                              // Otherwise, bright = colorIndex..

    leds[k] =
        ColorFromPalette(currentPalette, colorIndex, thisBright,
                         LINEARBLEND);  // Let's now add the foreground colour.
  }
}

void noise16_1() {  // moves a noise up and down while slowly shifting to the
                    // side

  static uint16_t scale = 1000;  // the "zoom factor" for the noise

  for (uint16_t i = 0; i < NUM_LEDS; i++) {
    uint16_t shift_x =
        beatsin8(5);  // the x position of the noise field swings @ 17 bpm
    uint16_t shift_y = get_millisecond_timer() /
                       100;  // the y position becomes slowly incremented

    uint16_t real_x =
        (i + shift_x) *
        scale;  // the x position of the noise field swings @ 17 bpm
    uint16_t real_y =
        (i + shift_y) * scale;  // the y position becomes slowly incremented
    uint32_t real_z = get_millisecond_timer() *
                      20;  // the z position becomes quickly incremented

    uint8_t noise = inoise16(real_x, real_y, real_z) >>
                    8;  // get the noise data and scale it down

    uint8_t index = sin8(noise * 3);  // map LED color based on noise data
    uint8_t bri = noise;

    leds[i] = ColorFromPalette(
        currentPalette, index, bri,
        LINEARBLEND);  // With that value, look up the 8 bit colour palette
                       // value and assign it to the current LED.
  }
}

void sinechase() {
  fadeToBlackBy(leds, NUM_LEDS, 40);
  uint8_t dothue = 0;
  for (int i = 0; i < 8; i++) {
    leds[(i * NUM_LEDS / 8 + beatsin16(1 + i, 0, 2 * NUM_LEDS)) % NUM_LEDS] |=
        CHSV(dothue, 200, 255);
    dothue += 32;
  }
}
