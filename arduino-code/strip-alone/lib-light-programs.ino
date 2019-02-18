#define NUM_LEDS_PROGRAM 150

bool programInitialized = false;

long globalTime = 0;
long relativeTime = 0;
long starRelativeTime = 0;

// bool inTransition = false;
int transitionProgress = 0;
byte transitionEase[] = {0,0,0,0,0,1,1,1,2,2,2,3,4,4,5,5,6,7,8,9,10,10,11,12,14,15,16,17,18,19,21,22,23,25,26,27,29,30,32,33,35,36,38,39,41,42,44,45,47,48,50,52,53,55,56,58,59,61,62,64,65,67,68,70,71,73,74,75,77,78,79,81,82,83,84,85,86,88,89,90,90,91,92,93,94,95,95,96,96,97,98,98,98,99,99,99,100,100,100,100};

double params[] = {0,0,0,0,0,0,0,0,0,0,0,0};
double paramsOld[] = {0,0,0,0,0,0,0,0,0,0,0,0};

// create a random integer from 0 - 65535
unsigned int rdm(int from, int to) {
  static unsigned int y = 0;
  y += micros() + globalSeed; // seed that changes every time arduino is reseted
  y ^= y << 2; y ^= y >> 7; y ^= y << 7;
  return y % (to - from) + from;
}

void set(int paramPos, int val) {
  params[paramPos] = val;
}

void init(int paramPos, int val) {
  set(paramPos, val);
  paramsOld[paramPos] = val;
}

void setRandom(int paramPos, int from, int to) {
  paramsOld[paramPos] = params[paramPos];
  params[paramPos] = rdm(from, to);
}

int getP(int paramPos) {
  /*if (inTransition) {
    int t = transitionEase[transitionProgress];
    return (int) ((params[paramPos] * (t) + paramsOld[paramPos] * (100.0 - t)) / 100.0);
  } else {*/
    return (int) params[paramPos];
  //}
}

double getFloat(int paramPos) {
  /*if (inTransition) {
    int t = transitionEase[transitionProgress];
    return (params[paramPos] * (t) + paramsOld[paramPos] * (100.0 - t)) / 100.0;
  } else {*/
    return params[paramPos];
  //}
}

//////////////////////////////////////////////////////////////////////////////////////////
// RAINBOW ///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

#define PARAM_SPEED 1
#define PARAM_SATURATION 2
#define PARAM_SCALE 3
#define PARAM_COLOR_RANGE 4
#define PARAM_COLOR_TONE 5
#define PARAM_CONTRAST 6

void initParams() {
  init(PARAM_SPEED, 5);
  init(PARAM_SATURATION, 255);
  init(PARAM_SCALE, 5);
  init(PARAM_COLOR_RANGE, 255);
  init(PARAM_COLOR_TONE, 0);
  init(PARAM_CONTRAST, 2);
}

byte PARAM_SINES[] = {0, 12, 25, 38, 50, 63, 75, 87, 99, 110, 122, 133, 143, 154, 164, 173, 182, 191, 199, 207, 214, 221, 227, 232, 237, 241, 245, 248, 251, 253, 254, 254, 254, 254, 252, 250, 248, 245, 241, 236, 231, 226, 220, 213, 206, 198, 190, 181, 172, 162, 152, 142, 131, 120, 108, 97, 85, 73, 61, 48, 35, 23, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 17, 29, 42, 54, 67, 79, 91, 103, 114, 125, 136, 147, 157, 167, 176, 185, 194, 202, 209, 216, 223, 229, 234};

void programRainbow(int speedMult) {
    if (!programInitialized) {
      setRandom(PARAM_SPEED, -150, 150);    
      setRandom(PARAM_SCALE, 1, 8);
      setRandom(PARAM_COLOR_RANGE, 5, 255);
      setRandom(PARAM_COLOR_TONE, 1, 255);
      setRandom(PARAM_SATURATION, 150, 255);
      setRandom(PARAM_CONTRAST, 1, 4);

      //set(PARAM_SPEED, 100);
      //set(PARAM_SCALE, 5);

      double sinSize = 50;
      int power = 5;
      for (int i = 0; i < 150; i++) {
        double p = sin(i/ sinSize);
        PARAM_SINES[i] = (int) max(0, floor(p*p*p*p*p*255.0));
      }
    }

    int scale = getP(PARAM_SCALE);
    int range = getP(PARAM_COLOR_RANGE);
    int colorTone = getP(PARAM_COLOR_TONE);
    int contrast = getP(PARAM_CONTRAST);
    int sat = getP(PARAM_SATURATION);
    
    for (int i = 0; i < NUM_LEDS_PROGRAM; i++) {
      byte hue = (byte) ((((i * 4 + relativeTime/10) % 255) * range >> 8) + colorTone);
      
      byte b = PARAM_SINES[(i * scale + relativeTime/20) % 150];
   
      // Amplify the blackness
      b = (byte) round(max(0, (255 - (255 - b)*contrast)>> 1));
      writeLedsHSB(i, hue % 255, sat, b);
    }
    relativeTime = relativeTime + getP(PARAM_SPEED)*speedMult;
    if(relativeTime < 0) {
      relativeTime += 30000;
    }
  }


