const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");
const GlobalGame = require('../conga-utils/GlobalGame');
const {Glob} = require("glob");

module.exports = class CongaShooting extends LightProgram {

  init() {
    this.colors = new Array(this.numberOfLeds);
    this.bulletsA = [];
    this.bulletsB = [];
    this.explosionLevel = 0;
    this.time = 0;
    this.frame = 0;
    this.maxVolume = 0;
    GlobalGame.game.restart();
  }

  fire(vol, player) {
    const isA = player === 'A';
    let bullets = isA ? this.bulletsA : this.bulletsB;

    if(bullets.length && bullets.slice(-1)[0].frame >= (this.frame - 1)) {
      bullets.slice(-1)[0].size += vol;
      bullets.slice(-1)[0].frame = this.frame;
    } else {
      bullets.push({size: vol, pos: isA ? 0 : this.numberOfLeds, speed: isA ? 1 : -1, frame: this.frame});
    }
  }

  renderCollision(){
    this.explosionLevel += 10;
    console.log("boom")
  }

  simulate(){
      for(const b of this.bulletsA){
          b.pos += b.speed * this.config.speed;

          if(b.pos < 0 || b.pos > this.numberOfLeds) {
            this.bulletsA = _.without(this.bulletsA, b);
            GlobalGame.game.addPoint(0);
          }
      }

      for(const b of this.bulletsB){
        b.pos += b.speed * this.config.speed;

        if(b.pos < 0 || b.pos > this.numberOfLeds) {
          this.bulletsB = _.without(this.bulletsB, b);
          GlobalGame.game.addPoint(1);
        }
      }

      for(const a of this.bulletsA){
        for(const b of this.bulletsB){
            if (Math.abs(a.pos - b.pos) <= this.config.speed){
                this.renderCollision();
                this.bulletsA = _.without(this.bulletsA, a);
                this.bulletsB = _.without(this.bulletsB, b);
            }
        }
      }
      this.explosionLevel = this.explosionLevel * 0.7;
      if (this.explosionLevel < 0.5){
          this.explosionLevel = 0;
      }
  }

  drawFrame(draw, audio) {
    audio = audio.currentFrame || {};
    this.frame ++;
    this.time += this.config.speed;

    let volP1 = (audio[this.config.soundMetricP1] || 0) * this.config.multiplier;
    let volP2 = (audio[this.config.soundMetricP2] || 0) * this.config.multiplier;

    if (volP1 > this.config.fireThreshold) {
      this.fire(volP1**2, 'A');
    }
    if (volP2 > this.config.fireThreshold) {
      this.fire(volP2**2, 'B');
    }

    let baseColor = ColorUtils.HSVtoRGB(0, 0, this.explosionLevel/20);
    this.simulate();
    for (let i = 0; i < this.numberOfLeds; i++) {
        this.colors[i] = baseColor;
        for(const b of this.bulletsA){
            if (Math.abs(b.pos - i) < this.config.speed){
                this.colors[i] = GlobalGame.game.player1Color;
            }
        }
        for(const b of this.bulletsB){
            if (Math.abs(b.pos - i) < this.config.speed){
              this.colors[i] = GlobalGame.game.player2Color;
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
