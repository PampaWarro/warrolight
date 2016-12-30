export class Func {
    constructor() {
        this.interval = 0
    }
    start(config, draw, done) {
        let ind = -1
        let colors = new Array(config.numberOfLeds)
        const colorSet = [
            '#00ff00', '#ff00ff', '#0000ff'
        ]
        for (let i = 0; i < config.numberOfLeds; i++) {
            colors[i] = colorSet[2]
        }
        let currentColor = 0
        this.interval = setInterval(() => {
            ind++;
            if (ind === config.numberOfLeds) {
                ind = 0
                currentColor = (currentColor + 1) % colorSet.length
            }
            const newColors = new Array(config.numberOfLeds)
            for (let i = 0; i < config.numberOfLeds; i++) {
                newColors[i] = i === ind ? colorSet[currentColor] : colors[i]
            }
            draw(newColors)
            colors = newColors
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