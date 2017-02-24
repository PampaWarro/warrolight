// import {Func} from "./rainbow";
const _ = require('lodash')
import {createMultiProgram} from "./MultiPrograms";
import {animateParamProgram} from "./AnimatePrograms";
import {programsByShape} from "./Transformations";

const Rainbow = require("./rainbow").Func;
const Radial = require("./radial").Func;
const Stars = require("./stars").Func;
const VolumeDot = require("./musicVolumeDot").Func;
const MusicFlow = require("./musicFlow").Func;
const MusicFrequency = require("./musicFreqs").Func;
const Fire = require("./fire").Func;
const SpeedingSpear = require("./speeding-spear").Func;
const ColorSpear = require("./color-spear").Func;

const baseTime = 1000;
const schedule = [
  {
    duration: 30*baseTime,
    program: programsByShape({
      Warro: animateParamProgram(Radial, 'escala', 1, s => (s+0.01)%15)
    })
  },
  {
    duration: 10*baseTime,
    program: programsByShape({
      Warro: [Stars, Stars.presets().muchasSlow]
    })
  },
  {
    duration: 10*baseTime,
    program: programsByShape({
      allOfIt: [Stars, Stars.presets().pocasFast]
    })
  },
  {duration: 30*baseTime, program: programsByShape({
    allOfIt: [animateParamProgram(VolumeDot, 'numberOfOnLeds', 60, n => Math.min(40, n+1)), {multiplier: 3, numberOfOnLeds: 1}]})},
  {duration: 10*baseTime, program: programsByShape({allOfIt: [Stars, Stars.presets().pocasSlow]})},
  {duration: 20*baseTime, program: programsByShape({allOfIt: [SpeedingSpear, {speed: 1, colorVariety: 1, spearLength: 3}]})},
  {duration: 20*baseTime, program: programsByShape({allOfIt: [ColorSpear, {speed: 1, colorVariety: 1, spearLength: 3}]})},
  {duration: 30*baseTime, program: programsByShape({allOfIt: MusicFlow})},
  {duration: 30*baseTime, program: programsByShape({allOfIt: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]})},
  {duration: 30*baseTime, program: programsByShape({allOfIt: [MusicFlow, MusicFlow.presets().fastDobleDesdePuntas]})},

  {duration: 30*baseTime, program: programsByShape({reloj: Radial})},
  {duration: 30*baseTime, program: programsByShape({trianguloBottom: Radial})},
  {duration: 30*baseTime, program: programsByShape({trianguloTop: Radial})},

  {duration: 10*baseTime, program: programsByShape({allOfIt: [MusicFrequency, MusicFlow.presets().slowDoble]})},
  {duration: 10*baseTime, program: programsByShape({allOfIt: Fire})},
  {
    duration: 30*baseTime,
    program: animateParamProgram(Radial, 'velocidad', 1, s => (s+0.01)%15)
  },
  // {duration: 1000, program: programsByShape({trianguloBottom: [Rainbow, Rainbow.presets().fastMarks]})},
]
// las formas que se pueden usar están definidas en Transformation


export const Func = createMultiProgram(schedule, true)