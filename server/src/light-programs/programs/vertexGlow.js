const _ = require("lodash");
const LightProgram = require('./../base-programs/LightProgram');

function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

module.exports = class VertexGlow extends LightProgram {
  init() {
    this.vertices = this.getVerticesFromGeometry();
    this.nearestVertex = new Array(this.numberOfLeds);
    this.vertexMaxDistance = {};
    for (let i = 0; i < this.numberOfLeds; i++) {
      const nearestVertex = this.nearestVertex[i] = this.findNearestVertex(
          this.geometry.x[i], this.geometry.y[i], this.geometry.z[i]);
      this.vertexMaxDistance[nearestVertex.vertex] =
          Math.max(nearestVertex.distance,
                   this.vertexMaxDistance[nearestVertex.vertex] || 0);
    }
    for (const nearestVertex of this.nearestVertex) {
      nearestVertex.normalizedDistance =
          nearestVertex.distance / this.vertexMaxDistance[nearestVertex.vertex];
    }
  }

  getVerticesFromGeometry() {
    const geometry = this.geometry;
    let vertices = geometry.definition.vertices;
    if (vertices) {
      return vertices.map(i => [geometry.x[i], geometry.y[i], geometry.z[i]]);
    }
    console.warn(
        "Geometry missing vertex definitions, falling back to one every 150");
    vertices = [];
    for (let i = 0; i < this.numberOfLeds; i += 150) {
      vertices.push([ geometry.x[i], geometry.y[i], geometry.z[i] ]);
    }
    return vertices;
  }

  findNearestVertex(x, y, z) {
    let nearestVertex = null;
    let minDistance = null;
    for (const vertex of this.vertices) {
      const d = euclideanDistance([ x, y, z ], vertex);
      if (minDistance === null || d < minDistance) {
        minDistance = d;
        nearestVertex = vertex;
        if (d === 0) {
          break;
        }
      }
    }
    return {
      vertex : nearestVertex,
      distance : minDistance,
    };
  }

  drawFrame(leds, context) {
    const frame = context.audio.currentFrame;
    const {timeInMs} = context;
    const audioPower =
        this.config.enableSound
            ? Math.pow(frame ? frame[this.config.soundMetric] : 0, .5)
            : 0;
    for (let i = 0; i < leds.length; i++) {
      const led = leds[i] = [ 0, 0, 0 ];
      const {normalizedDistance : distance} = this.nearestVertex[i];
      const vertexBrightness =
          1 - distance / ((1 + audioPower) * this.config.scale);
      const rippleBrightness = Math.pow(
          (1 - distance) * this.config.rippleStrength *
              (.5 +
               .5 * Math.cos(Math.PI *
                             (distance * this.config.rippleFreq - audioPower -
                              this.config.rippleSpeed * timeInMs / 1000))),
          this.config.ripplePow);
      const brightness =
          Math.pow(_.clamp(Math.max(vertexBrightness, rippleBrightness), 0, 1),
                   this.config.pow);
      leds[i].fill(255 * brightness);
    }
    return;
  }

  static configSchema() {
    return Object.assign(super.configSchema(), {
      scale : {type : Number, min : .01, max : 1, step : .01, default : 0.5},
      pow : {type : Number, min : .1, max : 10, step : .01, default : 2},
      rippleStrength :
          {type : Number, min : 0, max : 10, step : .01, default : 1},
      rippleSpeed : {type : Number, min : 0, max : 10, step : .01, default : 1},
      rippleFreq :
          {type : Number, min : 0.1, max : 100, step : .01, default : 10},
      ripplePow : {type : Number, min : .1, max : 10, step : .01, default : 1},
      soundMetric : {type : 'soundMetric', default : "rms"},
      enableSound : {type : Boolean, default : true},
    });
  }
};
