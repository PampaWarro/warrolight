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
const MusicPsycho = require("./mixMusicPsycho").Func;
const Fire = require("./fire").Func;
const SpeedingSpear = require("./speeding-spear").Func;

// las formas que se pueden usar están definidas en Transformation
const seg = 1000;
const schedule = [
  {duration: 2*60*seg, program: programsByShape({trianguloBottom: [animateParamProgram(VolumeDot, 'numberOfOnLeds', 60*8, n => Math.min(40, n+1)), {multiplier: 1, numberOfOnLeds: 1}]})},
  {duration: 60*seg, program: programsByShape({trianguloBottom: [Stars, Stars.presets().pocasSlow]})},
  {duration: 60*seg, program: programsByShape({trianguloBottom: [Stars, Stars.presets().pocasFast]})},
  {duration: 60*seg, program: programsByShape({trianguloBottom: [SpeedingSpear, {speed: 1, colorVariety: 1, spearLength: 3}]})},
  {duration: 3*60*seg, program: programsByShape({trianguloBottom: [MusicFlow, MusicFlow.presets().slowDoble]})},
  {duration: 30*seg, program: programsByShape({trianguloBottom: Fire})},
  {duration: 3*60*seg, program: programsByShape({trianguloBottom: animateParamProgram(Radial, 'escala', 1, s => (s+0.01)%15)})},
  {duration: 100*seg, program: programsByShape({trianguloBottom: animateParamProgram(Radial, 'escala', 1, s => (s+0.01)%15)})},
  {duration: 10*3600*seg, program: createMultiProgram([
    {duration: 1*60*seg, program: programsByShape({trianguloBottom: animateParamProgram(Radial, 'escala', 1, s => (s+0.01)%15)})},
    {duration: 1*60*seg, program: programsByShape({trianguloBottom: animateParamProgram(MusicFlow, 'speed', 60*30, s => Math.ceil(Math.random()*10))})},
    {duration: 30*seg, program: programsByShape({trianguloBottomShuffle: animateParamProgram(MusicFlow, 'speed', 60*30, s => Math.ceil(Math.random()*10))})},
  ], true)}
]

export const Func = createMultiProgram(schedule)