import { default as Geometry } from '../geometry/geometry'
import { default as warroLights } from '../geometry/warro'

export class Func {
    constructor() {
        this.interval = 0
        this.geometry = new Geometry(warroLights, 100, 100, 0, 0)
    }
    start(config, draw, done) {
        let Pon = true
        this.interval = setInterval(() => {
            const colors = new Array(config.numberOfLeds)
            for (let i = 0; i < config.numberOfLeds; i++) {
                const x = this.geometry.x[i]
                const y = this.geometry.y[i]

                const W = !(y < this.geometry.height / 2
                  && x > this.geometry.width / 3
                  && x < this.geometry.width * 2 / 3)

                const P = i > this.geometry.leds / 3
                  && x < this.geometry.width * 2 / 3

                let color = '#333333'
                if (Pon && W) {
                  color = '#ff0000'
                }
                if (!Pon && P) {
                  color = '#00ff00'
                }
                colors[i] = color
            }
            Pon = !Pon
            draw(colors)
        }, 1000)

        done()
    }
    stop() {
        clearInterval(this.interval)
    }
}

export const config = {
    frequencyInHertz: Number
}