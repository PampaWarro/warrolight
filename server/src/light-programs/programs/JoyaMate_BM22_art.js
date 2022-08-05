const _ = require("lodash");
const {getAllPresets, getFilePresets} = require("../../presets.js");
const overrideBrightness = require("../base-programs/OverrideBrightness");
const createMultiProgram = require("../base-programs/MultiPrograms");
const animateParamProgram = require("../base-programs/AnimatePrograms");
const programsByShape = require("../base-programs/ProgramsByShape");
const mixPrograms = require("../base-programs/MixProgram");

const Rainbow = require("./../../light-programs/programs/rainbow");
const Polar = require("./polar");
const Noise = require("./noise");
const Radial = require("./radial");
const Radial3D = require("./radial3d");
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
const CA = require("./ca");
const VertexGlow = require("./vertexGlow");

const timeScale = 1; // RESET to 1 before commet.
const seconds = (1 / timeScale) * 1000;
const minutes = 60 * seconds;

function linearFade(start, startMs, end, endMs) {
  const fadeDuration = endMs - startMs;
  return function({timeInMs}) {
    const timeSinceStart = timeInMs - this.startTimeInMs;
    const alpha = _.clamp((timeSinceStart - startMs) / fadeDuration, 0, 1);
    return (1 - alpha) * start + alpha * end;
  };
}

function animateAdaptor(f) {
  return function(_, context) { return f.call(this, context); }
}

const introDuration = 2 * minutes;
const intro = overrideBrightness(
    createMultiProgram(
        [
          {
            program : programsByShape({
              vertices : [ CA, {colorMap : "_bw"} ],
            }),
            duration : 1 * minutes,
          },
          {
            program : programsByShape({
              all : [
                animateParamProgram(
                    VertexGlow, "scale", 1,
                    animateAdaptor(linearFade(0.1, 0, 100, 1 * minutes))),
                {pow : 30},
              ],
            }),
            duration : 1 * minutes,
          },
        ],
        false, 15 * seconds),
    linearFade(0, 0, .2, introDuration / 2));

const rampUpDuration = 3 * minutes;
const rampUp = overrideBrightness(
    createMultiProgram(
        [
          {
            program : programsByShape({
              all : [
                animateParamProgram(
                    Polar, "width", 1,
                    animateAdaptor(linearFade(5, 0, 120, 1 * minutes))),
                {
                  fadeWidth : 60,
                  angleXSpeed : 2,
                  angleYSpeed : 2.3,
                  angleZ : 270,
                },
              ],
            }),
            duration : 1 * minutes,
          },
          {
            program : ColorSpear,
            duration : .4 * minutes,
          },
          {
            program : Rays,
            duration : .4 * minutes,
          },
          {
            program : programsByShape({
              joya : [ Radial3D, {
                escala: 20,
                velocidad: -1.2,
                centerY: 40,
                power: 3.8,
                colorMap: "saga-01",
              } ],
              mate: Stars,
            }),
            duration : .4 * minutes,
          },
          {
            program : programsByShape({
              mate: Noise,
              joya: Stars,
            }),
            duration : .4 * minutes,
          },
          {
            program : programsByShape({
              all : [ Radial3D, {
                escala: 5,
                velocidad: -10,
                centerY: 40,
                power: 3.8,
                colorMap: "tas03",
              } ],
            }),
            duration : .4 * minutes,
          },
        ],
        false, 30 * seconds),
    linearFade(.2, rampUpDuration / 3, .5, 2 * rampUpDuration / 3));
const interlude = Shapes;
const peak = Shapes;
const interlude2 = interlude;
const peak2 = peak;
const calesita = Shapes;
const rampDown = Rays;

module.exports = createMultiProgram(
    [
      {
        program : intro,
        duration : 2 * minutes,
      },
      {
        program : rampUp,
        duration : 3 * minutes,
      },
      {
        program : interlude,
        duration : 3 * minutes,
      },
      {
        program : peak,
        duration : 3 * minutes,
      },
      {
        program : interlude2,
        duration : 2 * minutes,
      },
      {
        program : peak2,
        duration : 4 * minutes,
      },
      {
        program : calesita,
        duration : 1 * minutes,
      },
      {
        program : rampDown,
        duration : 2 * minutes,
      },
    ],
    false, 10 * seconds);
