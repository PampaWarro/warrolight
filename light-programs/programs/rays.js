const TimeTickedFunction = require("./../base-programs/TimeTickedFunction");
const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require('lodash')

module.exports = class Stars extends SoundBasedFunction {
    constructor(config, leds) {
        super(config, leds);
        this.time = 0;
        this.rays = []
        this.stars = []
    }

    start(config, draw, done){
        super.start(config, draw, done)
        this.stars = [... Array(this.numberOfLeds)].map(() => [0, 0, 0]);
        this.rays = _.map(_.range(0,this.config.numberOfParticles), () => this.createRay())
    }

    createRay() {
        let self = this
        return {
            pos: Math.floor(Math.random() * this.numberOfLeds),
            speed: (Math.random() * 2 + 0.2),
            color: Math.random(),
            saturation: Math.random(),
            direction: Math.sign(Math.random() - 0.5),
            update: function () {
                // let vol = self.averageRelativeVolumeSmoothed || 0.1;
                let vol = 1
                this.pos = (this.pos + this.speed * self.config.globalSpeed * this.direction * vol)
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

        let sat = this.config.colorSaturationRange
        let hueOff = this.config.colorHueOffset
        let hue = this.config.colorHueAmplitude

        _.each(this.rays, ray => {
            let from = ray.pos
            ray.update();
            let to = ray.pos

            if(to < from){
                let toto = to
                to = from
                from = toto
            }

            let energy = 1 / ((to - from) || 1) * this.config.brillo
            let fromLoop = Math.ceil(from) - 1
            let toLoop = Math.floor(to)+1;
            for(let i = fromLoop; i < toLoop; i++) {
                let pos = i
                let [r2, g2, b2] = ColorUtils.HSVtoRGB(hueOff+(ray.color*hue), ray.saturation*sat + 1 - sat, 1);

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
            normal: {},
            rainbowSmoke: {decay: 0.9, globalSpeed: 0.9,  colorSaturationRange: 0, numberOfParticles: 5, colorHueAmplitude: 1},
            colorSmoke: {brillo: 0.5, decay: 0.96, globalSpeed: 0.9,  colorSaturationRange: 0, numberOfParticles: 15, colorHueAmplitude: 1},
            crazy: {decay: 0.2, globalSpeed: 2,  colorSaturationRange: 0, numberOfParticles: 10, colorHueAmplitude: 1},
            fireFast: {brillo: 1, decay: 0.8, globalSpeed: 0.7,  colorSaturationRange: 0.07, numberOfParticles: 10, colorHueAmplitude: 0.12, colorHueOffset: 0.98},
            fireSlow: {brillo: 1, decay: 0.8, globalSpeed: 0.25,  colorSaturationRange: 0.07, numberOfParticles: 10, colorHueAmplitude: 0.12, colorHueOffset: 0.98}
        }
    }

    static configSchema() {
        let config = super.configSchema();
        config.decay = {type: Number, min: 0, max: 1, step: 0.005, default: 0.8}
        config.globalSpeed = {type: Number, min: 0, max: 5, step: 0.005, default: 1}
        config.brillo = {type: Number, min: 0, max: 1, step: 0.01, default: 0.2}
        config.numberOfParticles = {type: Number, min: 1, max: 30, step: 1, default: 5}
        config.colorHueAmplitude = {type: Number, min: 0, max: 1, step: 0.01, default: 1}
        config.colorHueOffset = {type: Number, min: 0, max: 1, step: 0.01, default: 0.05}
        config.colorSaturationRange = {type: Number, min: 0, max: 1, step: 0.01, default: 0.2}
        return config;
    }
}