const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

const getBounds = values => {
    let min = null;
    let max = null;
    values.forEach(value => {
        if (min == null || value < min) {
            min = value;
        }
        if (max == null || value > max) {
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

module.exports = class WhiteRectangle extends LightProgram {
    constructor(config, geometry) {
        super(config, geometry);
    }

    init() {
        this.frame = 0;
        const xBounds = getBounds(this.geometry.x);
        const yBounds = getBounds(this.geometry.y);
        const zBounds = getBounds(this.geometry.z);
        this.centerX = xBounds.center;
        this.centerY = yBounds.center;
        this.centerZ = zBounds.center;
    }

    /**
     * For each LED (whose position is given by geometry.x[i] and geometry.y[i]),
     * we first translate its coordinates so that the geometry's center becomes (0,0),
     * then we rotate the translated coordinates by the negative of the rectAngle so that
     * the rectangle's long side aligns with the x-axis.
     *
     * In the local coordinate system the rectangle is defined as:
     *   - x from 0 to rectLength (starting at the center)
     *   - y from -rectWidth/2 to +rectWidth/2.
     *
     * LEDs whose local coordinates satisfy these bounds are painted white; all others are off.
     */
    drawFrame(leds) {
        this.frame++;
        let angle = this.config.rectAngle
        if (this.touchData){
            angle = this.touchData.angle;
        }
        // Convert the rectangle's angle from degrees to radians.
        // rectAngle is measured clockwise from right.
        const theta = angle * (Math.PI / 180);
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);

        for (let i = 0; i < this.numberOfLeds; i++) {
            // Translate LED coordinates so that the geometry's center is (0,0).
            const X = this.geometry.x[i] - this.centerX;
            const Y = this.geometry.y[i] - this.centerY;

            // Rotate the translated point by -theta so that the rectangle's long side aligns with the x-axis.
            const x_local = X * cosTheta + Y * sinTheta;
            const y_local = -X * sinTheta + Y * cosTheta;

            // In local coordinates, the rectangle starts at x = 0 and extends to x = rectLength.
            // Its vertical extent is from -rectWidth/2 to rectWidth/2.
            if (
                x_local >= 0 &&
                x_local <= this.config.rectLength &&
                y_local >= -this.config.rectWidth / 2 &&
                y_local <= this.config.rectWidth / 2
            ) {
                leds[i] = ColorUtils.hexToRgb("#ffffff");  // Paint white.
            } else {
                leds[i] = [0, 0, 0];  // Turn off.
            }
        }
    }

    // A preset configuration for convenience.
    static presets() {
        return {
            default: {
                rectAngle: 0,      // In degrees. 0° means the rectangle extends to the right.
                rectWidth: 0.1,    // Width of the rectangle (short side).
                rectLength: 0.5,   // Length of the rectangle (long side).
            }
        };
    }

    // Extend the configuration schema.
    static configSchema() {
        let config = super.configSchema();
        config.rectAngle = { type: Number, min: 0, max: 360, step: 1, default: 0 };
        config.rectWidth = { type: Number, min: 0, max: 1, step: 0.01, default: 0.1 };
        config.rectLength = { type: Number, min: 0, max: 5, step: 0.01, default: 2 };
        return config;
    }
};
