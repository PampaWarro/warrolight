export class Func {
    constructor() {
        this.interval = 0
    }
    start(config, draw, done) {
        this.interval = setInterval(() => {
            const colors = new Array(config.numberOfLeds)
            for (let i = 0; i < config.numberOfLeds; i++) {
                colors[i] = '#ffffff'
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
    frequencyInHertz: Number
}