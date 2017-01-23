import {ColorUtils} from "../utils/ColorUtils";

export class Func {
    constructor() {
        this.interval = 0
    }
    start(config, draw, done) {
        this.interval = setInterval(() => {
            const colors = new Array(config.numberOfLeds)
            for (let i = 0; i < config.numberOfLeds; i++) {
                colors[i] = ColorUtils.rgbToHex(... ColorUtils.HSVtoRGB(0, 0, config.intensityDim));
            }
            draw(colors)
        }, 1 / config.frequencyInHertz)
        done()
    }
    stop() {
        clearInterval(this.interval)
    }
}

export const config = {
    frequencyInHertz: Number,
    intensityDim: {type: Number, min: 0, max: 1, step: 0.01, default: 0.5},
}