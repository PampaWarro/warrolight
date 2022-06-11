const _ = require("lodash");
const createMultiProgram = require("../base-programs/MultiPrograms");
const animateParamProgram = require("../base-programs/AnimatePrograms");
const programsByShape = require("../base-programs/ProgramsByShape");

const Bombs = require("./bombs");
const Circles = require("./circles");
const Rainbow = require("./../../light-programs/programs/rainbow");
const Radial = require("./radial");
const Stars = require("./stars");
const VolumeDot = require("./musicVolumeDot");
const MusicFlow = require("./musicFlow");
const MusicFlash = require("./musicFlash");
const Waveform = require("./waveform");
// const Fire = require("./fire").Func;
const SpeedingSpear = require("./speeding-spear");
const ColorSpear = require("./color-spear");
// const Hourglass = require("./rainbow-hourglass").Func;
const AliveDots = require("./aliveDots");
const SoundWaves = require("./../../light-programs/programs/sound-waves");
const WaterFlood = require("./water-flood");
const Rays = require("./rays");
const AliveDotsSpeed = require("./aliveDotsSpeed");

const baseTime = 0.1 * 1000;

function getAllPresets(
  funcClass,
  time,
  shape = "base",
  configOverride = {}
) {
  return _.map(funcClass.presets(), preset => {
    return {
      duration: time * baseTime,
      program: programsByShape({
        [shape]: [funcClass, _.extend(preset, configOverride)]
      })
    };
  });
}

function sineScale(s) {
  return (Math.sin(this.timeInMs / 1000) + 1) * 8 + 0.5;
}

const schedule = [
  ...getAllPresets(Rays, 60, "base", {
    numberOfParticles: 6
  }),

  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
    })
  },

  ...getAllPresets(SoundWaves, 60, "base"),
  {
    duration: 60 * baseTime,
    program: programsByShape({
      base: [
        animateParamProgram(SoundWaves, "centerX", 120, x => -x),
        {
          centerX: -20,
          speed: 0.5
        }
      ]
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: animateParamProgram(
        animateParamProgram(
          Radial,
          "escala",
          1,
          sineScale,
          "power",
          60 * 30,
          p => Math.max(1, Math.random() * 40)
        )
      )
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: animateParamProgram(
        animateParamProgram(
          Radial,
          "escala",
          1,
          s => Math.max((s * 1.01) % 15, 0.5),
          "power",
          60 * 30,
          p => Math.max(1, Math.random() * 40)
        )
      )
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: [Radial, { centerY: 17.3, velocidad: 10, power: 15 }]
    })
  },
  {
    duration: 15 * baseTime,
    program: programsByShape({
      base: [
        Radial,
        { power: 20, escala: 10, velocidad: 10, centerX: -30, centerY: 17.3 }
      ]
    })
  },
  {
    duration: 15 * baseTime,
    program: programsByShape({
      base: [Radial, { power: 20, escala: 10, velocidad: 10 }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: [Radial, { power: 20, escala: 1, velocidad: 10 }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: [
        Radial,
        { power: 15, escala: 5, centerX: -15, centerY: 17.3 }
      ]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({ base: Radial })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({ bottom: Radial })
  },

  {
    duration: 60 * baseTime,
    program: programsByShape({
      base: [
        animateParamProgram(Rays, "colorHueOffset", 60, x => x + 0.01),
        Rays.presets().fireFast
      ]
    })
  },

  ...getAllPresets(WaterFlood, 60, "base"),

  ...getAllPresets(AliveDots, 30),

  {
    duration: 60 * baseTime,
    program: programsByShape({
      base: [
        animateParamProgram(AliveDots, "toneColor", 1, s => (s + 0.005) % 1),
        AliveDots.presets().musicMediaSlow
      ]
    })
  },

  {
    duration: 60 * baseTime,
    program: programsByShape({
      base: [
        animateParamProgram(
          AliveDotsSpeed,
          "toneColor",
          1,
          s => (s + 0.005) % 1
        ),
        AliveDots.presets().normal
      ]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: [
        animateParamProgram(Stars, "starsColor", 1, s => (s + 0.005) % 1),
        Stars.presets().pocasSlow
      ]
    })
  },
  {
    duration: 60 * baseTime,
    program: programsByShape({
      base: [
        animateParamProgram(AliveDots, "toneColor", 1, s => (s + 0.005) % 1),
        AliveDots.presets().musicMediaSlow
      ]
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: [
        animateParamProgram(VolumeDot, "numberOfOnLeds", 5, n => (n + 1) % 100),
        {
          multiplier: 3,
          numberOfOnLeds: 1
        }
      ]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: [
        animateParamProgram(VolumeDot, "numberOfOnLeds", 30, n =>
          Math.ceil(Math.random() * 100)
        )
      ]
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: [SpeedingSpear, { spearLength: 10 }]
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: [
        SpeedingSpear,
        { speed: 10, colorVariety: 1, spearLength: 3 }
      ]
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: [ColorSpear, { spearLength: 15, speed: 8 }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: [
        ColorSpear,
        { speed: 4, colorVariety: 1, spearLength: 6 }
      ]
    })
  },

  {
    duration: 15 * baseTime,
    program: programsByShape({
      base: [Rainbow, Rainbow.presets().fastMarks]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      base: [Rainbow, Rainbow.presets().purpleDots]
    })
  },

  // {duration: 30*baseTime, program: Hourglass},

  ...getAllPresets(Stars, 30)
];

// las formas que se pueden usar están definidas en Transformation

module.exports = programsByShape({
  allOfIt: createMultiProgram(schedule, true),
  tip: [MusicFlash, {cutThreshold: 0}],
  leftTip: [Circles, {escala: 4}],
  rightTip: [Circles, {escala: 4}],
});
