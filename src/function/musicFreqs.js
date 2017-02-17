import {ColorUtils} from "../utils/ColorUtils";
import {SoundBasedFunction} from "./SoundBasedFunction";

export class Func extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);

    this.lastVolume = new Array(this.numberOfLeds+1).join('0').split('').map(() => "#000000");
    this.lastVolumeAmp = new Array(this.numberOfLeds+1).join('0').split('').map(() => 0);
    this.lastVolumeInc = new Array(this.numberOfLeds+1).join('0').split('').map(() => 0);
    this.lastVolumeSum = new Array(this.numberOfLeds+1).join('0').split('').map(() => 0);
    this.lastVolumeCount = new Array(this.numberOfLeds+1).join('0').split('').map(() => 1);
  }

  // Override super method
  analyzeRawAudioData(array) {
    // get all the frequency amplitudes
    for (let i = 0; i < this.numberOfLeds; i++) {
      let pos = i;

      let val = (array[i%array.length] / 256);

      let lastVal = this.lastVolumeAmp[pos];
      this.lastVolumeAmp[pos] = val;

      this.lastVolumeInc[pos] +=  Math.max(0, val - lastVal);
      this.lastVolumeSum[pos] +=  val;
      this.lastVolumeCount[pos] +=  1;
    }
  }

  drawFrame(draw, done) {
    for(let i=0; i<this.numberOfLeds; i++) {
      let inc = this.lastVolumeInc[i];
      let amp = this.lastVolumeSum[i] / this.lastVolumeCount[i]*this.config.multiplier;
      if(inc < 0.3){
        inc = 0;
      }

      this.lastVolume[i] = ColorUtils.HSVtoHex((Math.min(1, amp)+this.config.colorOffset)%1, 1, Math.min(1, Math.pow(amp/2+inc/2, 1)));
      this.lastVolumeInc[i] = 0;
      this.lastVolumeCount[i] = 1;
      this.lastVolumeSum[i] = 0;
    }
    draw(this.lastVolume)
  }

  // Override and extend config Schema
  static configSchema(){
    let res = super.configSchema();
    res.multiplier = {type: Number, min: 0, max: 2, step: 0.01, default: 1}
    res.colorOffset = {type: Number, min: 0, max: 1, step: 0.01, default: 0.3}
    return res;
  }
}