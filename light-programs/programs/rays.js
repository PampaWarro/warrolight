const TimeTickedFunction = require("./../base-programs/TimeTickedFunction");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require('lodash')

module.exports = class Stars extends TimeTickedFunction {
    constructor(config, leds) {
        super(config, leds);
        this.stars = [... Array(this.numberOfLeds)].map(() => [0, 0, 0]);
        this.time = 0;

        this.rays = _.map(_.range(0,5), () => this.createRay())
    }

    createRay() {
        let self = this
        return {
            pos: Math.floor(Math.random() * this.numberOfLeds),
            speed: (Math.random() * 5 + 0.2),
            color: Math.random(),
            saturation: Math.random() * 0.1 + 0.9,
            direction: Math.sign(Math.random() - 0.5),
            update: function () {
                // let vol = self.averageRelativeVolumeSmoothed;
                // let volDiff
                this.pos = (this.pos + this.speed * self.config.globalSpeed * this.direction)
            }
        }
    }

    drawFrame(draw, done) {
        // let decay = this.config.decay;
        this.time++
        let decay = this.config.decay;

        for (let i = 0; i < this.numberOfLeds; i++) {
            let [r,g,b] = this.stars[i];
            // Dimm all the lights
            [r, g, b] = [r * decay, g * decay, b * decay];

            this.stars[i] = [Math.floor(r), Math.floor(g), Math.floor(b)];
        }

        _.each(this.rays, ray => {
            let from = ray.pos
            ray.update();
            let to = ray.pos

            if(to < from){
                let toto = to
                to = from
                from = toto
            }

            let energy = 1 / (to - from) * this.config.brillo
            let fromLoop = Math.ceil(from) - 1
            let toLoop = Math.floor(to)+1;
            for(let i = fromLoop; i < toLoop; i++) {
                let pos = i
                let [r2, g2, b2] = ColorUtils.HSVtoRGB(ray.color, ray.saturation, 1);

                let low = energy;
                if(i === fromLoop) {
                    low = (Math.ceil(from) - from) * energy
                } else if((i+1) === toLoop) {
                    low = (to - Math.floor(to)) * energy
                }

                pos = pos % this.numberOfLeds
                pos = pos >= 0 ? pos : pos + this.numberOfLeds
                let [r, g, b] = this.stars[pos];
                [r, g, b] = [Math.min(255, r + low * r2), Math.min(255, g + low * g2), Math.min(255, b + low * b2)];
                this.stars[pos] = [r, g, b];
            }
        })

        let res = this.stars.map(([r, g, b]) => ColorUtils.rgbToHex(r, g, b))

        draw(res);
    }

    static presets() {
        return {
            pocasSlow: {decay: 0.9},
        }
    }

    static configSchema() {
        let config = super.configSchema();
        config.decay = {type: Number, min: 0, max: 1, step: 0.005, default: 0.8}
        config.globalSpeed = {type: Number, min: 0, max: 5, step: 0.005, default: 1}
        config.brillo = {type: Number, min: 0, max: 1, step: 0.01, default: 1}
        config.starsColor = {type: Number, min: 0, max: 1, step: 0.01, default: 0}
        return config;
    }
}