export class Func {
    constructor() {
        this.interval = 0
    }
    start(config, draw, done) {
        let colors = new Array(config.numberOfLeds)
        let sameColorLed = 13;
        const colorSet = [
            '#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0099ff', '#0000ff', '#5500CC'
        ]
        for (let i = 0; i < config.numberOfLeds; i++) {
            colors[i] = colorSet[2]
        }
        let time = 0

        this.interval = setInterval(() => {
          time += 3;
          const newColors = new Array(config.numberOfLeds)

          for (let i = 0; i < config.numberOfLeds; i++) {
            let colIndex = Math.floor(((time + i) / sameColorLed)) % colorSet.length;
            newColors[i] = colorSet[colIndex];
          }
          draw(newColors)
        }, 1 / config.frequencyInHertz)

        done()
    }
    stop() {
        clearInterval(this.interval)
    }
}

export const config = {
    frequencyInHertz: Number
}