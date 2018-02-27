void setup() {
  Serial.begin(250000);
  Serial.println("Serial connected");
  setupLeds(300,6,7); 
  setupUDPConnection();
}

bool connected = false;
int disconnectedCounter = 0;
bool withIp = false;

char ledsBuffer[2*3*150+2];  //buffer to hold incoming packet,

void loop() {
  if(withIp) {
    if(!connected) {      
      broadcastAlive();
      delay(1000);    
    }
  
    if(checkForNewUDPMsg(ledsBuffer)) {
      writeLedFrame(ledsBuffer, 1);
      connected = true;
      disconnectedCounter = 0;  
    } else {
      if(disconnectedCounter++ > 10000) {
        connected = false;      
      }
    }
  }
}
