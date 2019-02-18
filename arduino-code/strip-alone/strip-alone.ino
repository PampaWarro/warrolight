__attribute__((section(".noinit"))) unsigned int program;
__attribute__((section(".noinit"))) unsigned int lastTime;

unsigned int globalSeed = lastTime;

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
  globalSeed = random(32000);
  //Serial.println(globalSeed);
  
  setupLeds(150,6); 
  
  initParams();
  
  // Show with lights selected program
  for (int i = 0; i < 50; i++) {   
    writeLeds(i,0,0,0);
  }
  
  writeLeds(0+program, 255, 50, 255); // pink
    
  showLeds();
  delay(300);
 }

unsigned long lastFrame = millis();
int frameCount = 0;
void loop() {
  unsigned long nowMs = millis();
  
  if(nowMs - lastFrame > 20) {
    arduinoProgram();
    showLeds();
    lastFrame = nowMs;
    lastTime = (int) nowMs;
  } 
}
