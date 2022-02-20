const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const GlobalGame = require("./../conga-utils/GlobalGame");
const _ = require("lodash");
const programsByShape = require("./../base-programs/ProgramsByShape");

module.exports = class CongaCelebratiton extends LightProgram {
    init() {
        this.past = null;
        this.celebrate = 0;
        this.winner = false;
        this.colors = new Array(this.numberOfLeds).fill(ColorUtils.HSVtoRGB(0, 0, this.config.brillo));
        // Shallow copy of schedule
        this.programs = _.map(this.config.programs, config => this.getProgramInstanceFromParam(config));
    }

    getProgramInstanceFromParam({programName, config, shape}) {
        let p = null;
        // For performance, only use programsByShape if there is a shape
        if(shape) {
            const programClass = this.lightController.programs[programName].generator;
            const byShapeClass = programsByShape({[shape]: [programClass, config || {}]});
            p = new byShapeClass(this.config, this.geometry, this.shapeMapping, this.lightController);
        } else {
            p = this.lightController.instanciateProgram(programName);
            p.updateConfig({...p.config, ...config})
        }

        p.init();
        return p;
    }

    getCelebrationBaseColors() {



    }

    drawFrame(draw, audio) {
        this.colors = new Array(this.numberOfLeds).fill(ColorUtils.HSVtoRGB(0, 0, this.config.brillo/100));
        let winner = GlobalGame.game.winner();
        let combinedColors = this.colors;
        if (winner && (this.celebrate == 0 || winner != this.winner)){
            this.winner = winner;
            this.celebrate = this.config.celebrationDurationInFrames;
        }
        if (this.celebrate > 0){
            let winnerColor = this.winner == 1 ? GlobalGame.game.player1Color : GlobalGame.game.player2Color;
            this.colors = new Array(this.numberOfLeds).fill(winnerColor);
            this.celebrate--;
        }
        if(!this.config.animateOnlyOnCelebration || this.celebrate > 0){
            combinedColors = this.colors;

            this.extraTime = (this.extraTime || 0) + Math.random() * 10;

            for (const prog of this.programs) {
                // Done by ProgramScheduler, has to be replicated here
                prog.timeInMs = this.timeInMs;
                let globalBrightness = prog.config.globalBrightness || 0;
                prog.drawFrame((colors) => {
                    for (let i = 0; i < this.numberOfLeds; i++) {
                        let [r, g, b, a] = combinedColors[i]
                        const [r2, g2, b2, a2] = colors[i];
                        if (this.config.multiply) {
                            // globalBrightness of 0 means "the layer does not darken the other layer"
                            r = r * ((r2+(255-r2)*(1-globalBrightness)) || 0) / 255;
                            g = g * ((g2+(255-g2)*(1-globalBrightness)) || 0) / 255;
                            b = b * ((b2+(255-b2)*(1-globalBrightness)) || 0) / 255;
                            a = a + (a2 || 0)
                        } else {
                            r += (r2 || 0) * globalBrightness;
                            g += (g2 || 0) * globalBrightness;
                            b += (b2 || 0) * globalBrightness;
                            a += a2 || 0;
                        }
                        combinedColors[i] = [r, g, b, a];
                    }
                }, audio)
            }
        }
        draw(combinedColors);
    }

    updateConfig(newConfig) {
        // TODO: backwards compatibility with previous version of mix
        if(newConfig.a && newConfig.b) {
            let {a, b, ... other} = newConfig;
            newConfig = {... other, programs: [a, b]}
        }

        // Override LightProgram version to decide when a program init needs to be called
        if (this.programs) {
            let updated = newConfig.programs;
            let oldConfigs = this.config.programs;

            this.programs = _.map(updated, (newProgDef, i) => {
                let oldProgDef = oldConfigs[i];

                let subprogram = null;

                // Detect if the selected program type is the same or it changed
                if (oldProgDef && oldProgDef.programName === newProgDef.programName && oldProgDef.shape === newProgDef.shape) {
                    subprogram = this.programs[i]
                    subprogram.updateConfig({ ... subprogram.config, ... newProgDef.config })
                } else {
                    subprogram = this.getProgramInstanceFromParam(newProgDef)
                }

                // Detect if a different preset was selected and apply the default+preset program config
                if(oldProgDef && oldProgDef.presetName !== newProgDef.presetName && newProgDef.presetName) {
                    const presets = this.lightController.getProgramPresets(newProgDef.programName);
                    const defaults = this.lightController.getProgramDefaultParams(newProgDef.programName);
                    newProgDef.config = presets[newProgDef.presetName];
                    subprogram.updateConfig({ ... defaults, ... presets[newProgDef.presetName] })
                }

                return subprogram
            });
        }

        super.updateConfig(newConfig)
    }

    // Override and extend config Schema
    static configSchema() {
        let res = super.configSchema();
        res.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 0.5 };
        res.celebrationDurationInFrames = { type: Number, min: 0, max: 200, step: 5, default: 500 };
        res.animateOnlyOnCelebration = {type: Boolean, default: false};
        res.programs = {type: 'programs', default: [{programName: 'circles'}]};
        res.multiply = {type: Boolean, default: false};
        return res;
    }
};