#include <Arduino.h>

#include "effects.h"  // defines USE_GET_MILLISECOND_TIMER before FastLED.h
//
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <ESPNOWPixels.h>
#include <WifiEspNow.h>

#include "gradientPalettes.h"
#include "remote_page.h"

// Faceted Badge Rev D: 13 WS2812B-V6 on GPIO4 (raw pin order, see
// platformio.ini). MODE button (SW3) on GPIO5, 10k pull-up, pressed = LOW.
// Brightness defaults to the stock badge cap; the remote can raise it and the
// 250 mA power limiter below still has the last word.
#define DATA_PIN 4
static constexpr uint8_t kModePin = 5;
static constexpr uint8_t kDefaultBrightness = 32;
// Battery sense: BAT -> R10 1M -> A0 -> R11 220k -> GND; ESP-07S A0 reads 0..1 V.
static constexpr float kBatteryVoltsPerCount = (1000.0f + 220.0f) / 220.0f / 1023.0f;
static constexpr uint8_t kBroadcastAddress[]{0xff, 0xff, 0xff,
                                             0xff, 0xff, 0xff};
static const uint8_t kClient = random(6);
static constexpr int kChannel = 7;
static constexpr std::string_view kGatewayHostname = "joya-totems-gw";

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
static const char* const kPaletteNames[] = {
    "gr65 hult",       "es rivendell 15",      "es ocean breeze 068",
    "Colorfull",       "Blue Cyan Yellow",     "Coral reef",
    "Party",           "Ocean",                "retro2 16",
    "Black Red Magenta Yellow", "es emerald dragon 08", "Rainbow Stripe",
    "es vintage 57",   "departure",            "Analogous 1",
    "es vintage 01",   "lava",                 "Rainbow",
    "fire",            "es ocean breeze 036",  "ib jul01",
    "GMT drywet",      "Black Magenta Red",    "Magenta Evening",
    "rgi 15",          "rainbowsherbet",       "Lava",
    "Sunset Real",     "ib15",                 "es landscape 33",
    "Forest",          "Heat",                 "es autumn 19",
    "es pinksplash 08", "Pink Purple",         "Fuschia 7",
    "es pinksplash 07", "Black Blue Magenta White", "gr64 hult",
};
CRGBPalette16 currentPalette = palettes[0];

// ---------------------------------------------------------------------------
// Clocks. synced_ms() is the clock the badges agree on over ESP-NOW (MILLIS
// messages, unchanged from JoyaBikes). get_millisecond_timer() is what the
// animations see: the synced clock scaled by the remote's speed setting, and
// continuous across speed changes, so every badge computes the same frame.
// ---------------------------------------------------------------------------
static long millis_offset = 0;
static uint32_t synced_ms() { return millis() + millis_offset; }

struct State {
  uint8_t effect = 0;
  uint8_t pal = 0;
  uint8_t bri = kDefaultBrightness;
  uint16_t speed100 = 100;  // 25..300, percent
  bool autoCycle = true;
  bool power = true;
  bool badgeMap = true;  // true: 2D versions, false: strip versions
  uint32_t stampMs = 0;  // synced_ms() when this state was set
  uint32_t stampVt = 0;  // animation time at that moment
};
static State state;

uint32_t get_millisecond_timer() {
  const uint32_t now = synced_ms();
  const uint32_t d = now > state.stampMs ? now - state.stampMs : 0;
  return state.stampVt + static_cast<uint32_t>((static_cast<uint64_t>(d) * state.speed100) / 100);
}

static uint8_t effectiveEffect() {
  if (!state.autoCycle) return state.effect;
  return (get_millisecond_timer() / 1000 / ANIMATION_CHANGE_INTERVAL) % kNumEffects;
}
static uint8_t effectivePalette() {
  if (!state.autoCycle) return state.pal;
  return (get_millisecond_timer() / 1000 / PALETTE_CHANGE_INTERVAL) % palettes.size();
}

static void applyState() { FastLED.setBrightness(state.bri); }
static void sendState(int times);
static void printState(const char* why) {
  Serial.printf("State (%s): effect=%u pal=%u bri=%u speed=%u%% auto=%d power=%d map=%s\n",
                why, effectiveEffect(), effectivePalette(), state.bri, state.speed100,
                state.autoCycle, state.power, state.badgeMap ? "badge" : "strip");
}
// Every change to `state` goes: snapshot the clocks, edit, commit. The
// snapshot must come first because the animation clock depends on the speed
// being edited; stamping it keeps the animation continuous.
struct Clocks {
  uint32_t vt, now;
};
static Clocks clocksNow() { return {get_millisecond_timer(), synced_ms()}; }
static void commitState(Clocks before, const char* why) {
  state.stampVt = before.vt;
  state.stampMs = before.now;
  applyState();
  sendState(3);
  printState(why);
}

