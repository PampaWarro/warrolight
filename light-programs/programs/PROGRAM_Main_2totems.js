// import {Func} from "./rainbow";
const _ = require('lodash')
const createMultiProgram = require("../base-programs/MultiPrograms");
const animateParamProgram = require("../base-programs/AnimatePrograms");
const programsByShape = require("../base-programs/Transformations");

const Rainbow = require("./../../light-programs/programs/rainbow");
const Radial = require("./radial");
const Stars = require("./stars")
const VolumeDot = require("./musicVolumeDot");
const VolumeBars = require("./musicVolumeBars");
const MusicFlow = require("./musicFlow");
// const Fire = require("./fire").Func;
const SpeedingSpear = require("./speeding-spear");
const ColorSpear = require("./color-spear");
// const Hourglass = require("./rainbow-hourglass").Func;
const AliveDots = require("./aliveDots");
const SoundWaves = require("./../../light-programs/programs/sound-waves");
const WaterFlood = require("./water-flood");
const Rays = require("./rays");
const AliveDotsSpeed = require("./aliveDotsSpeed");

const baseTime = 1*0.5*1000;

function getAllPresets(funcClass, time, shape = 'allOfIt'){
  return _.map(funcClass.presets(), preset => {
    return {duration: time * baseTime, program: programsByShape({[shape]: [funcClass, preset]})}
  })
}


function sineScale(s) {
  return (Math.sin(this.timeInMs / 1000) + 1) * 8 + 0.5;
}

let flowDefault = [MusicFlow, MusicFlow.presets().default]

const schedule = [
  {duration: 60 * baseTime, program: createMultiProgram([
    {duration: 500 , program: programsByShape({wingsLeft: [Rainbow, Rainbow.presets().purpleDots]})},
    {duration: 500 , program: programsByShape({wingsRight: [Rainbow, Rainbow.presets().purpleDots]})},
  ], true, 0)},

  {duration: 60 * baseTime, program: programsByShape({wingsLeft: flowDefault, wingsRight: flowDefault})},

  {duration: 30 * baseTime, program: programsByShape({Warro: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]})},
  {duration: 30 * baseTime, program: programsByShape({Warro: MusicFlow})},
  {duration: 30 * baseTime, program: programsByShape({wingsLeft: MusicFlow, wingsRight: [MusicFlow, {haciaAfuera: false}]})},
  {duration: 30 * baseTime, program: programsByShape({wingsLeft: MusicFlow, wingsRight: MusicFlow})},
  {duration: 30 * baseTime, program: programsByShape({Warro: MusicFlow})},
  {duration: 30 * baseTime, program: programsByShape({Warro: [MusicFlow, MusicFlow.presets().fastDobleDesdePuntas]})},


  ... getAllPresets(SoundWaves, 60, 'allOfIt'),
  {
    duration: 60 * baseTime,
    program: programsByShape({
      allOfIt: [animateParamProgram(SoundWaves, 'centerX', 120, x => -x), {
        centerX: -20,
        speed: 0.5
      }]
    })
  },

  {
    duration: 30*baseTime,
    program: programsByShape({
      Warro: animateParamProgram(animateParamProgram(Radial, 'escala', 1, sineScale, 'power', 60 * 30, p => Math.max(1, Math.random() * 40)))
    })
  }, {
    duration: 30 * baseTime,
    program: programsByShape({
      Warro: animateParamProgram(animateParamProgram(Radial, 'escala', 1, s => Math.max((s * 1.01) % 15, 0.5), 'power', 60 * 30, p => Math.max(1, Math.random() * 40)))
    })
  },
  {duration: 30 * baseTime, program: programsByShape({Warro: [Radial, {centerY: 17.3, velocidad: 10, power: 15}]})},
  {
    duration: 15 * baseTime,
    program: programsByShape({Warro: [Radial, {power: 20, escala: 10, velocidad: 10, centerX: -30, centerY: 17.3}]})
  },
  {duration: 15 * baseTime, program: programsByShape({Warro: [Radial, {power: 20, escala: 10, velocidad: 10}]})},
  {duration: 30 * baseTime, program: programsByShape({Warro: [Radial, {power: 20, escala: 1, velocidad: 10}]})},
  {
    duration: 30 * baseTime,
    program: programsByShape({Warro: [Radial, {power: 15, escala: 5, centerX: -15, centerY: 17.3}]})
  },
  {duration: 30 * baseTime, program: animateParamProgram(Radial, 'velocidad', 1, s => (s + 0.01) % 15)},

  {
    duration: 60 * baseTime,
    program: programsByShape({Warro: [animateParamProgram(Rays, 'colorHueOffset', 60, x => x + 0.01), Rays.presets().fireFast]})
  },
  ... getAllPresets(Rays, 60),



  ... getAllPresets(WaterFlood, 60, 'allOfIt'),


  ... getAllPresets(AliveDots, 30),
  {
    duration: 30 * baseTime,
    program: programsByShape({
      wingsLeft: [AliveDots, AliveDots.presets().constanteLentoUnidirecional],
      wingsRight: [AliveDots, AliveDots.presets().constanteLentoUnidirecional]
    })
  },
  {
    duration: 60 * baseTime,
    program: programsByShape({Warro: [animateParamProgram(AliveDots, 'toneColor', 1, s => (s + 0.005) % 1), AliveDots.presets().musicMediaSlow]})
  },


  {
    duration: 60 * baseTime,
    program: programsByShape({Warro: [animateParamProgram(AliveDotsSpeed, 'toneColor', 1, s => (s + 0.005) % 1), AliveDots.presets().normal]})
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({Warro: [animateParamProgram(Stars, 'starsColor', 1, s => (s + 0.005) % 1), Stars.presets().pocasSlow]})
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      Warro: [animateParamProgram(VolumeDot, 'numberOfOnLeds', 5, n => (n + 1) % 100), {
        multiplier: 3,
        numberOfOnLeds: 1
      }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({Warro: [animateParamProgram(VolumeDot, 'numberOfOnLeds', 30, n => Math.ceil(Math.random() * 100))]})
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      wingsLeft: VolumeBars,
      wingsRight: VolumeBars,
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({wingsLeft: VolumeBars, wingsLeft: VolumeBars, wingsRight: VolumeBars, wingsRight: VolumeBars})
  },


  {
    duration: 30 * baseTime,
    program: programsByShape({Warro: [SpeedingSpear, {speed: 10, colorVariety: 1, spearLength: 3}]})
  },


  {duration: 30 * baseTime, program: programsByShape({Warro: [ColorSpear, {spearLength: 15, speed: 8}]})},
  {
    duration: 30 * baseTime,
    program: programsByShape({Warro: [ColorSpear, {speed: 4, colorVariety: 1, spearLength: 6}]})
  },

  {duration: 15 * baseTime, program: programsByShape({Warro: [Rainbow, Rainbow.presets().fastMarks]})},
  {duration: 30 * baseTime, program: programsByShape({Warro: [Rainbow, Rainbow.presets().purpleDots]})},

  // {duration: 30*baseTime, program: Hourglass},

  ... getAllPresets(Stars, 30),
]

// las formas que se pueden usar están definidas en Transformation


module.exports = createMultiProgram(schedule, true)