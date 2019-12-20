#include <Warrolight.h>

void setupLeds(int numLeds, int dataPin1, int dataPin2) {
  NUM_LEDS = numLeds;

  // Uncomment/edit one of the following lines for your leds arrangement.
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, STRIP_NUM_LEDS);    
  FastLED.addLeds<WS2812B, DATA_PIN2, GRB>(leds2, STRIP_NUM_LEDS);    
  
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 5000);

  for (int i = 0; i < NUM_LEDS; i++) {   
    writeLeds(i,0,0,0);
  }

  for(int i=0;i<2;i++){
    writeLeds(0+i*STRIP_NUM_LEDS, 0, 0, 0); // Black
    writeLeds(1+i*STRIP_NUM_LEDS, 255, 0, 0); // Red
    writeLeds(2+i*STRIP_NUM_LEDS, 0, 255, 0); // Green
    writeLeds(3+i*STRIP_NUM_LEDS, 0, 0, 255); // Blue   
  }

  FastLED.show();
}

void setup() {
  Serial.begin(250000);
  Serial.println("Serial connected");
  setupLeds(300,6,7); 

  // COM17 - 6666 6
  // COM16 - 5555 5
   
  setupUDPConnection(2222, 2); // MEGA ETH 2
  //setupUDPConnection(4444, 4); // MEGA ETH 4
}

bool connected = false;
int disconnectedCounter = 0;

char ledsBuffer[2*3*150+2];  //buffer to hold incoming packet,
unsigned long lastPerfStatus = millis();
unsigned long lastFrame = millis();
int frameCount = 0;

void loop() {
  if(withIp) {
    unsigned long nowMs = millis();
    if(nowMs - lastPerfStatus > 1000) {
      lastPerfStatus = nowMs;
      if(!connected) {      
        broadcastAlive();       
      } else {
        broadcastPerf(frameCount);
        frameCount = 0;        
      }
    }
  
    if(checkForNewUDPMsg(ledsBuffer)) {
      writeLedFrame(ledsBuffer, 1);
      connected = true;
      disconnectedCounter = 0;
      frameCount++;
      lastFrame = nowMs;
    } else {
      if(nowMs - lastFrame > 2000) {
        connected = false;
      }
    }
  }
}
