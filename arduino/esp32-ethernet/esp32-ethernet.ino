// In older version of FastLED This is needed to prevent horrible crashes of esp32 probably caused by ethernet interrupts when data arrives
//#define FASTLED_ALLOW_INTERRUPTS 0
//#define FASTLED_INTERRUPT_RETRY_COUNT 1
#define FASTLED_ESP32_I2S true

#include <ETH.h>
#include <WiFiUdp.h>
#include <FastLED.h> // Expecting FastLED 3.4.x


// Ethernet and connection protocol stuff
static bool eth_connected = false;
bool connected = false;

unsigned long lastPerfStatus = millis();
unsigned long lastFrame = millis();

int frameCount = 0;
int count = 0;
byte lastC = 0;

WiFiUDP udp;                      // create UDP object


// Protocol defined strings coupled with lights server
char  StringPerf[] = "PERF";
char  StringAlive[] = "YEAH";


// ============================================================================
// COMPILE TIME CONFIG GOES HERE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

#define STRIP_NUM_LEDS 300 // EACH ONE of the two strips will have that many leds. ONE EXTRA LED FOR THE VOLTAJE REGULATOR LEDS
#define NUM_STRIPS 4

#define DATA_PIN 4
#define DATA_PIN2 14
#define DATA_PIN3 15
#define DATA_PIN4 16

#define POWER_MILLIAMPS (8000*NUM_STRIPS) // Max combined mah power consumption by all the strips

unsigned int localUdpPort = 2222; // Local port number

// ============================================================================


// LED strips data structures and logic

constexpr byte ENCODING_RGB = 4; // The only supported encoding by this device

int NUM_LEDS = STRIP_NUM_LEDS * NUM_STRIPS; // Total number of leds in all strips
char ledsBuffer[STRIP_NUM_LEDS * NUM_STRIPS * 3 + 2]; // buffer to hold incoming packet

// Define the array of leds. One extra led for voltage regulator
CRGB leds[(STRIP_NUM_LEDS+1) * NUM_STRIPS];

void setup() {
  Serial.begin(250000);
  Serial.println("Serial connected");

  // setupUDPConnection(2222, 2); // ESP32 ETH 2
  // setupUDPConnection(4444, 4); // ESP32 ETH 4

  WiFi.onEvent(WiFiEvent);
  ETH.begin();
  
  // Static ethernet config. Comment out for automatic DHCP
  /*ETH.config(
    IPAddress(192, 168, 1, 101),
    IPAddress(192, 168, 1, 1),
    IPAddress(255, 255, 255, 0),
    IPAddress(192, 168, 1, 1), 
    IPAddress(192, 168, 1, 1)
  );*/

  setupLeds(NUM_LEDS, 2, 16);
}


void broadcastAlive() {
  Serial.println("Broadcasting I exist...");
  
  IPAddress remoteIp(255, 255, 255, 255);

  // Broadcast a metadata string with the form "YEAH <field1>=<value1> <field2>=<value2>..."
  udp.beginPacket(remoteIp, localUdpPort);
  udp.print(StringAlive);
  udp.print(" leds=");
  udp.print(STRIP_NUM_LEDS*NUM_STRIPS);
  udp.print(" datapin1=");
  udp.print(DATA_PIN);
  udp.print(" datapin2=");
  udp.print(DATA_PIN2);
  udp.endPacket();
}

void broadcastPerf(int frames) {
  IPAddress remoteIp(255, 255, 255, 255);
  udp.beginPacket(remoteIp, localUdpPort);
  udp.print(StringPerf);
  String framesString = String(frames);
  char frameChar[5];
  framesString.toCharArray(frameChar, 5);
  udp.print(frameChar);
  udp.endPacket();

  Serial.print("Broadcasting PERF ");
  Serial.println(frameChar);
}

bool checkForNewUDPMsg(char packetBuffer[]) {
  int packetSize = udp.parsePacket();

  if (packetSize == 0) {
    return false;
  }

  // // For debugging
  //Serial.print("Received packet of size ");
  //Serial.println(packetSize);

  udp.read(packetBuffer, packetSize);

  byte c = packetBuffer[0];
  if (c - lastC > 1) {
    Serial.print("Missed ");
    Serial.print(c - lastC - 1, DEC);
    Serial.print(" - packet #");
    Serial.println(c, DEC);
  }

  // // For debugging
  // if ((c % 50) == 0) {
  //  Serial.print("Received packet #");
  //  Serial.println(c, DEC);
  // }

  lastC = c;

  return true;
}

