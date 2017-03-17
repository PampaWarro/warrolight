// import {Func} from "./rainbow";
const _ = require('lodash')
import {createMultiProgram} from "./MultiPrograms";
import {animateParamProgram} from "./AnimatePrograms";
import {programsByShape} from "./Transformations";

const Rainbow = require("./rainbow").Func;
const RainbowHourglass = require("./rainbow-hourglass").Func;
const Radial = require("./radial").Func;
const Stars = require("./stars").Func;
const VolumeDot = require("./musicVolumeDot").Func;
const VolumeBars = require("./musicVolumeBars").Func;
const MusicFlow = require("./musicFlow").Func;
const MusicFrequency = require("./musicFreqs").Func;
const Fire = require("./fire").Func;
const SpeedingSpear = require("./speeding-spear").Func;
const ColorSpear = require("./color-spear").Func;
const AliveDots = require("./aliveDots").Func;
const baseTime = 1*1*1000;

// las formas que se pueden usar están definidas en Transformation
const seg = 1000;
const schedule = [
    {duration: 3*60*seg, program: programsByShape({trianguloBottom: [animateParamProgram(Stars, 'brillo', 10, brillo => Math.min(1, brillo+0.001)), {decay: 0.97, probability: 0.0003, brillo: 0}]})},
    {duration: 24*60*60*seg, program: createMultiProgram([
        {duration: 1*seg, program: programsByShape({trianguloBottomLeft: VolumeBars, trianguloBottomRight: VolumeBars})},
        {duration: 2*60*seg*60*24, program: createMultiProgram([
          {duration: 0.3*seg, program: programsByShape({trianguloBottomLeft: Rainbow})},
          {duration: 0.3*seg, program: programsByShape({trianguloBottomRight: Rainbow})},
          {duration: 0.3*seg, program: programsByShape({trianguloBottomBottom: Rainbow})},
        ], false)},
        {duration: 2*60*seg, program: programsByShape({trianguloBottom: [animateParamProgram(VolumeDot, 'numberOfOnLeds', 30, n => Math.min(40, Math.random()*37+3)), {multiplier: 2}]})},
        {duration: 60*seg, program: programsByShape({trianguloBottom: Rainbow})},
        {duration: 60 * seg, program: programsByShape({trianguloBottom: [AliveDots, AliveDots.presets().constanteLento]})},
        {duration: 60 * seg, program: programsByShape({trianguloBottom: [AliveDots, AliveDots.presets().constanteRapidoPocas]})},
        {duration: 3*60*seg, program: programsByShape({trianguloBottom: [MusicFlow, MusicFlow.presets().slowDoble]})},
        {duration: 60*seg, program: programsByShape({trianguloBottom: [Stars, Stars.presets().pocasMoving]})},
        {duration: 60*seg, program: programsByShape({trianguloBottom: [SpeedingSpear, {speed: 1, colorVariety: 1, spearLength: 3}]})},
        {duration: 60*seg, program: programsByShape({trianguloBottom: [Stars, Stars.presets().pocasFast]})},
        {duration: 60*seg, program: programsByShape({trianguloBottom: [Stars, Stars.presets().pocasSlow]})},
        {duration: 60*seg, program: programsByShape({trianguloBottom: [ColorSpear, ColorSpear.presets().fastMarks]})},
        {duration: 1*60*seg, program: programsByShape({trianguloBottom: animateParamProgram(Radial, 'escala', 1, s => (s+0.01)%15)})},
        {duration: 1*60*seg, program: programsByShape({trianguloBottom: animateParamProgram(MusicFlow, 'speed', 60*30, s => Math.ceil(Math.random()*5))})},
        {duration: 30*seg, program: programsByShape({trianguloBottomShuffle: animateParamProgram(MusicFlow, 'speed', 60*30, s => Math.ceil(Math.random()*3))})},
      ], true)
    }
]

export const Func = createMultiProgram(schedule, false)