//////////////////////////////////////////////////////////////////////////////////////////
// PULSE ///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

void stripes() {
  if (!programInitialized) {
      setRandom(PARAM_SPEED, 1, 2);      
      setRandom(PARAM_COLOR_TONE, 1, 255);     
  }
  
  int colorTone = getP(PARAM_COLOR_TONE);
 
  int pulse = (int) 200*(sin(globalTime/30.0*getP(PARAM_SPEED)*2)+1)/2+50;
  
  for (int i = 0; i < NUM_LEDS_PROGRAM; i++) {
    writeLedsHSB(i, colorTone % 255, 200, pulse);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
// STARS /////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

byte stars[NUM_LEDS_PROGRAM];
byte starsColors[NUM_LEDS_PROGRAM];
byte starsSaturation[NUM_LEDS_PROGRAM];

int PARAM_CHANCE = 1000;
int PARAM_DECAY = 9900;
int PARAM_TONE = 0;

void programStars() {
  if (!programInitialized) {
    memset(stars, 0, sizeof(stars));
    memset(stars, 0, sizeof(starsColors));
    memset(stars, 0, sizeof(starsSaturation));
    int i = rdm(0, 100);
    PARAM_CHANCE = 100 - i;
    PARAM_DECAY = 999 - i;
    PARAM_TONE = rdm(0,255);    
  }

  long time = globalTime;
  
  for (int i = 0; i < NUM_LEDS_PROGRAM; i++) {
    if (rdm(0, PARAM_CHANCE) == 0) {
      stars[i] = min(255, (int)stars[i] + rdm(20, 255));
      starsColors[i] = rdm(0, 10)+(time/10 % 255);
      starsSaturation[i] = rdm(0, 150)+50;
    }
    if (stars[i] > 0) {
      stars[i] = max(0, (((long)stars[i]) * PARAM_DECAY / 1000));
    }

    //byte pos = i+(time/5)%NUM_LEDS_PROGRAM;
    byte pos = i;
    writeLedsHSB(pos, ((int)starsColors[i]+PARAM_TONE)%255, starsSaturation[i], stars[i]);
  }
}


//////////////////////////////////////////////////////////////////////////////////////////
// explosion ///////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
int expLife = 30;
int expCenter = 5;
int expIntensity = 30;

void explosion() {
  if (!programInitialized || expLife < 0) {
      expIntensity = rdm(5, 25);
      expLife = expIntensity;   
      expCenter = rdm(1, 25);
      setRandom(PARAM_COLOR_TONE, 1, 255);
      setRandom(PARAM_SATURATION, 0, 255);
  }
  byte colTone = getP(PARAM_COLOR_TONE);
  byte colSat = getP(PARAM_SATURATION);
  for (int i = 0; i < NUM_LEDS_PROGRAM; i++) {
    int d = abs(i % 25 - expCenter); 
    if(d < (expIntensity - expLife)) {
      long fb = min(255, max(0, (255/expIntensity)*expLife));
      byte b = (byte) round(256*((fb/256.0*fb/256.0)));
      writeLedsHSB(i, colTone, colSat, b);
    } else {
      writeLedsHSB(i, 0, 0, 0);
    }
  }
  expLife--;
}


//////////////////////////////////////////////////////////////////////////////////////////
// MAIN /////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////
int randomProgram = 0;
void arduinoProgram() {
  int programTime = 10;
  
  if(program == 0) {
    switch(randomProgram) {
      case 0:
        programRainbow(1);      
        break;
      case 1:
        programRainbow(2);
        break;
      case 2:
        programStars();
        break;
      case 3: 
        explosion();
        break;     
    }
  } else if(program == 1) {
    programRainbow(1);
    programTime = 20;
  } else if(program == 2) {
    programRainbow(2);
    programTime = 5;
  } else if(program == 3) {
    programStars();
  } else if(program == 4) {
    explosion();
  }

  programInitialized = true;

  if ((globalTime - 1) % (60 * programTime * 1) == 0) {
    programInitialized = false;   
    if(program == 0) {
      randomProgram = rdm(0, 4);
    }
  }

  globalTime++;
}
