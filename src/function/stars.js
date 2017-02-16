import {ColorUtils} from "../utils/ColorUtils";

export class Func {
    constructor(config) {
        this.interval = 0
        this.stars = new Array(config.numberOfLeds);
        console.log("constructor rainbow");
    }

    start(config, draw, done) {
        let colors = new Array(config.numberOfLeds)

        for (let i = 0; i < this.stars.length; i++) {
            this.stars[i] = [0,0,0];
        }
        let time = 0

        let compute = () => {
          this.interval = setTimeout(compute, 1000 / config.frequencyInHertz)

          time += config.speed;
          const newColors = new Array(config.numberOfLeds)
          let decay = config.decay;
          for (let i = 0; i < config.numberOfLeds; i++) {
            let [r,g,b] = this.stars[i];
            // Dimm all the lights
            [r, g, b] = [r*decay,g*decay,b*decay];

            // Create new stars
            if(Math.random() < config.probability) {
              let [r2, g2, b2] = ColorUtils.HSVtoRGB(0+Math.random()/5, Math.random(), Math.random()*0.5+0.5);
              [r, g, b] = [r+r2,g+g2,b+b2];
            }

            this.stars[i] = [r,g,b];
          }
          draw(this.stars.map(([r,g,b]) => ColorUtils.dim(ColorUtils.rgbToHex(r, g, b), config.brillo)));
        };

        this.interval = setTimeout(compute, 1000 / config.frequencyInHertz)
        done()
    }

    stop() {
        clearInterval(this.interval)
    }
}

export const config = {
    decay: {type: Number, min: 0, max: 1, step: 0.005, default: 0.90},
    brillo: {type: Number, min: 0, max: 1, step: 0.01, default: 1},
    probability: {type: Number, min: 0, max: 1, step: 0.001, default: 0.060},
    frequencyInHertz: {type: Number, min: 1, max: 300, default: 70}
}