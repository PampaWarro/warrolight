#include <FastLED.h>
#include <Warrolight.h>

void setupLeds(int numLeds, int dataPin1) {
  NUM_LEDS = numLeds;

  // Uncomment/edit one of the following lines for your leds arrangement.
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, STRIP_NUM_LEDS);    
    
  FastLED.setMaxPowerInVoltsAndMilliamps(5, 150);

  for (int i = 0; i < NUM_LEDS; i++) {   
    writeLeds(i,0,0,0);
  }

  for(int i=0;i<1;i++){
    writeLeds(0+i*STRIP_NUM_LEDS, 0, 0, 0); // Black
    writeLeds(1+i*STRIP_NUM_LEDS, 255, 0, 0); // Red
    writeLeds(2+i*STRIP_NUM_LEDS, 0, 255, 0); // Green
    writeLeds(3+i*STRIP_NUM_LEDS, 0, 0, 255); // Blue   
  }

  FastLED.show();
}

void setup() {
   //Serial.begin(9600);
   //Serial.println("Serial connected");
  // Serial.println(program);
  if(program > 100)
    program = 0;
  else
    program = (program + 1) % 5;

  // For developing, force program
  //program = 4;
    
  // Generate random seed using analog pin noise
  randomSeed(analogRead(0));

  // Global seed makes sure each time the lights are different
  
  setupLeds(150,6); 
  
  initParams();
  
  // Show with lights selected program
  for (int i = 0; i < 50; i++) {   
    writeLeds(i,0,0,0);
  }
  
  writeLeds(0+program, 255, 50, 255); // pink
    
  FastLED.show();
  delay(300);
 }

unsigned long lastFrame = millis();
int frameCount = 0;
void loop() {
  unsigned long nowMs = millis();
  
  if(nowMs - lastFrame > 20) {
    arduinoProgram();
    FastLED.show();
    lastFrame = nowMs;
  } 
}
