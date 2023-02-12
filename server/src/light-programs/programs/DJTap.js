const _ = require("lodash");

const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {loadGradient} = require("../utils/gradients");

module.exports = class DJTap extends LightProgram {
    init() {
        this.holdWhite = 0;
        super.init();
    }

    tap(data){
        this.holdWhite = this.config.holdTime;
    }

    drawFrame(leds) {
        for (let i = 0; i < this.numberOfLeds; i++) {
            leds[i] = --this.holdWhite > 0 ? [255,255,255] : leds[i];
        }
    }

    // Override and extend config Schema
    static configSchema() {
        let res = super.configSchema();
        res.holdTime = { type: Number, min: 100, max: 10000, step: 100, default: 3000 };
        return res;
    }
};
