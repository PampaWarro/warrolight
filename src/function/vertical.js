import { default as Geometry } from '../geometry/geometry'
import { default as warroLights } from '../geometry/warro'

export class Func {
  constructor() {
    this.interval = 0
    this.geometry = new Geometry(warroLights, 100, 100, 0, 0)
    this.startTime = Date.now()
  }
  start(config, draw, done) {
    this.interval = setInterval(() => {
      const colors = new Array(config.numberOfLeds)
      const elapsed = (Date.now() - this.startTime) / 2 % 255
      for (let i = 0; i < config.numberOfLeds; i++) {
        const height = this.geometry.y[i] * 255 / 100
        colors[i] = rgbToHex((height + elapsed) % 255, 100, 100)
      }
      draw(colors)
    }, 1 / config.frequencyInHertz * 1000)

    done()
  }
  stop() {
    clearInterval(this.interval)
  }
}

function componentToHex(c) {
  var hex = Math.max(0, Math.min(255, Math.floor(c))).toString(16);
  return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export const config = {
    frequencyInHertz: Number
}