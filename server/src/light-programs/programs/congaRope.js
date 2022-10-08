const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");
const GlobalGame = require("./../conga-utils/GlobalGame");

module.exports = class CongaShooting extends LightProgram {

  init() {
    this.center = this.numberOfLeds / 2;
    this.segmentSize = 60;
    this.colors = new Array(this.numberOfLeds);
    this.rope = {pos: this.center - this.segmentSize, length: 2 * this.segmentSize};
    this.explosionLevel = 0;
    this.time = 0;
    this.audioWindow1 = new Array(600).fill(0);
    this.audioWindow2 = new Array(600).fill(0);
    this.maxVolume = 0;
  }

  updateAudioWindow(audio){
      let volP1 = (audio[this.config.soundMetricP1] || 0) * this.config.multiplier;
      let volP2 = (audio[this.config.soundMetricP2] || 0) * this.config.multiplier;

      this.audioWindow1.unshift();
      this.audioWindow1.push(volP1 > this.config.fireThreshold ? volP1 : 0);

      this.audioWindow2.unshift();
      this.audioWindow2.push(volP2 > this.config.fireThreshold ? volP2 : 0);
  }

  detectBursts(audio){
      this.updateAudioWindow(audio);
      let burstSizeP1 = _.sum(this.audioWindow1);
      let burstSizeP2 = _.sum(this.audioWindow2);

      if(burstSizeP1 < this.config.burstThreshold){
          burstSizeP1 = 0;
      }
      if (burstSizeP1 > this.config.burstMaxLength){
          burstSizeP1 = this.config.burstMaxLength;
      }

      if(burstSizeP2 < this.config.burstThreshold){
          burstSizeP2 = 0;
      }
      if (burstSizeP2 > this.config.burstMaxLength){
          burstSizeP2 = this.config.burstMaxLength;
      }
      return [burstSizeP1, burstSizeP2];
  }

  pushToPlayerSide(player){
      if(player == 'P1'){
          this.rope.pos -= this.config.baseForce;
          if (this.rope.pos < 0){
              this.rope.pos = 0;
          }
          this.resetBurstsForPlayer(player);
      }
      if(player == 'P2'){
          this.rope.pos += this.config.baseForce;
          if(this.rope.pos >= this.numberOfLeds){
              this.rope.pos = this.numberOfLeds;
          }
          this.resetBurstsForPlayer(player);
      }
  }
  paintAll(){
      let baseColor = ColorUtils.HSVtoRGB(0, 0, this.explosionLevel/20);
      for (let i = 0; i < this.numberOfLeds; i++) {
          this.colors[i] = [255,255,255];
      }
  }

  resetBurstsForPlayer(player){
      if (player == 'P1'){
          this.audioWindow1.fill(0);
      }
      if (player == 'P2'){
          this.audioWindow2.fill(0);
      }
  }
  gameOver(winner){
      this.rope = {pos: this.center - this.segmentSize, length: 2 * this.segmentSize};
      GlobalGame.game.score[winner] = GlobalGame.game.max();
  }

  drawFrame(draw, audio) {
    audio = audio.currentFrame || {};
    let bursts = this.detectBursts(audio);
    let burstP1 = bursts[0];
    let burstP2 = bursts[1];

    if (burstP1 > burstP2){
        this.pushToPlayerSide('P1');
    }else if (burstP2 > burstP1){
        this.pushToPlayerSide('P2');
    }

    if (this.rope.pos == 0){
        this.gameOver(0);
    }
    if(this.rope.pos + this.rope.length == this.numberOfLeds){
        this.gameOver(1);
    }
    let baseColor = ColorUtils.HSVtoRGB(0, 0, this.explosionLevel/20);
    for (let i = 0; i < this.numberOfLeds; i++) {
        this.colors[i] = baseColor;
        if (i >= this.rope.pos && i < this.rope.pos+this.rope.length){
            this.colors[i] = [255,255,0];
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
    res.soundMetricP1 = {type: 'soundMetric', default: "rms"};
    res.soundMetricP2 = {type: 'soundMetric', default: "mic2_rms"};
    res.fireThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.45};
    res.baseForce = { type: Number, min: 1, max: 10, step: 1, default: 3 };
    res.burstThreshold = {type: Number, min: 0, max: 20, step: 1, default: 3};
    res.burstMaxLength = {type: Number, min: 0, max: 50, step: 1, default: 10};
    return res;
  }
};