// ---------------------------------------------------------------------------
// ESP-NOW: MILLIS clock sync (as before), STATE sync (new), gateway pixels.
// ---------------------------------------------------------------------------
static constexpr std::string_view kMillisHeader = "MILLIS";
static constexpr size_t kMillisMsgLen =
    /*kMillisHeader.size()=*/6 + WL_MAC_ADDR_LENGTH + sizeof(unsigned long);
static uint8_t my_mac[WL_MAC_ADDR_LENGTH];
static uint8_t millis_mac[WL_MAC_ADDR_LENGTH];

struct __attribute__((packed)) StateMsg {
  char header[5];  // "STATE"
  uint8_t version;
  uint8_t effect, pal, bri;
  uint16_t speed100;
  uint8_t flags;  // bit0 auto, bit1 power, bit2 badge map
  uint32_t stampMs, stampVt;
};
static constexpr uint8_t kStateVersion = 1;

static void sendState(int times) {
  StateMsg m;
  memcpy(m.header, "STATE", 5);
  m.version = kStateVersion;
  m.effect = state.effect;
  m.pal = state.pal;
  m.bri = state.bri;
  m.speed100 = state.speed100;
  m.flags = (state.autoCycle ? 1 : 0) | (state.power ? 2 : 0) | (state.badgeMap ? 4 : 0);
  m.stampMs = state.stampMs;
  m.stampVt = state.stampVt;
  for (int i = 0; i < times; ++i) {
    WifiEspNow.send(kBroadcastAddress, reinterpret_cast<const uint8_t*>(&m), sizeof m);
  }
}

static bool maybeHandleStateMsg(const uint8_t* buf, size_t count) {
  if (count != sizeof(StateMsg)) return false;
  StateMsg m;
  memcpy(&m, buf, sizeof m);
  if (memcmp(m.header, "STATE", 5) != 0) return false;
  if (m.version != kStateVersion) return true;
  if (m.stampMs <= state.stampMs) return true;  // ours is as new or newer
  const uint32_t now = synced_ms();
  if (m.stampMs > now) millis_offset += m.stampMs - now;  // their clock is ahead
  state.effect = m.effect < kNumEffects ? m.effect : 0;
  state.pal = m.pal < palettes.size() ? m.pal : 0;
  state.bri = m.bri ? m.bri : 1;
  state.speed100 = constrain(m.speed100, 25, 300);
  state.autoCycle = m.flags & 1;
  state.power = m.flags & 2;
  state.badgeMap = m.flags & 4;
  state.stampMs = m.stampMs;
  state.stampVt = m.stampVt;
  applyState();
  printState("from another badge");
  return true;
}

std::optional<unsigned long> last_frame_millis;
std::unique_ptr<std::vector<CRGB>> latest_frame = nullptr;

bool handleNewFrame(const CRGB* pixels, size_t length) {
  last_frame_millis = millis();
  auto new_frame = std::make_unique<std::vector<CRGB>>(pixels, pixels + length);
  latest_frame = std::move(new_frame);
  return true;
}

ESPNOWReceiver espNowReceiver(kGatewayHostname, NUM_LEDS, kClient,
                              handleNewFrame);

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

  unsigned long current_millis = synced_ms();
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
  if (maybeHandleMillisMsg(buf, count)) return;
  if (maybeHandleStateMsg(buf, count)) return;
  espNowReceiver.handlePacket(mac, buf, count);
}

