const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class DJTap extends LightProgram {

    init() {
        this.effectsMap = {
            "relampejo": this.relampejo,
            "stars": this.stars
        }
        this.effect = this.effectsMap[this.config.effect];
        this.stars = new Array(this.numberOfLeds).fill([0, 0, 0]);
        this.flashes = [];
        this.time = 0;
        this.holdFlashes = 0;
        this.previousFlashesConfig = this.config.flashes;
    }

    stars(leds, context){
        let decay = this.config.decay;
        this.time++;
        for (let i = 0; i < this.numberOfLeds; i++) {
            let [r, g, b] = this.stars[i];
            // Dimm all the lights
            [r, g, b] = [r * decay, g * decay, b * decay];

            // Create new stars
            if (Math.random() < this.config.probability) {
                let [r2, g2, b2] = ColorUtils.HSVtoRGB(
                    this.config.starsColor + Math.random() / 5,
                    Math.random(),
                    Math.random() * 0.5 + 0.5
                );
                [r, g, b] = [r + r2, g + g2, b + b2];
            }

            this.stars[i] = [r, g, b];
        }
        if (this.config.move && (Math.floor((this.time*2)*this.config.moveSpeed) % 2 == 0)) {
            let first = this.stars.shift();
            this.stars.push(first);
        }
        this.stars.forEach(([r, g, b], i) => {
            leds[i] = ColorUtils.dim([r, g, b], this.config.brillo)
        });
    }
    relampejo(leds, context){
        for(const f of this.flashes) {
            for (let i = f.location; i < f.location+f.size; i++) {
                let loc = i % this.numberOfLeds;
                let [r, g, b] = this.stars[loc];

                let range = (i-f.location)/(f.size);

                let segmentDecay = this.config.decay ? range*range : 1;
                let [r2,g2,b2] = ColorUtils.HSVtoRGB(f.color+ range/5,this.config.blackAndWhite ? 0 : f.sat,segmentDecay);

                if(f.flashes < 3 || !this.config.blinkSpeed || Math.floor(f.flashes/this.config.blinkSpeed) % 2 !== 0) {
                    [r, g, b] = [r + r2, g + g2, b + b2];
                }

                this.stars[loc] = [r, g, b];
            }
            f.flashes--;
        }

        this.flashes = this.flashes.filter(f => f.flashes > 0);

        for(let i = 0; i< (this.config.flashes - this.flashes.length);i++) {
            if(Math.random() < this.config.refillChance) {
                this.addFlash();
            }
        }

        this.stars.forEach(([r, g, b], i) => {
            leds[i] = ColorUtils.dim([r, g, b], this.config.brillo);
        });
    }

    tap(data){
        console.log(this.config.effect);
        this.effect = this.effectsMap[this.config.effect];
        this.holdFlashes = data.client === 'party' ? this.config.partyLength : this.config.drumLength;
        this.previousFlashesConfig = this.config.flashes;
        this.config.flashes = 30;
    }

    addFlash() {
        let pos = Math.floor(Math.random() * this.numberOfLeds);
        let retina = this.geometry.density[pos];
        let size = this.numberOfLeds * this.config.lightingSize * retina;
        this.flashes.push({
            location:  pos,
            size: Math.ceil(Math.random()*size*0.7+size*0.3),
            flashes: Math.ceil(1+Math.random()*this.config.lightingDuration),
            color: Math.random(),
            sat: 0.75+Math.random()/4
        })
    }

    drawFrame(leds, context) {
        if(this.holdFlashes > 0){
            this.holdFlashes--;
            this.stars.fill([0, 0, 0]);

            this.effect(leds, context);
        }else{
            this.config.flashes = this.previousFlashesConfig;
        }


    }

    static presets() {
        return {
            DJTapStars: { effect: "stars" }
        };
    }

    static configSchema() {
        let config = super.configSchema();
        config.effect = { type: "string", values: ["relampejo", "stars"], default: "relampejo" };
        config.partyLength = { type: Number, min: 0, max: 500, step: 10, default: 50 };
        config.drumLength = { type: Number, min: 0, max: 100, step: 10, default: 10 };
        config.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
        config.flashes = {type: Number, min: 1, max: 50, step: 1, default: 2};
        config.lightingSize = {type: Number, min: 0.001, max: 1, step: 0.001, default: 0.15};
        config.lightingDuration = {type: Number, min: 1, max: 100, step: 1, default: 15};
        config.blinkSpeed = {type: Number, min: 0, max: 20, step: 1, default: 6};
        config.refillChance = {type: Number, min: 0.001, max: 1, step: 0.001, default: 0.2};
        config.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.45};
        config.blackAndWhite = { type: Boolean, default: false };
        config.decay = { type: Boolean, default: true };
        config.decay = { type: Number, min: 0, max: 1, step: 0.005, default: 0.9 };
        config.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
        config.probability = {type: Number, min: 0, max: 1, step: 0.0001, default: 0.1};
        config.move = { type: Boolean, default: false };
        config.moveSpeed = { type: Number, min: 0, step: 0.01, max: 1, default: 0.2 };
        config.starsColor = {type: Number, min: 0, max: 1, step: 0.01, default: 0};
        // config.starsColor = {type: Number, min: 0, max: 1,
        // step: 0.01, default: 0};
        return config;
    }
};
