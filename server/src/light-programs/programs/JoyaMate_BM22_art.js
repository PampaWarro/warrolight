const _ = require("lodash");
const {getPresetsByProgram, getProgramClass} = require("../../presets.js");
const overrideBrightness = require("../base-programs/OverrideBrightness");
const createMultiProgram = require("../base-programs/MultiPrograms");
const animateParamProgram = require("../base-programs/AnimatePrograms");
const programsByShape = require("../base-programs/ProgramsByShape");

const AllWhite = require("./all-white");
const CA = require("./ca");
const DynamicMask = require("./dynamicMask");
const ColorSpear = require("./color-spear");
const Noise = require("./noise");
const Polar = require("./polar");
const Radial3D = require("./radial3d");
const Rays = require("./rays");
const Stars = require("./stars");
const VertexGlow = require("./vertexGlow");

const timeScale = 1; // RESET to 1 before commet.
const seconds = (1 / timeScale) * 1000;
const minutes = 60 * seconds;

function linearFade(start, startMs, end, endMs) {
  const fadeDuration = endMs - startMs;
  return function({timeInMs}) {
    const timeSinceStart = timeInMs - this.startTimeInMs;
    const alpha = _.clamp((timeSinceStart - startMs) / fadeDuration, 0, 1);
    const result = (1 - alpha) * start + alpha * end;
    return result;
  };
}

function breathBrightness(bpm) {
  const period = 60 * 1000 / bpm;
  return function({timeInMs}) {
    const timeSinceStart = timeInMs - this.startTimeInMs;
    const t = (timeSinceStart % period) / period;
    if (t < .5) { // Breathing in.
      const x = 2 * t;
      return Math.pow(x, 2);
    } else { // Breathing out.
      const x = 2 * (t - .5);
      return Math.pow(1 - x, 6);
    }
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
              vertices : [ CA, {randomness : .02, colorMap : "_bw"} ],
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
    linearFade(0, .05, .2, introDuration / 2));

const rampUpDuration = 3 * minutes;
const rampUp =
    overrideBrightness(
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
                  joya : [
                    Radial3D, {
                      escala : 20,
                      velocidad : -1.2,
                      centerY : 40,
                      power : 3.8,
                      colorMap : "saga-01",
                    }
                  ],
                  mate : Stars,
                }),
                duration : .4 * minutes,
              },
              {
                program : programsByShape({
                  mate : Noise,
                  joya : Stars,
                }),
                duration : .4 * minutes,
              },
              {
                program : programsByShape({
                  all : [
                    Radial3D, {
                      escala : 5,
                      velocidad : -10,
                      centerY : 40,
                      power : 3.8,
                      colorMap : "tas03",
                    }
                  ],
                }),
                duration : .4 * minutes,
              },
            ],
            false, 30 * seconds),
        linearFade(.2, rampUpDuration / 3, .7, 2 * rampUpDuration / 3));

const interludeDuration = 3 * minutes;
function getFilteredPresets(fileName, filter) {
  const presets = [];
  for (const [program, programPresets] of Object.entries(
           getPresetsByProgram(fileName))) {
    for (const [name, config] of Object.entries(programPresets)) {
      if (filter(program, name, config)) {
        presets.push({
          presetName : name,
          programName : program,
          programClass : getProgramClass(program),
          config : config
        });
      }
    }
  }
  return presets;
}

function presetToByShapeSpec({programClass, config}) {
  return [ programClass, config ];
}

function randomScheduleWithFilter(filter) {
  const presets = getFilteredPresets('joyamatehd', filter);
  const masks = getFilteredPresets('joyamatehd', (program, name, config) => {
    if (!filter(program, name, config)) {
      return false;
    }
    if (program === 'shapes' && name === 'rotor') {
      return true;
    }
    if (program === 'polar' && name.startsWith('joyamate')) {
      return true;
    }
    if (program === 'randomshapes') {
      return true;
    }
    return false;
  });
  return function() {
    const byShapeSpec = {};
    if (Math.random() < .75) {  // 75% of the time it's all.
      if (Math.random() < .5) { // Fill all with a single preset.
        byShapeSpec.all = presetToByShapeSpec(_.sample(presets));
      } else { // Or two presets using dynamic mask.
        byShapeSpec.all = [
          DynamicMask, {
            mask : _.sample(masks),
            positive : _.sample(presets),
            negative : _.sample(presets)
          }
        ];
      }
    } else { // Rest of the time it's joya/mate by shape.
      const randomVal = Math.random();
      // 1/3 joya only, 1/3 mate only, 1/3 joya/mate.
      if (randomVal < 2 / 3) {
        let preset = presetToByShapeSpec(_.sample(presets));
        while (preset[1].tags.includes('shape-specific')) {
          preset = presetToByShapeSpec(_.sample(presets));
        }
        byShapeSpec.joya = preset;
      }
      if (randomVal >= 1 / 3) {
        let preset = presetToByShapeSpec(_.sample(presets));
        while (preset[1].tags.includes('shape-specific')) {
          preset = presetToByShapeSpec(_.sample(presets));
        }
        byShapeSpec.mate = preset;
      }
    }
    return {
      duration : 30 * seconds + Math.random() * 5 * seconds,
      program : programsByShape(byShapeSpec),
    };
  }
}

const interlude = overrideBrightness(
    createMultiProgram(
        randomScheduleWithFilter((program, presetName, config) =>
                                     config.tags &&
                                     config.tags.includes('music-optional') &&
                                     (config.tags.includes('intensity-low') ||
                                      config.tags.includes('intensity-mid'))),
        false, 10 * seconds),
    .5);

const peakDuration = 3 * minutes;
const peak = createMultiProgram(
    randomScheduleWithFilter((program, presetName, config) =>
                                 config.tags &&
                                 config.tags.includes('music-optional') &&
                                 config.tags.includes('intensity-high')),
    false, 10 * seconds);

const interlude2Duration = 2 * minutes;
const interlude2 = interlude;

const peak2Duration = 4 * minutes;
const peak2 = peak;

const calesitaDuration = 1 * minutes;
const calesita = overrideBrightness(
    programsByShape({
      joya : [
        animateParamProgram(
            Polar, "angleYSpeed", 1,
            animateAdaptor(linearFade(0, 0, 250, calesitaDuration * 1.3))),
        {fadeWidth : 45}
      ],
      mate : [
        animateParamProgram(
            Polar, "angleYSpeed", 1,
            animateAdaptor(linearFade(0, 0, -250, calesitaDuration * 1.3))),
        {angleY : 180, fadeWidth : 45}
      ],
    }),
    linearFade(.5, 0, 1, calesitaDuration));

const rampDownDuration = 2 * minutes;
const rampDown =
    overrideBrightness(overrideBrightness(AllWhite, breathBrightness(8)),
                       linearFade(1, 0, 0, rampDownDuration));

module.exports = createMultiProgram(
    [
      {
        program : intro,
        duration : introDuration,
      },
      {
        program : rampUp,
        duration : rampUpDuration,
      },
      {
        program : interlude,
        duration : interludeDuration,
      },
      {
        program : peak,
        duration : peakDuration,
      },
      {
        program : interlude2,
        duration : interlude2Duration,
      },
      {
        program : peak2,
        duration : peak2Duration,
      },
      {
        program : calesita,
        duration : calesitaDuration,
      },
      {
        program : rampDown,
        duration : rampDownDuration,
      },
    ],
    false, 10 * seconds);
