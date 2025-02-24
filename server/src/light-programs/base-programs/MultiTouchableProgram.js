const _ = require("lodash");
const LightProgram = require("./LightProgram");
const ColorUtils = require("../utils/ColorUtils");

function arraySchedule(schedule, random) {
    // Shallow copy of schedule
    schedule = [].concat(schedule).map(item => _.extend({}, item));
    if (random) {
        return () => _.sample(schedule);
    } else {
        let position = 0;
        return () => {
            const item = schedule[position];
            position = (position + 1) % schedule.length;
            return item;
        };
    }
}

module.exports = function createMultiProgram(
    programSchedule,
    random = false,
    crossFade = 20000,
    randomCrossFade = false
) {
    return class MultiProgram extends LightProgram {
        constructor(config, geometry, shapeMapping, lightController) {
            super(config, geometry, shapeMapping, lightController);

            this.programSchedule = Array.isArray(programSchedule)
                ? arraySchedule(programSchedule, random)
                : programSchedule;
        }

        instantiate(scheduleItem) {
            return new scheduleItem.program(
                scheduleItem.program.extractDefaults(),
                this.geometry,
                this.shapeMapping,
                this.lightController
            );
        }

        init() {
            this.previous = null;
            this.current = null;
            this.nextStartChange = null;
            this.previousColors = new Array(this.numberOfLeds).fill([0, 0, 0]);
            this.currentColors = new Array(this.numberOfLeds).fill([0, 0, 0]);
        }

        touch(data){
            this.current.touch(data);
        }

        drawFrame(leds, context) {
            // init
            if (this.current === null) {
                let scheduleItem = this.programSchedule();
                this.current = this.instantiate(scheduleItem);
                this.current.init();
                this.nextStartChange = Date.now() + scheduleItem.duration;

                console.log(`Playing ${this.current.toString()}`, )
            }

            if (this.previous) {
                const previousColors = this.previousColors;
                const currentColors = this.currentColors;
                // TODO: remove this forwarding somehow
                this.previous.timeInMs = this.timeInMs;
                this.current.timeInMs = this.timeInMs;

                previousColors.fill([0, 0, 0]);
                this.previous.drawFrame(previousColors, context);
                currentColors.fill([0, 0, 0]);
                this.current.drawFrame(currentColors, context);

                let alpha = _.clamp(
                    (Date.now() - this.crossFadeStart)
                    / (this.crossFadeFinish - this.crossFadeStart), 0, 1);

                for (let i = 0; i < currentColors.length; i++) {
                    if(previousColors[i] && currentColors[i]) {
                        leds[i] = ColorUtils.mix(previousColors[i], currentColors[i], alpha);
                    } else {
                        console.warn("Cannot do color crossfade between ", previousColors[i], currentColors[i])
                        leds[i] = [0,0,0,0]
                    }
                }

            } else {
                // TODO: remove this forwarding somehow
                this.current.timeInMs = this.timeInMs;

                this.current.drawFrame(leds, context);
            }

            if (this.crossFadeFinish && Date.now() >= this.crossFadeFinish) {
                this.crossFadeStart = null;
                this.crossFadeFinish = null;
                this.previous = null;
            }

            if (Date.now() >= this.nextStartChange) {
                this.startNextProgram();
            }
        }

        startNextProgram() {
            this.crossFadeStart = Date.now();

            let crossFadeDuration = randomCrossFade ? crossFade * Math.random() : crossFade;

            this.crossFadeFinish = Date.now() + crossFadeDuration;

            const scheduleItem = this.programSchedule();
            this.previous = this.current;
            this.current = this.instantiate(scheduleItem);
            this.current.init();
            this.nextStartChange = Date.now() + scheduleItem.duration;

            console.log(`Playing ${this.current.toString()} [CROSSFADE ${(crossFadeDuration/1000).toFixed(1)}s]`, )
        }

        updateConfig(config) {
            this.config = config;
        }

        static configSchema() {
            let schema = super.configSchema();
            return schema;
        }
    };
};
