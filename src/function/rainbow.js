import {ColorUtils} from "../utils/ColorUtils";

export class Func {
    constructor() {
        this.interval = 0
        console.log("constructor rainbow");
    }

    start(config, draw, done) {
        let colors = new Array(config.numberOfLeds)
        let sameColorLed = 13;
        const colorSet = [
            '#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0099ff', '#0000ff', '#5500CC', '#ffffff'
        ]
        for (let i = 0; i < config.numberOfLeds; i++) {
            colors[i] = colorSet[2]
        }
        let time = 0

        this.interval = setInterval(() => {
            time += 1;
            const newColors = new Array(config.numberOfLeds)

            for (let i = 0; i < config.numberOfLeds; i++) {
                let colIndex = Math.floor(((time + i) / sameColorLed)) % colorSet.length;

                let col = colorSet[colIndex];
                if (col == "#5500CC")
                    newColors[i] = col;
                else
                    newColors[i] = ColorUtils.dim(col, 0.3);

            }
            draw(newColors)
        }, 1 / config.frequencyInHertz * 1000)

        done()
    }

    stop() {
        clearInterval(this.interval)
    }
}

export const config = {
    frequencyInHertz: Number,
    speed: Number
}