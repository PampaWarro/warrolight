const LayerBasedFunction = require("../base-programs/LayerBasedFunction");
const {
  PolarColors,
  Circle,
} = require('../utils/drawables');

module.exports = class Bombs extends LayerBasedFunction {
  constructor(config, leds) {
    super(config, leds);
    this.bassSum = Math.random() * 1000;
    this.midSum = Math.random() * 1000;
    this.highSum = Math.random() * 1000;
  }
  getDrawables() {
    return {
      bassFill: new PolarColors({
        value: 1,
        center: [this.xBounds.center, this.yBounds.scale * 20],
      }),
      midFill: new PolarColors({
        value: 1,
        center: [this.xBounds.center, this.yBounds.scale * 20],
      }),
      highFill: new PolarColors({
        value: 1,
        center: [this.xBounds.center, this.yBounds.scale * 20],
      }),
      bassCircle: new Circle({}),
      midCircle: new Circle({}),
      highCircle: new Circle({}),
    }
  }
  getLayers(drawables) {
    return {
      layers: [
        {
          name: 'bass',
          layers: [
            {
              drawable: drawables.bassFill,
            },
            {
              name: 'bassCircle',
              drawable: drawables.bassCircle,
              blendMode: 'multiply',
            }
          ],
          blendMode: 'add',
        },
        {
          name: 'mid',
          layers: [
            {
              drawable: drawables.midFill,
            },
            {
              name: 'midCircle',
              drawable: drawables.midCircle,
              blendMode: 'multiply',
            }
          ],
          blendMode: 'add',
        },
        {
          name: 'high',
          layers: [
            {
              drawable: drawables.highFill,
            },
            {
              name: 'highCircle',
              drawable: drawables.highCircle,
              blendMode: 'multiply',
            }
          ],
          blendMode: 'add',
        },
      ],
    }
  }
  updateState() {
    // Audio independent stuff.
    // Audio dependent stuff.
    if (!this.audioReady) {
      return;
    }
    const centerChannel = this.currentAudioFrame.center;
    const bass = centerChannel.summary.bassPeakDecay;
    this.bassSum += bass;
    this.drawables.bassFill.angleOffset =
      Math.cos(bass + Math.PI * this.timeInMs/30000);
    this.drawables.bassCircle.radius = 10 + 30 * Math.pow(bass, 2);
    this.drawables.bassCircle.center = [
      this.xBounds.center + .35 * this.xBounds.scale * Math.cos(
        Math.PI * this.bassSum / 100
      ),
      this.yBounds.center + .35 * this.yBounds.scale * Math.cos(
        Math.PI * this.bassSum / 133
      ),
    ];
    const mid = centerChannel.summary.midPeakDecay;
    this.midSum += mid;
    this.drawables.midFill.angleOffset =
      Math.cos(mid + Math.PI * this.timeInMs/20000);
    this.drawables.midCircle.radius = 10 + 30 * Math.pow(mid, 2);
    this.drawables.midCircle.center = [
      this.xBounds.center + .35 * this.xBounds.scale * Math.cos(
        Math.PI * this.midSum / 100
      ),
      this.yBounds.center + .35 * this.yBounds.scale * Math.cos(
        Math.PI * this.midSum / 133
      ),
    ];
    this.layers.bass.alpha = bass*bass+0.05;
    this.layers.mid.alpha = mid*mid+0.05;
    const high = centerChannel.summary.highPeakDecay;
    this.layers.high.alpha = high*high+0.05;
    this.highSum += high;
    this.drawables.highFill.angleOffset =
      Math.cos(high + Math.PI * this.timeInMs/10000);
    this.drawables.highCircle.radius = 10 + 30 * Math.pow(high, 2);
    this.drawables.highCircle.center = [
      this.xBounds.center + .35 * this.xBounds.scale * Math.cos(
        Math.PI * this.highSum / 100
      ),
      this.yBounds.center + .35 * this.yBounds.scale * Math.cos(
        Math.PI * this.highSum / 133
      ),
    ];
  }
}
