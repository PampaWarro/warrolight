import {ColorUtils} from "../utils/ColorUtils";
import {SoundBasedFunction} from "./SoundBasedFunction";

export class Func extends SoundBasedFunction{
  constructor(config, leds) {
    super(config, leds);

    this.lastVolume = new Array(this.numberOfLeds+1).join('0').split('').map(() => "#000000");
    this.time = 0;

    this.maxVolume = 0;
  }

  // Override parent method
  drawFrame(draw, done){
    this.time += this.config.speed;

    let vol = this.averageVolume*this.config.multiplier;

    if(vol < this.config.cutThreshold){
      vol = vol/3*0;
    }

    let newVal = ColorUtils.rgbToHex(... ColorUtils.HSVtoRGB(vol*4+this.time/2000, 1, Math.pow(2, vol*50)/255-1/255));

    for(let i=0;i<this.config.speed;i++) {
      if(this.config.haciaElCentro){
        this.lastVolume.splice(Math.floor(this.numberOfLeds/2-1), 2);
        this.lastVolume.push(newVal);
      } else {
        this.lastVolume.splice(this.numberOfLeds-1, 1);
      }
      this.lastVolume.unshift(newVal);
    }

    draw(this.lastVolume);
    done();
  }

  // Override and extend config Schema
  static configSchema(){
    let res = super.configSchema();
    res.multiplier = {type: Number, min: 0, max: 2, step: 0.01, default: 1};
    res.speed = {type: Number, min: 1, max: 30, step: 1, default: 1};
    res.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.1};
    res.haciaElCentro = {type: Boolean, default: false};
    return res;
  }
}