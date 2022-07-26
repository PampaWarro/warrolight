const _ = require("lodash");
const {getAllPresets, getFilePresets} = require("../../presets.js");
const createMultiProgram = require("../base-programs/MultiPrograms");
const animateParamProgram = require("../base-programs/AnimatePrograms");
const programsByShape = require("../base-programs/ProgramsByShape");
const mixPrograms = require("../base-programs/MixProgram");

const Rainbow = require("./../../light-programs/programs/rainbow");
const Radial = require("./radial");
const Lineal = require("./lineal");
const RadialSun = require("./radialSun");
const Stars = require("./stars");
const VolumeDot = require("./musicVolumeDot");
const VolumeDotRandom = require("./musicVolumeDotRandom");
const VolumeBars = require("./musicVolumeBars");
const MusicFlow = require("./musicFlow");
// const Fire = require("./fire").Func;
const SpeedingSpear = require("./speeding-spear");
const ColorSpear = require("./color-spear");
const AliveDots = require("./aliveDots");
const SoundWaves = require("./../../light-programs/programs/sound-waves");
const WaterFlood = require("./water-flood");
const Rays = require("./rays");
const AliveDotsSpeed = require("./aliveDotsSpeed");
const BassWarpGrid = require("./bassWarpGrid");
const Bombs = require("./bombs");
const Shapes = require("./shapes");
const Mix = require("./mix");
const WarroBass = require("./warroBass");

const MusicFrequencyDot = require("./musicFrequencyDot");
const BandParticles = require("./bandParticles");
const StripePatterns = require("./stripe-patterns");
const FrequencyActivation = require("./frequencyActivation");
const Circles = require("./circles");

const seconds = 1000;
// const seconds = (1/6) * 1000;
const minutes = 60 * seconds;

// TODO: update these placeholders with something nicer.
const intro = Circles;
const rampUp = ColorSpear;
const interlude = SoundWaves;
const peak = Shapes;
const rampDown = Rays;

module.exports = createMultiProgram(
  [
    {
      duration: 1 * minutes,
      program: intro,
    },
    {
      duration: 3 * minutes,
      program: rampUp,
    },
    {
      duration: 2 * minutes,
      program: interlude,
    },
    {
      duration: 3 * minutes,
      program: peak,
    },
    {
      duration: 3 * minutes,
      program: rampDown,
    },
  ],
  false,
  5 * seconds
);
