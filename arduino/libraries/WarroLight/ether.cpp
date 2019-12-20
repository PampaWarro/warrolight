#include <SPI.h>        
#include <UIPEthernet.h>
#include <Warrolight.h>

IPAddress myDns(192, 168, 1, 1);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);

unsigned int localPort = 5555; // local port to listen on

// buffers for receiving and sending data
//char ReplyBuffer[] = "acknowledged";       // a string to send back

// An EthernetUDP instance to let us send and receive packets over UDP
EthernetUDP Udp;

void broadcastAlive() {
  Serial.println("Broadcasting I exist...");
  IPAddress remoteIp(255, 255, 255, 255);
  Udp.beginPacket(remoteIp, localPort);
  Udp.write("YEAH");
  Udp.endPacket();
}

void setupUDPConnection(unsigned int port, uint8_t ipSegment) {
  // MAC address and IP address (in case DHCP fails)
  uint8_t mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, ipSegment };
  localPort = port;

    // start the Ethernet and UDP:
  IPAddress useIp(192, 168, 1, ipSegment);
  Ethernet.begin(mac, useIp, myDns, gateway, subnet);
  /*Serial.println("Trying to get an IP address using DHCP");
  if (Ethernet.begin(mac) == 0) {
    Serial.println("Failed to configure Ethernet using DHCP...");
    // initialize the Ethernet device not using DHCP:
    Ethernet.begin(mac, ip, myDns, gateway, subnet);
  }*/
  
  Serial.print("My IP address: ");
  IPAddress ip = Ethernet.localIP();
  for (uint8_t thisByte = 0; thisByte < 4; thisByte++) {
    // print the value of each uint8_t of the IP address:
    Serial.print(ip[thisByte], DEC);
    Serial.print(".");
  }
  Serial.println("");
  
  Udp.begin(localPort);

  withIp = true;
  
  broadcastAlive();
}

void broadcastPerf(int frames) {
  IPAddress remoteIp(255, 255, 255, 255);
  Udp.beginPacket(remoteIp, localPort);
  Udp.write("PERF");
  String framesString = String(frames);
  char frameChar[5];
  framesString.toCharArray(frameChar, 5);
  Udp.write(frameChar);
  Udp.endPacket();

  Serial.print("Broadcasting PERF ");
  Serial.println(frameChar);
}

int count = 0;
uint8_t lastC = 0;


bool checkForNewUDPMsg(char packetBuffer[]) {
  int packetSize = Udp.parsePacket();

  if(packetSize)
  {   
    //Serial.print("Received packet of size ");       
    //Serial.println(packetSize);
    
    Udp.read(packetBuffer,packetSize);

    uint8_t c = packetBuffer[0];
    if(c - lastC > 1) {
      Serial.print("Missed ");
      Serial.print(c - lastC - 1, DEC);
      Serial.print(" - packet #");
      Serial.println(c, DEC);
    }  
      
    if((c % 50) == 0){  
      //Serial.print("Received packet #");
      //Serial.println(c, DEC);
    }

    lastC = c;  
    
    /*
    Serial.print(" from IP : ");
    IPAddress remote = Udp.remoteIP();
    //print out the remote connection's IP address
    Serial.print(remote);
    
    Serial.print(" on port : ");
    //print out the remote connection's port
    Serial.println(Udp.remotePort());

    Udp.beginPacket(remote, Udp.remotePort());
    Udp.write("OK");
    Udp.endPacket();    
    */
    return true;
  } else {
    return false;
  }
}