void WiFiEvent(WiFiEvent_t event)
{
  switch (event) {
    case SYSTEM_EVENT_ETH_START:
      Serial.println("ETH Started");
      //set eth hostname here
      ETH.setHostname("esp32-ethernet");
      break;
    case SYSTEM_EVENT_ETH_CONNECTED:
      Serial.println("ETH Connected");
      break;
    case SYSTEM_EVENT_ETH_GOT_IP:
      Serial.print("ETH MAC: ");
      Serial.print(ETH.macAddress());
      Serial.print(", IPv4: ");
      Serial.print(ETH.localIP());
      if (ETH.fullDuplex()) {
        Serial.print(", FULL_DUPLEX");
      }
      Serial.print(", ");
      Serial.print(ETH.linkSpeed());
      Serial.println("Mbps");

      // Start UDP port and set global eth_connected flag
      udp.begin(localUdpPort);
      Serial.print("Begin udp in port ");
      Serial.print(localUdpPort);
      Serial.println(".");

      eth_connected = true;
      break;
    case SYSTEM_EVENT_ETH_DISCONNECTED:
      Serial.println("ETH Disconnected");
      eth_connected = false;
      break;
    case SYSTEM_EVENT_ETH_STOP:
      Serial.println("ETH Stopped");
      eth_connected = false;
      break;
    default:
      break;
  }
}

void setupLeds(int numLeds, int dataPin1, int dataPin2)
{
  NUM_LEDS = numLeds;

  int realLength = STRIP_NUM_LEDS + 1;
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, 0, realLength);
  FastLED.addLeds<WS2812B, DATA_PIN2, GRB>(leds, realLength, realLength);
  FastLED.addLeds<WS2812B, DATA_PIN3, GRB>(leds, realLength*2, realLength);
  FastLED.addLeds<WS2812B, DATA_PIN4, GRB>(leds, realLength*3, realLength);

  FastLED.setMaxPowerInVoltsAndMilliamps(5, POWER_MILLIAMPS);

  FastLED.showColor(CRGB::Black);

  for (int i = 0; i < NUM_STRIPS; i++)
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
  int chunk = data[0 + offset];
  int encoding = data[1 + offset];
  
  int chunkOffset = 1+chunk*(300+1); // Add one extra to account for the voltage regulators leds
  int ledsInPacket = NUM_LEDS;
  if(ledsInPacket > 300) {
    ledsInPacket = min(NUM_LEDS, chunkOffset + 300) - chunkOffset;
  }
  
  if (encoding == ENCODING_RGB)
  {    
    for (int i = 0; i < ledsInPacket; i++)
    {
      int r = data[2 + i * 3 + offset];
      int g = data[2 + 1 + i * 3 + offset];
      int b = data[2 + 2 + i * 3 + offset];

      leds[i+chunkOffset].setRGB(r, g, b);
    }
  }
  else
  {
    Serial.println("Unexpected encoding byte");
  }
  
  if(chunk == ceil(NUM_LEDS/300) - 1) {
    leds[0] = CRGB::Red;
    leds[301] = CRGB::Green;
    leds[602] = CRGB::Blue;
    leds[903] = CRGB::Yellow;
    
    FastLED.show();
    frameCount++;   
    lastFrame = millis();;
  }
}

void loop() {
  if (!eth_connected) {
    return;
  }

  unsigned long nowMs = millis();
  if (nowMs - lastPerfStatus > 1000) {
    lastPerfStatus = nowMs;
    if (!connected) {
      broadcastAlive();
    } else {
      broadcastPerf(frameCount);
      frameCount = 0;
    }
  }

  if (checkForNewUDPMsg(ledsBuffer)) {
    writeLedFrame(ledsBuffer, 1);
    connected = true;   
  } else {
    if (nowMs - lastFrame > 2000) {
      connected = false;
    }
  }
}
