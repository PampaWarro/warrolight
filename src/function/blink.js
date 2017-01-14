export class Func {
    constructor() {
        this.interval = 0
    }
    start(config, draw, done) {
        let on = true
        this.interval = setInterval(() => {
            const colors = new Array(config.numberOfLeds)
            for (let i = 0; i < config.numberOfLeds; i++) {
                colors[i] = on ? '#00ff00' : '#ff0000'
            }
            on = !on
            draw(colors)
        }, 1 / config.frequencyInHertz * 1000)

        done()
    }
    stop() {
        clearInterval(this.interval)
    }
}

export const config = {
    frequencyInHertz: Number
}