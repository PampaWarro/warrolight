const LightProgram = require('./../base-programs/LightProgram');
const CellularAutomata = require('cellular-automata');
const {
  TimedMultiGradient,
  loadGradient,
  allGradients,
} = require('../utils/gradients');
const _ = require('lodash');

module.exports = class CA extends LightProgram {
  constructor(config, geometry) {
    super(config, geometry);
    this.timedMultiGradient = new TimedMultiGradient(allGradients());
    this.cellularAutomata = new CellularAutomata([this.numberOfLeds])
      .fillWithDistribution([
        [0, 95],
        [1, 5],
      ])
      .setOutOfBoundValue('wrap');
    this.values = new Array(this.numberOfLeds);
    for (var i = 0; i < this.values.length; i++) {
      this.values[i] = 0;
    }
  }

  drawFrame(leds, context) {
    const audio = context.audio;
    const time = this.timeInMs / 1000;
    this.cellularAutomata.setRule(this.config.rule);
    if (
      (!this.lastIterationTime ||
        time - this.lastIterationTime > 1 / this.config.speed) &&
      (!audio.ready || audio.currentFrame.bassPeakDecay > 0.5)
    ) {
      this.cellularAutomata.iterate(1);
      this.lastIterationTime = time;
    }
    this.timedMultiGradient.currentTime = time;
    const blend = this.config.blend;
    const gradient = this.config.colorMap
      ? loadGradient(this.config.colorMap)
      : this.timedMultiGradient;
    for (var i = 0; i < this.cellularAutomata.array.shape[0]; i++) {
      if (Math.random() < this.config.randomness) {
        this.cellularAutomata.array.set(i, Math.round(Math.random()));
      }
      const value = this.cellularAutomata.array.get(i);
      this.values[i] = (1 - blend) * this.values[i] + blend * value;
    }
    for (var i = 0; i < leds.length; i++) {
      const value = this.values[Math.floor(i / this.config.scale)];
      const brightness = Math.pow(value, 8);
      const [r, g, b, a] = gradient.colorAt(brightness);
      leds[i] = [r * brightness, g * brightness, b * brightness];
    }
  }

  static presets() {
    return {
      // default: { velocidad: 0.6, escala: 1 },
      // slow: { velocidad: 0.1, escala: 1 }
    };
  }

  static configSchema() {
    let config = super.configSchema();
    config.randomness = {
      type: Number,
      min: 0.001,
      max: 0.999,
      step: 0.001,
      default: 0.001,
    };
    config.blend = {
      type: Number,
      min: 0.01,
      max: 0.99,
      step: 0.01,
      default: 0.02,
    };
    config.speed = {
      type: Number,
      min: 1,
      max: 30,
      step: 0.1,
      default: 2.5,
    };
    config.scale = {
      type: Number,
      min: 1,
      max: 20,
      step: 0.1,
      default: 10,
    };
    config.colorMap = { type: 'gradient', default: '' };
    config.rule = {
      type: String,
      values: _.range(0, 255).map((x) => 'W' + x),
      default: 'W30',
    };
    // config.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    return config;
  }
};
