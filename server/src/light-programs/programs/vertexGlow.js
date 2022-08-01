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
    for (let i = 0; i < this.numberOfLeds; i++) {
      this.nearestVertex[i] = this.findNearestVertex(
          this.geometry.x[i], this.geometry.y[i], this.geometry.z[i]);
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
    const audioPower = Math.pow(frame ? frame[this.config.soundMetric] : 0, .5);
    for (let i = 0; i < leds.length; i++) {
      const led = leds[i] = [ 0, 0, 0 ];
      const {distance} = this.nearestVertex[i];
      const brightness = Math.pow(
          _.clamp(1 - distance / ((1 + audioPower) * this.config.scale), 0, 1),
          this.config.pow);
      leds[i].fill(255 * brightness);
    }
    return;
  }

  static configSchema() {
    return Object.assign(super.configSchema(), {
      scale : {type : Number, min : .1, max : 100, step : .01, default : 1},
      pow : {type : Number, min : .1, max : 100, step : .01, default : 1},
      soundMetric : {type : 'soundMetric', default : "rms"},
      enableSound : {type : Boolean, default : true},
    });
  }
};
