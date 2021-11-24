const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");

module.exports = class CongaShooting extends LightProgram {

  init() {
    this.colors = new Array(this.numberOfLeds);
    this.bulletsA = [];
    this.bulletsB = [];
    this.explosionLevel = 0;
    this.time = 0;
    this.maxVolume = 0;
  }

  fire(vol, player){
    if (player == 'A'){
        this.bulletsA.push({size: vol, pos: 0, speed: 1});
    }else if (player == 'B'){
        this.bulletsB.push({size: vol, pos: this.numberOfLeds, speed: -1});
    }
  }

  renderCollision(){
    this.explosionLevel += 10;
  }

  simulate(){
      for(const b of this.bulletsA){
          b.pos += b.speed * this.config.speed;
      }
      for(const b of this.bulletsB){
        b.pos += b.speed * this.config.speed;
      }
      for(const a of this.bulletsA){
        for(const b of this.bulletsB){
            if (a.pos == b.pos){
                this.renderCollision();
                this.bulletsA = _.without(this.bulletsA, a);
                this.bulletsB = _.without(this.bulletsB, b);
            }
        }
      }
      this.explosionLevel = this.explosionLevel / 2;
      if (this.explosionLevel < 0.5){
          this.explosionLevel = 0;
      }
  }

  drawFrame(draw, audio) {
    audio = audio.currentFrame || {};
    this.time += this.config.speed;

    let volP1 = (audio[this.config.soundMetricP1] || 0) * this.config.multiplier;
    let volP2 = (audio[this.config.soundMetricP2] || 0) * this.config.multiplier;

    if (volP1 > this.config.fireThreshold) {
      this.fire(volP1, 'A');
    }
    if (volP2 > this.config.fireThreshold) {
      this.fire(volP2, 'B');
    }

    let baseColor = ColorUtils.HSVtoRGB(0, 0, this.explosionLevel/20);
    this.simulate();
    for (let i = 0; i < this.numberOfLeds; i++) {
        this.colors[i] = baseColor;
        for(const b of this.bulletsA){
            if (b.pos == i){
                this.colors[i] = [255,255,0];
            }
        }
        for(const b of this.bulletsB){
            if (b.pos == i){
                this.colors[i] = [0, 255, 255];
            }
        }
    }

    draw(this.colors);
  }

  static presets() {
    return {};
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.multiplier = { type: Number, min: 0, max: 2, step: 0.01, default: 1 };
    res.fireThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.45};
    res.soundMetricP1 = {type: 'soundMetric', default: "rms"};
    res.soundMetricP2 = {type: 'soundMetric', default: "mic2_rms"};
    res.speed = { type: Number, min: 1, max: 10, step: 1, default: 3 };
    return res;
  }
};
