bool connected = false;
bool withIp = false;

char ledsBuffer[2 * 3 * 150 + 2]; // buffer to hold incoming packet

unsigned long lastPerfStatus = millis();
unsigned long lastFrame = millis();

int frameCount = 0;

void setup() {
  Serial.begin(250000);
  Serial.println("Serial connected");
  setupLeds(300, 6, 7);

  // COM17 - 6666 6
  // COM16 - 5555 5

  setupUDPConnection(2222, 2); // MEGA ETH 2
  // setupUDPConnection(4444, 4); // MEGA ETH 4
}

void loop() {
  if (withIp) {
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
    frameCount++;
    lastFrame = nowMs;
  } else {
    if (nowMs - lastFrame > 2000) {
      connected = false;
    }
  }
}
