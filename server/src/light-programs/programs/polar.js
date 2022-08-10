const ColorUtils = require("../utils/ColorUtils");
const LightProgram = require("../base-programs/LightProgram");
const _ = require("lodash");
const { mat4, vec3 } = require("gl-matrix");

function angleDegrees(x, y) {
  let angle = (Math.atan2(y, x) * 180) / Math.PI;
  if (isNaN(angle)) {
    return 0;
  }
  return angle;
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const getUpdatedAngle = (angle, t, speed, wiggleSpeed, wiggleAmplitude) => {
  if (speed) {
    angle += 360 * t * speed;
  }
  if (wiggleSpeed && wiggleAmplitude) {
    angle += wiggleAmplitude * Math.sin(t * 2 * Math.PI * wiggleSpeed);
  }
  return angle;
};

const getUpdatedOffset = (offset, t, wiggleSpeed, wiggleAmplitude) => {
  if (wiggleSpeed && wiggleAmplitude) {
    offset += wiggleAmplitude * Math.sin(t * 2 * Math.PI * wiggleSpeed);
  }
  return offset;
};

// TODO: consider moving this to the Geometry object itself
const getBounds = values => {
  let min = null;
  let max = null;
  values.forEach(value => {
    if (min == null || value < min) {
      min = value;
    }
    if (max == null || value > max) {
      max = value;
    }
  });
  return {
    min: min,
    max: max,
    center: (min + max) / 2,
    scale: max - min
  };
};

module.exports = class Polar extends LightProgram {
  init() {
    const xBounds = getBounds(this.geometry.x);
    const yBounds = getBounds(this.geometry.y);
    const zBounds = getBounds(this.geometry.z);
    this.centerX = xBounds.center;
    this.centerY = yBounds.center;
    this.centerZ = zBounds.center;
    this.timeSinceStart = null;
  }

  calculateTransform() {
    let transform = mat4.create();

    if (this.timeSinceStart === null) {
      this.timeSinceStart = this.timeInMs;
    }
    const t = (this.timeInMs - this.timeSinceStart) / 1000 / 60;
    const angleX = getUpdatedAngle(
      this.config.angleX,
      t,
      this.config.angleXSpeed,
      this.config.angleXWiggleSpeed,
      this.config.angleXWiggleAmplitude
    );
    transform = mat4.rotateX(
      mat4.create(),
      transform,
      (angleX * Math.PI) / 180
    );

    const angleY = getUpdatedAngle(
      this.config.angleY,
      t,
      this.config.angleYSpeed,
      this.config.angleYWiggleSpeed,
      this.config.angleYWiggleAmplitude
    );
    transform = mat4.rotateY(
      mat4.create(),
      transform,
      (angleY * Math.PI) / 180
    );

    const angleZ = getUpdatedAngle(
      this.config.angleZ,
      t,
      this.config.angleZSpeed,
      this.config.angleZWiggleSpeed,
      this.config.angleZWiggleAmplitude
    );
    transform = mat4.rotateZ(
      mat4.create(),
      transform,
      (angleZ * Math.PI) / 180
    );

    const offsetX = getUpdatedOffset(
      this.config.offsetX,
      t,
      this.config.offsetXWiggleSpeed,
      this.config.offsetXWiggleAmplitude
    );
    const offsetY = getUpdatedOffset(
      this.config.offsetY,
      t,
      this.config.offsetYWiggleSpeed,
      this.config.offsetYWiggleAmplitude
    );
    const offsetZ = getUpdatedOffset(
      this.config.offsetZ,
      t,
      this.config.offsetZWiggleSpeed,
      this.config.offsetZWiggleAmplitude
    );
    transform = mat4.translate(mat4.create(), transform, [
      -offsetX,
      -offsetY,
      -offsetZ,
    ]);

    return transform;
  }

  drawFrame(leds, context) {
    this.transform = this.calculateTransform();
    this.width = this.calculateWidth(context.audio);
    leds.forEach((value, i) => {
      const x = this.geometry.x[i];
      const y = this.geometry.y[i];
      const z = this.geometry.z[i];
      const brightness = this.brightness(x, y, z);
      const scaled = Math.floor(brightness * 255);
      leds[i] = [scaled, scaled, scaled];
    });
  }

  brightness(x, y, z) {
    const config = this.config;
    x -= this.centerX;
    y -= this.centerY;
    z -= this.centerZ;
    const transformed = vec3.transformMat4(
      vec3.create(),
      [x, y, z],
      this.transform
    );
    x = transformed[0];
    y = transformed[1];
    z = transformed[2];
    const angle = Math.abs(angleDegrees(x, y));
    const fadeWidth = clamp(config.fadeWidth, 0, 180);
    const width = this.width;
    const fadeStart = (width - fadeWidth) / 2;
    const fadeEnd = (width + fadeWidth) / 2;
    if (angle < fadeStart) {
      return 1;
    }
    if (angle > fadeEnd) {
      return 0;
    }
    return 1 - (angle - fadeStart) / (fadeEnd - fadeStart);
  }

  calculateWidth(audio) {
    const config = this.config;
    const width = clamp(config.width, 0, 360);
    const vol = (audio.currentFrame || {})[this.config.soundMetric] || 0;
    return width + width * config.widthAudioSensitivity * (2 * vol - 1);
  }

  static presets() {
    return {};
  }

  static configSchema() {
    return Object.assign(super.configSchema(), {
      width: { type: Number, min: 0, max: 360, step: 1, default: 45 },
      widthAudioSensitivity: {
        type: Number,
        min: 0,
        max: 1,
        step: 0.1,
        default: 0
      },
      soundMetric: { type: "soundMetric", default: "bassFastPeakDecay" },
      fadeWidth: { type: Number, min: 0, max: 180, step: 1, default: 0 },
      offsetX: { type: Number, min: -100, max: 100, step: 1, default: 0 },
      offsetXWiggleSpeed: {
        type: Number,
        min: -200,
        max: 200,
        step: 0.1,
        default: 0
      },
      offsetXWiggleAmplitude: {
        type: Number,
        min: 0,
        max: 3600,
        step: 1,
        default: 10
      },
      offsetY: { type: Number, min: -100, max: 100, step: 1, default: 0 },
      offsetYWiggleSpeed: {
        type: Number,
        min: -200,
        max: 200,
        step: 0.1,
        default: 0
      },
      offsetYWiggleAmplitude: {
        type: Number,
        min: 0,
        max: 3600,
        step: 1,
        default: 10
      },
      offsetZ: { type: Number, min: -100, max: 100, step: 1, default: 0 },
      offsetZWiggleSpeed: {
        type: Number,
        min: -200,
        max: 200,
        step: 0.1,
        default: 0
      },
      offsetZWiggleAmplitude: {
        type: Number,
        min: 0,
        max: 3600,
        step: 1,
        default: 10
      },
      angleX: { type: Number, min: 0, max: 360, step: 1, default: 90 },
      angleXSpeed: { type: Number, min: -200, max: 200, step: 0.1, default: 0 },
      angleXWiggleSpeed: {
        type: Number,
        min: -200,
        max: 200,
        step: 0.1,
        default: 0
      },
      angleXWiggleAmplitude: {
        type: Number,
        min: 0,
        max: 3600,
        step: 1,
        default: 45
      },
      angleY: { type: Number, min: 0, max: 360, step: 1, default: 0 },
      angleYSpeed: { type: Number, min: -200, max: 200, step: 0.1, default: 0 },
      angleYWiggleSpeed: {
        type: Number,
        min: -200,
        max: 200,
        step: 0.1,
        default: 0
      },
      angleYWiggleAmplitude: {
        type: Number,
        min: 0,
        max: 3600,
        step: 1,
        default: 45
      },
      angleZ: { type: Number, min: 0, max: 360, step: 1, default: 0 },
      angleZSpeed: { type: Number, min: -200, max: 200, step: 0.1, default: 0 },
      angleZWiggleSpeed: {
        type: Number,
        min: -200,
        max: 200,
        step: 0.1,
        default: 0
      },
      angleZWiggleAmplitude: {
        type: Number,
        min: 0,
        max: 3600,
        step: 1,
        default: 45
      }
    });
  }
};
