const LayerBasedProgram = require("../base-programs/LayerBasedProgram");
const { SingleLed } = require("../utils/drawables");
const { DrawableLayer } = require("../utils/layers");
const _ = require("lodash");
const ColorUtils = require("../utils/ColorUtils");

module.exports = class BandParticles extends LayerBasedProgram {

  init() {
    super.init();

    this.particles = {};
    this.offsets = {
      bass: 0,
      mid: 1 / 3,
      high: 2 / 3
    };
  }

  getDrawables(config) {
    return {};
  }

  getLayers(drawables) {
    return {
      layers: [
        {
          name: "particles",
          layers: []
        }
      ]
    };
  }

  populatePerBandParticles(audio) {
    _.forEach(['bass', 'mid', 'high'], (bandName) => {
      const bandParticles = (this.particles[bandName] = this.particles[bandName] || []);

      while (bandParticles.length < this.config.particlesPerBand) {
        const drawable = new SingleLed({
          ledIndex: this.geometry.leds * Math.random()
        });
        const layer = new DrawableLayer({ drawable: drawable });
        const state = { speed: 0 };
        this.layers.particles.layers.push(layer);
        bandParticles.push({
          drawable: drawable,
          layer: layer,
          state: state
        });
      }

      while (bandParticles.length > this.config.particlesPerBand) {
        const particle = bandParticles.pop();
        _.remove(this.layers.particles.layers, particle.layer);
      }
    });
  }

  updateState(audio) {
    if (!audio.ready) {
      return;
    }
    this.populatePerBandParticles(audio);
    const audioSummary = audio.currentFrame;
    _.forOwn(this.particles, (particles, bandName) => {
      const energy = Math.pow(audioSummary[`${bandName}FastPeakDecay`] *
                                  this.config.energyMultiplier,
                              .5);
      const hue = ColorUtils.mod(this.offsets[bandName] + (this.config.hueSpeed * this.timeInMs) / 1000, 1);
      const saturation = ColorUtils.mod(this.offsets[bandName] + (this.config.saturationSpeed * this.timeInMs) / 1000, 1);

      particles.forEach(particle => {
        particle.layer.alpha = 0.1 + 0.9 * energy;
        particle.drawable.ledIndex += particle.state.speed;
        particle.drawable.color = ColorUtils.HSVtoRGB(hue, saturation, 1);

        let sign =
          Math.sign(particle.state.speed) || Math.sign(Math.random() - 0.5);
        if (Math.random() < Math.pow(energy, 10)) {
          sign *= -1;
        }
        particle.state.speed = sign * Math.pow(energy, 2) * 4 * this.config.speed;
      });
    });
  }

  static presets() {
    return {
      default: {}
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.particlesPerBand = {
      type: Number,
      default: 15,
      min: 1,
      max: 35,
      step: 1
    };
    res.energyMultiplier = { type: Number, default: 1, min: 0, max: 5, step: 0.01 };
    res.speed = { type: Number, default: 1, min: 0, max: 5, step: 0.01 };
    res.hueSpeed = { type: Number, default: 0.2, min: 0, max: 5, step: 0.01 };
    res.saturationSpeed = {
      type: Number,
      default: 0.3,
      min: 0,
      max: 5,
      step: 0.01
    };
    return res;
  }
};