static void sendMillisMsg() {
  auto current_millis = synced_ms();
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

// ---------------------------------------------------------------------------
// Web remote on the badge's own WiFi: http://joya.local/ (mDNS for iPhone and
// Mac; the wildcard DNS below answers it for Android) or http://192.168.4.1/
// ---------------------------------------------------------------------------
static ESP8266WebServer server(80);
static DNSServer dns;
static const IPAddress kApIp(192, 168, 4, 1);
static constexpr const char* kHostname = "joya";
static String ssid;

static void sendStateJson() {
  char buf[200];
  snprintf(buf, sizeof buf,
           "{\"name\":\"%s\",\"effect\":%u,\"pal\":%u,\"bri\":%u,\"speed\":%u,"
           "\"auto\":%d,\"power\":%d,\"map\":%d}",
           ssid.c_str(), effectiveEffect(), effectivePalette(), state.bri,
           state.speed100, state.autoCycle, state.power, state.badgeMap);
  server.send(200, "application/json", buf);
}

static void handleSet() {
  const Clocks before = clocksNow();
  const uint8_t curEffect = effectiveEffect();
  const uint8_t curPal = effectivePalette();
  bool changed = false;
  if (server.hasArg("effect")) {
    const long e = server.arg("effect").toInt();
    if (e >= 0 && e < kNumEffects) {
      if (state.autoCycle) state.pal = curPal;  // freeze the palette too
      state.effect = e;
      state.autoCycle = false;
      changed = true;
    }
  }
  if (server.hasArg("pal")) {
    const long p = server.arg("pal").toInt();
    if (p >= 0 && p < static_cast<long>(palettes.size())) {
      if (state.autoCycle) state.effect = curEffect;
      state.pal = p;
      state.autoCycle = false;
      changed = true;
    }
  }
  if (server.hasArg("bri")) {
    state.bri = constrain(server.arg("bri").toInt(), 1, 255);
    changed = true;
  }
  if (server.hasArg("speed")) {
    state.speed100 = constrain(server.arg("speed").toInt(), 25, 300);
    changed = true;
  }
  if (server.hasArg("auto")) {
    state.autoCycle = server.arg("auto").toInt() != 0;
    changed = true;
  }
  if (server.hasArg("power")) {
    state.power = server.arg("power").toInt() != 0;
    changed = true;
  }
  if (server.hasArg("map")) {
    state.badgeMap = server.arg("map").toInt() != 0;
    changed = true;
  }
  if (changed) commitState(before, "remote");
  sendStateJson();
}

// 39 palettes as 16 hex colours each, streamed so it never needs a big buffer.
static void handlePalettes() {
  server.setContentLength(CONTENT_LENGTH_UNKNOWN);
  server.send(200, "application/json", "");
  String chunk;
  chunk.reserve(200);
  for (size_t i = 0; i < palettes.size(); i++) {
    chunk = i ? ",{\"n\":\"" : "[{\"n\":\"";
    chunk += kPaletteNames[i];
    chunk += "\",\"c\":[";
    for (int k = 0; k < 16; k++) {
      const CRGB c = palettes[i].entries[k];
      char hex[10];
      snprintf(hex, sizeof hex, "%s\"%02x%02x%02x\"", k ? "," : "", c.r, c.g, c.b);
      chunk += hex;
    }
    chunk += "]}";
    server.sendContent(chunk);
  }
  server.sendContent("]");
  server.sendContent("");
}

static void handleNotFound() {
  // Captive portal: any other host (the phone's connectivity check) lands on
  // the remote.
  if (server.hostHeader() != kApIp.toString()) {
    server.sendHeader("Location", String("http://") + kApIp.toString() + "/", true);
    server.send(302, "text/plain", "");
    return;
  }
  server.send(404, "text/plain", "not found");
}

static void setupRemote() {
  WiFi.softAPConfig(kApIp, kApIp, IPAddress(255, 255, 255, 0));
  WiFi.softAP(ssid.c_str(), nullptr, kChannel, false, 4);
  dns.setErrorReplyCode(DNSReplyCode::NoError);
  dns.start(53, "*", kApIp);
  server.on("/", HTTP_GET, [] { server.send_P(200, PSTR("text/html"), kRemotePage); });
  server.on("/api/state", HTTP_GET, sendStateJson);
  server.on("/api/set", handleSet);
  server.on("/api/palettes", HTTP_GET, handlePalettes);
  server.onNotFound(handleNotFound);
  server.begin();
  if (MDNS.begin(kHostname, kApIp)) MDNS.addService("http", "tcp", 80);
}

// ---------------------------------------------------------------------------
// MODE button: press = next effect (auto off), hold 0.8 s = auto cycle on.
// ---------------------------------------------------------------------------
static void pollModeButton() {
  static uint32_t lastSample = 0, pressedAt = 0;
  static bool wasDown = false, longFired = false;
  const uint32_t now = millis();
  if (now - lastSample < 10) return;
  lastSample = now;
  const bool down = digitalRead(kModePin) == LOW;
  if (down && !wasDown) {
    pressedAt = now;
    longFired = false;
  }
  if (down && !longFired && now - pressedAt >= 800) {
    longFired = true;
    const Clocks before = clocksNow();
    state.autoCycle = true;
    state.power = true;
    commitState(before, "MODE hold");
  }
  if (!down && wasDown && !longFired && now - pressedAt >= 30) {
    const Clocks before = clocksNow();
    state.effect = (effectiveEffect() + 1) % kNumEffects;
    state.pal = effectivePalette();
    state.autoCycle = false;
    state.power = true;
    commitState(before, "MODE press");
  }
  wasDown = down;
}

// ---------------------------------------------------------------------------
void setup() {
  Serial.begin(9600);
  Serial.println("\nJoyaBikes 2023 (Faceted Badge) + remote");
  Serial.print("Client id: ");
  Serial.println(kClient);
  pinMode(kModePin, INPUT_PULLUP);
  effectsInit();
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 250);
  FastLED.setBrightness(state.bri);
  FastLED.setDither(DISABLE_DITHER);

  WiFi.persistent(false);
  WiFi.mode(WIFI_AP_STA);
  WiFi.setAutoConnect(false);
  WiFi.setAutoReconnect(false);
  WiFi.macAddress(my_mac);
  WiFi.macAddress(millis_mac);
  char tail[6];
  snprintf(tail, sizeof tail, "%02X%02X", my_mac[4], my_mac[5]);
  ssid = String("Joya Badge ") + tail;
  setupRemote();  // the soft AP pins the radio to kChannel

  Serial.print("MAC address of this node is ");
  Serial.println(WiFi.macAddress());
  Serial.print("WiFi channel is ");
  Serial.println(WiFi.channel());
  Serial.print("Remote: join \"");
  Serial.print(ssid);
  Serial.println("\" and open http://joya.local/ (or http://192.168.4.1/)");

  WifiEspNow.onReceive(handleMessage, nullptr);
  WifiEspNow.begin();
  WifiEspNow.addPeer(kBroadcastAddress);
  printState("boot");
}

