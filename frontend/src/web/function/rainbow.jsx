export class Func {
    constructor() {
        this.interval = 0
        console.log("constructor rainbow");
    }

    start(config, draw, done) {
        let colors = new Array(config.numberOfLeds)
        let sameColorLed = 13;
        const colorSet = [
            '#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0099ff', '#0000ff', '#5500CC', '#ffffff'
        ]
        for (let i = 0; i < config.numberOfLeds; i++) {
            colors[i] = colorSet[2]
        }
        let time = 0

        this.interval = setInterval(() => {
            time += 1;
            const newColors = new Array(config.numberOfLeds)

            for (let i = 0; i < config.numberOfLeds; i++) {
                let colIndex = Math.floor(((time + i) / sameColorLed)) % colorSet.length;

                let col = colorSet[colIndex];
                if (col == "#5500CC")
                    newColors[i] = col;
                else
                    newColors[i] = this.dim(col, 0.3);

            }
            draw(newColors)
        }, 1 / config.frequencyInHertz)

        done()
    }

    dim(hexColor, number) {
        var [r, g, b] = this.hexToRgb(hexColor);
        r = Math.floor(r * number);
        g = Math.floor(g * number);
        b = Math.floor(b * number);
        return this.rgbToHex(r, g, b);
    }

    rgbToHex(r, g, b) {
        function componentToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }

        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    hexToRgb(hexColor) {
        if (hexColor) {
            // in three-character format, each value is multiplied by 0x11 to give an
            // even scale from 0x00 to 0xff
            let hex = hexColor.replace('#', '');
            let r = parseInt(hex.substring(0, 2), 16);
            let g = parseInt(hex.substring(2, 4), 16);
            let b = parseInt(hex.substring(4, 6), 16);

            return [r, g, b];
        }
    }

    stop() {
        clearInterval(this.interval)
    }
}

export const config = {
    frequencyInHertz: Number
}