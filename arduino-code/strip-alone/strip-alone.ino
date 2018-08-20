void setup() {
  // Serial.begin(250000);
  // Serial.println("Serial connected");
  setupLeds(150,6); 

  initParams();
}

unsigned long lastFrame = millis();
int frameCount = 0;
void loop() {
	unsigned long nowMs = millis();
	
	if(nowMs - lastFrame > 30) {
		arduinoProgram();
		showLeds();
		lastFrame = nowMs;   
	}	
}
