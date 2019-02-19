const LayerBasedFunction = require("../base-programs/LayerBasedFunction");
const {
  XYHue,
  Line,
  Circle,
  InfiniteCircles,
  RandomPixels,
  PolarColors,
  RadiusCosineBrightness,
  SingleLed,
} = require('../utils/drawables');
const {DrawableLayer} = require('../utils/layers');
const _ = require('lodash');
const ColorUtils = require("../utils/ColorUtils");

module.exports = class Func extends LayerBasedFunction {
  constructor(config, leds) {
    super(config, leds);
    this.particles = {};
  }

  getDrawables(config) {
    return {};
  }

  getLayers(drawables) {
    return {
      layers: [
        {
          name: 'particles',
          layers: [],
        },
      ],
    };
  }

  populatePerBandParticles() {
    const that = this;
    _.forOwn(this.currentAudioFrame.center.filteredBands, (band, bandName) => {
      const bandParticles = that.particles[bandName] =
        that.particles[bandName] || [];
      while (bandParticles.length < that.config.particlesPerBand) {
        const drawable = new SingleLed({
          ledIndex: this.geometry.leds * Math.random()});
        const layer = new DrawableLayer({drawable: drawable});
        const state = {speed: 0};
        that.layers.particles.layers.push(layer);
        bandParticles.push({
          drawable: drawable,
          layer: layer,
          state: state,
        });
      }
      while (bandParticles.length > that.config.particlesPerBand) {
        const particle = bandParticles.pop();
        _.remove(that.layers.particles.layers, particle.layer);
      }
    });
    //console.log(that.particles);
  }

  updateState() {
    const that = this;
    // Audio independent stuff.

    // Audio dependent stuff.
    if (!this.audioReady) {
      return;
    }
    this.populatePerBandParticles();
    const centerChannel = this.currentAudioFrame.center;
    const audioSummary = centerChannel.summary;
    _.forOwn(this.particles, (particles, bandName) => {
      const energy = audioSummary[`${bandName}PeakDecay`];
      particles.forEach(particle => {
        particle.layer.alpha = .3 + .7*energy;
        particle.drawable.ledIndex += particle.state.speed;
        particle.drawable.color = ColorUtils.HSVtoRGB(
          that.config[`${bandName}Hue`], 
          that.config[`${bandName}Saturation`], 
          1,
        );

        var sign = Math.sign(particle.state.speed) ||
          Math.sign(Math.random() - .5);
        if (Math.random() < Math.pow(energy, 8)) {
          sign *= -1;
        }
        particle.state.speed = sign * Math.pow(energy, 4) * 10;
      });
    });
  }

  static presets() {
    return {
      "default": {velocidad: 0.4, whiteBorder: true},
      "gold": {velocidad: 0.1, whiteBorder: false, escala: 0.5, color: 0.42}
    }
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.particlesPerBand = {type: Number, default: 5, min:1, max:35, step:1}
    res.bassHue = {type: Number, default: 0, min:0, max:1, step:.01}
    res.bassSaturation = {type: Number, default: .8, min:0, max:1, step:.01}
    res.midHue = {type: Number, default: .333, min:0, max:1, step:.01}
    res.midSaturation = {type: Number, default: .8, min:0, max:1, step:.01}
    res.highHue = {type: Number, default: .667, min:0, max:1, step:.01}
    res.highSaturation = {type: Number, default: .8, min:0, max:1, step:.01}
    return res;
  }
}
