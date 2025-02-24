const _ = require('lodash');
const LightProgram = require('./../base-programs/LightProgram');
const programsByShape = require('./../base-programs/ProgramsByShape');

const getBounds = values => {
    let min = null;
    let max = null;
    values.forEach(value => {
        if (min === null || value < min) {
            min = value;
        }
        if (max === null || value > max) {
            max = value;
        }
    });
    return {
        min: min,
        max: max,
        center: (min + max) / 2,
        scale: max - min
    };
};

module.exports = class RectProgram extends LightProgram {
    init() {
        this.frame = 0;
        const xBounds = getBounds(this.geometry.x);
        const yBounds = getBounds(this.geometry.y);
        const zBounds = getBounds(this.geometry.z);
        this.centerX = xBounds.center;
        this.centerY = yBounds.center;
        this.centerZ = zBounds.center;
        this.subprograms = _.map(this.config.programs, config => [
            this.getProgramInstanceFromParam(config),
            new Array(this.numberOfLeds)
        ]);

        if (this.subprograms.length > 0){
            this.innerProgram = this.subprograms[0][0];
        }

        // Initialize angle(s) based on motionMode.
        if (this.config.motionMode === 'double') {
            this.currentAngleLeft = (this.touchData && typeof this.touchData.angleLeft !== 'undefined')
                ? this.touchData.angleLeft : this.config.rectAngle;
            this.currentAngleRight = (this.touchData && typeof this.touchData.angleRight !== 'undefined')
                ? this.touchData.angleRight : this.config.rectAngle;
            this.targetAngleLeft = this.currentAngleLeft;
            this.targetAngleRight = this.currentAngleRight;
        } else {
            const initAngle = (this.touchData ? this.touchData.angle : this.config.rectAngle);
            this.currentAngle = initAngle;
            this.targetAngle = initAngle;
        }
    }

    getProgramInstanceFromParam({ programName, config, shape }) {
        let p = null;
        // For performance, only use programsByShape if there is a shape
        if (shape) {
            const programClass = this.lightController.programs[programName].generator;
            const byShapeClass = programsByShape({ [shape]: [programClass, config || {}] });
            p = new byShapeClass(this.config, this.geometry, this.shapeMapping, this.lightController);
        } else {
            p = this.lightController.instanciateProgram(programName);
            p.updateConfig({ ...p.config, ...config });
        }
        p.init();
        return p;
    }

    /**
     * In drawFrame we now branch based on motionMode.
     *
     * - In single mode (default), we use a single angle and intensity (as before).
     *
     * - In double mode, we update two sets of angles (with smoothing) and compute two effective
     *   rectangles (each with its own effective length, based on intensityLeft/intensityRight).
     *
     * For each LED, we translate its global coordinates relative to the geometry center,
     * then (for each rectangle) rotate by the effective angle and check whether it falls within
     * the strict rectangle or within its blur zone. If the LED qualifies for either rectangle,
     * its color is taken from the inner program.
     *
     * The angle adjustment (with flipHorizontally) remains the same as before.
     */
    drawFrame(leds, context) {
        this.innerProgram = this.subprograms[0][0];
        this.frame++;

        // Prepare inner program's LED output.
        let innerLeds = new Array(this.numberOfLeds);
        for (let i = 0; i < this.numberOfLeds; i++) {
            innerLeds[i] = [0, 0, 0, 0];
        }
        this.innerProgram.time = this.time;
        this.innerProgram.drawFrame(innerLeds, context);

        // Helper: checks whether a given LED (in a rectangle’s local coordinate system)
        // is inside the strict rectangle or qualifies in the blur zone.
        const checkLEDInRect = (x_local, y_local, effectiveRectLength) => {
            const rectWidth = this.config.rectWidth;
            if (
                x_local >= 0 &&
                x_local <= effectiveRectLength &&
                y_local >= -rectWidth / 2 &&
                y_local <= rectWidth / 2
            ) {
                return true;
            } else {
                const blurExtent = this.config.blurExtent;
                if (
                    x_local >= -blurExtent &&
                    x_local <= effectiveRectLength + blurExtent &&
                    y_local >= -rectWidth / 2 - blurExtent &&
                    y_local <= rectWidth / 2 + blurExtent
                ) {
                    let dx = 0;
                    if (x_local < 0) {
                        dx = -x_local;
                    } else if (x_local > effectiveRectLength) {
                        dx = x_local - effectiveRectLength;
                    }
                    let dy = 0;
                    if (y_local < -rectWidth / 2) {
                        dy = (-rectWidth / 2) - y_local;
                    } else if (y_local > rectWidth / 2) {
                        dy = y_local - rectWidth / 2;
                    }
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < blurExtent) {
                        const probability = this.config.blurRandomness * (1 - distance / blurExtent);
                        return (Math.random() < probability);
                    }
                }
            }
            return false;
        };

        if (this.config.motionMode === 'double') {
            // --- DOUBLE MODE ---
            // Update left and right target angles every angleUpdateInterval frames.
            if (this.frame % this.config.angleUpdateInterval === 0) {
                this.targetAngleLeft = (this.touchData && typeof this.touchData.angleLeft !== 'undefined')
                    ? this.touchData.angleLeft : this.config.rectAngle;
                this.targetAngleRight = (this.touchData && typeof this.touchData.angleRight !== 'undefined')
                    ? this.touchData.angleRight : this.config.rectAngle;
            }
            const smoothingFactor = (this.config.angleSpeed / 100) / this.config.angleUpdateInterval;
            let deltaLeft = ((this.targetAngleLeft - this.currentAngleLeft + 540) % 360) - 180;
            this.currentAngleLeft = (this.currentAngleLeft + deltaLeft * smoothingFactor + 360) % 360;
            let deltaRight = ((this.targetAngleRight - this.currentAngleRight + 540) % 360) - 180;
            this.currentAngleRight = (this.currentAngleRight + deltaRight * smoothingFactor + 360) % 360;

            // Adjust angles based on flipHorizontally if needed.
            let effectiveAngleLeft = this.currentAngleLeft;
            let effectiveAngleRight = this.currentAngleRight;
            if (!this.config.flipHorizontally) {
                effectiveAngleLeft = 180 - this.currentAngleLeft;
                effectiveAngleRight = 180 - this.currentAngleRight;
                effectiveAngleLeft = ((effectiveAngleLeft % 360) + 360) % 360;
                effectiveAngleRight = ((effectiveAngleRight % 360) + 360) % 360;
                if (effectiveAngleLeft === 0) effectiveAngleLeft = 360;
                if (effectiveAngleRight === 0) effectiveAngleRight = 360;
            }
            const thetaLeft = effectiveAngleLeft * (Math.PI / 180);
            const thetaRight = effectiveAngleRight * (Math.PI / 180);
            const cosThetaLeft = Math.cos(thetaLeft), sinThetaLeft = Math.sin(thetaLeft);
            const cosThetaRight = Math.cos(thetaRight), sinThetaRight = Math.sin(thetaRight);

            // Determine effective rectangle lengths for left/right using their intensities.
            const intensityLeft = (this.touchData && typeof this.touchData.intensityLeft !== 'undefined')
                ? this.touchData.intensityLeft : 1;
            const intensityRight = (this.touchData && typeof this.touchData.intensityRight !== 'undefined')
                ? this.touchData.intensityRight : 1;
            const effectiveRectLengthLeft = this.config.rectLength * intensityLeft;
            const effectiveRectLengthRight = this.config.rectLength * intensityRight;

            // For each LED, compute its position relative to the geometry center and then
            // test it against both the left and right rectangles.
            for (let i = 0; i < this.numberOfLeds; i++) {
                const X = this.geometry.x[i] - this.centerX;
                const Y = this.geometry.y[i] - this.centerY;
                // Left rectangle coordinates.
                const x_local_left = X * cosThetaLeft + Y * sinThetaLeft;
                const y_local_left = -X * sinThetaLeft + Y * cosThetaLeft;
                // Right rectangle coordinates.
                const x_local_right = X * cosThetaRight + Y * sinThetaRight;
                const y_local_right = -X * sinThetaRight + Y * cosThetaRight;

                const litLeft = checkLEDInRect(x_local_left, y_local_left, effectiveRectLengthLeft);
                const litRight = checkLEDInRect(x_local_right, y_local_right, effectiveRectLengthRight);

                if (litLeft || litRight) {
                    leds[i] = innerLeds[i];
                } else {
                    leds[i] = [0, 0, 0, 0];
                }
            }
        } else {
            // --- SINGLE MODE ---
            if (this.frame % this.config.angleUpdateInterval === 0) {
                this.targetAngle = this.touchData ? this.touchData.angle : this.config.rectAngle;
            }
            let delta = ((this.targetAngle - this.currentAngle + 540) % 360) - 180;
            const smoothingFactor = (this.config.angleSpeed / 100) / this.config.angleUpdateInterval;
            this.currentAngle = (this.currentAngle + delta * smoothingFactor + 360) % 360;
            let effectiveAngle = this.currentAngle;
            if (!this.config.flipHorizontally) {
                effectiveAngle = 180 - this.currentAngle;
                effectiveAngle = ((effectiveAngle % 360) + 360) % 360;
                if (effectiveAngle === 0) effectiveAngle = 360;
            }
            const theta = effectiveAngle * (Math.PI / 180);
            const cosTheta = Math.cos(theta);
            const sinTheta = Math.sin(theta);
            const intensity = (this.touchData && typeof this.touchData.intensity !== 'undefined')
                ? this.touchData.intensity : 1;
            const effectiveRectLength = this.config.rectLength * intensity;

            for (let i = 0; i < this.numberOfLeds; i++) {
                const X = this.geometry.x[i] - this.centerX;
                const Y = this.geometry.y[i] - this.centerY;
                const x_local = X * cosTheta + Y * sinTheta;
                const y_local = -X * sinTheta + Y * cosTheta;
                if (checkLEDInRect(x_local, y_local, effectiveRectLength)) {
                    leds[i] = innerLeds[i];
                } else {
                    leds[i] = [0, 0, 0, 0];
                }
            }
        }
    }

    updateConfig(newConfig) {
        if (this.subprograms == undefined || this.subprograms.length == 0){
            this.subprograms = _.map(newConfig.programs, config => [
                this.getProgramInstanceFromParam(config),
                new Array(this.numberOfLeds)
            ]);
        }
        // Adapted update for a single subprogram.
        if (newConfig.programs) {
            let newProgDef = newConfig.programs[0];
            let oldProgDef = this.config.programs ? this.config.programs[0] : null;
            let subprogram = null;
            if (
                oldProgDef &&
                oldProgDef.programName === newProgDef.programName &&
                oldProgDef.shape === newProgDef.shape
            ) {
                subprogram = this.subprograms[0][0];
                subprogram.updateConfig({ ...subprogram.config, ...newProgDef.config });
            } else {
                subprogram = this.getProgramInstanceFromParam(newProgDef);
            }
            if (
                oldProgDef &&
                oldProgDef.presetName !== newProgDef.presetName &&
                newProgDef.presetName
            ) {
                const presets = this.lightController.getProgramPresets(newProgDef.programName);
                const defaults = this.lightController.getProgramDefaultParams(newProgDef.programName);
                newProgDef.config = presets[newProgDef.presetName];
                subprogram.updateConfig({ ...defaults, ...presets[newProgDef.presetName] });
            }
            this.subprograms = [[subprogram, new Array(this.numberOfLeds).fill([0, 0, 0, 0])]];
            this.innerProgram = subprogram;
        }
        super.updateConfig(newConfig);
    }

    getDebugHelpers() {
        return _.flatMap(this.subprograms, ([p]) => p.getDebugHelpers());
    }

    static presets() {
        return {
            default: {
                motionMode: 'single',   // "single" or "double" (default is single)
                rectAngle: 0,         // In degrees. 0° means the rectangle extends to the right.
                rectWidth: 20,       // Width (short side) of the rectangle.
                rectLength: 1,      // Base length (long side) of the rectangle.
                programs: [{ programName: 'all-white' }],
                angleUpdateInterval: 3, // Update target angle every 3 frames.
                angleSpeed: 15,         // Interpolation speed (0–100, default 50).
                // New blur parameters:
                blurExtent: 3.75,        // Maximum distance outside the rectangle for the blur effect.
                blurRandomness: 0.75,  // Randomness factor for the blur (0 = hard edge, 1 = maximum randomness).
                // New flip parameter:
                flipHorizontally: true  // If true, the angle is used as-is; if false, it is transformed.
            }
        };
    }

    static configSchema() {
        let config = super.configSchema();
        config.motionMode = { type: String, default: 'double', enum: ['single', 'double'] };
        config.rectAngle = { type: Number, min: 0, max: 360, step: 1, default: 0 };
        config.rectWidth = { type: Number, min: 1, max: 100, step: 1, default: 20 };
        config.rectLength = { type: Number, min: 1, max: 100, step: 1, default: 1 };
        config.angleUpdateInterval = { type: Number, min: 1, max: 60, step: 1, default: 3 };
        config.angleSpeed = { type: Number, min: 0, max: 100, step: 1, default: 15 };
        config.programs = { type: 'programs', default: [{ programName: 'all-white' }] };
        // New blur parameters in config schema.
        config.blurExtent = { type: Number, min: 0, max: 100, step: 0.1, default: 3.75 };
        config.blurRandomness = { type: Number, min: 0, max: 1, step: 0.01, default: 0.75 };
        // New flip parameter in config schema.
        config.flipHorizontally = { type: Boolean, default: true };
        config.multiply = { type: Boolean, default: false };
        return config;
    }
};