static void updatePalette() {
  auto& targetPalette = palettes[effectivePalette()];
  nblendPaletteTowardPalette(currentPalette, targetPalette, 12);
}

void loop() {
  dns.processNextRequest();
  server.handleClient();
  MDNS.update();
  pollModeButton();

  // Frames streamed by the gateway win while they keep coming.
  auto frame = std::move(latest_frame);
  if (frame && state.power) {
    std::copy(frame->begin(), std::min(frame->end(), frame->begin() + NUM_LEDS),
              leds);
    uint8_t dothue = 0;
    for (int i = 0; i < 4; i++) {
      leds[beatsin16(1 + 1 * i, 0, NUM_LEDS - 1)] |= CHSV(dothue, 128, 64);
      dothue += 64;
    }
    FastLED.show();
  }
  const bool streaming = last_frame_millis && millis() - *last_frame_millis <= 10000;

  // Own animation: one tick per 17 ms of animation time, so the speed setting
  // scales everything (fades, ripples, beats) the same way on every badge.
  static uint32_t lastVt = 0;
  static bool vtInit = false;
  const uint32_t vt = get_millisecond_timer();
  if (!vtInit) {
    lastVt = vt;
    vtInit = true;
  }
  const uint32_t dv = vt - lastVt;
  if (!streaming && dv >= 17) {
    uint32_t ticks = dv / 17;
    if (ticks > 4) {  // fell behind, or the clock jumped: resync
      ticks = 4;
      lastVt = vt;
    } else {
      lastVt += ticks * 17;
    }
    if (state.power) {
      const uint8_t effect = effectiveEffect();
      for (uint32_t t = 0; t < ticks; t++) {
        updatePalette();
        drawEffect(effect, state.badgeMap);
      }
    } else {
      FastLED.clear();
    }
    FastLED.show();
  }

  static uint32_t tMillis = 0, tState = 0, tBattery = 0;
  const uint32_t now = millis();
  if (now - tMillis >= 1000) {
    tMillis = now;
    sendMillisMsg();
    Serial.print("Current millis: ");
    Serial.println(synced_ms());
  }
  if (now - tState >= 3000) {  // late joiners and rebooted badges catch up
    tState = now;
    sendState(1);
  }
  if (now - tBattery >= 5000) {
    tBattery = now;
    Serial.print("Battery: ");
    Serial.print(analogRead(A0) * kBatteryVoltsPerCount, 2);
    Serial.println(" V");
  }
}
