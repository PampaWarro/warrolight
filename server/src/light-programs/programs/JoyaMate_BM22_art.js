const _ = require("lodash");
const {randomSchedule} = require("../joyamate-utils/preset");
const overrideBrightness = require("../base-programs/OverrideBrightness");
const createMultiProgram = require("../base-programs/MultiPrograms");
const animateParamProgram = require("../base-programs/AnimatePrograms");
const programsByShape = require("../base-programs/ProgramsByShape");

const AllWhite = require("./all-white");
const CA = require("./ca");
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
const baseDuration = 30 * seconds;
const randomDuration = 5 * seconds;

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
const intro =
    overrideBrightness(
        createMultiProgram(
            [
              {
                program : programsByShape({
                  vertices :
                      [ CA, {scale : 1, randomness : .02, colorMap : "_bw"} ],
                }),
                duration : 1 * minutes,
              },
              {
                program :
                    programsByShape({
                      all : [
                        animateParamProgram(
                            animateParamProgram(VertexGlow, "scale", 1,
                                                animateAdaptor(linearFade(
                                                    0.1, 0, .7, 1 * minutes))),
                            "rippleStrength", 1,
                            animateAdaptor(linearFade(0, 0, 1, 1 * minutes))),
                        {enableSound : false},
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
            false, 15 * seconds),
        linearFade(.2, rampUpDuration / 3, .7, 2 * rampUpDuration / 3));

const interludeDuration = 3 * minutes;

const interlude = overrideBrightness(
    createMultiProgram(
        randomSchedule((program, presetName, config) =>
                           config.tags &&
                           config.tags.includes('music-optional') &&
                           (config.tags.includes('intensity-low') ||
                            config.tags.includes('intensity-mid')),
                       baseDuration, randomDuration),
        false, 7 * seconds),
    .5);

const peakDuration = 3 * minutes;
const peak = createMultiProgram(
    randomSchedule((program, presetName, config) =>
                       config.tags && config.tags.includes('music-optional') &&
                       config.tags.includes('intensity-high'),
                   baseDuration, randomDuration),
    false, 5 * seconds);

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
