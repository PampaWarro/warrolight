import {ColorUtils} from "../utils/ColorUtils";

export class Func {
    constructor(config) {
        this.interval = 0
        console.log("constructor rainbow");
    }

    start(config, draw, done) {
        let colors = new Array(config.numberOfLeds)
        const colorSet = [
            '#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0099ff', '#0000ff', '#5500CC', '#ffffff'
        ]
        for (let i = 0; i < config.numberOfLeds; i++) {
            colors[i] = colorSet[2]
        }
        let time = 0

        this.interval = setInterval(() => {
            time += config.speed;
            const newColors = new Array(config.numberOfLeds)

            for (let i = 0; i < config.numberOfLeds; i++) {
                let colIndex = Math.floor(((time + i) / config.sameColorLeds)) % colorSet.length;

                let col = colorSet[colIndex];
                if (col == "#5500CC")
                    newColors[i] = col;
                else
                    newColors[i] = ColorUtils.dim(col, config.intensityDim);

            }
            draw(newColors)
        }, 1000 / config.frequencyInHertz)

        done()
    }

    stop() {
        clearInterval(this.interval)
    }
}

export const config = {
    speed: {type: Number, min: 1, max: 20, default: 1},
    sameColorLeds: {type: Number, min: 1, max: 500, default: 13},
    intensityDim: {type: Number, min: 0, max: 1, step: 0.01, default: 0.3},
    frequencyInHertz: {type: Number, min: 1, max: 200, default: 70}
}