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
const Hourglass = require("./rainbow-hourglass").Func;
const MixMusicW = require("./mixMusicW").Func;
const AliveDots = require("./aliveDots").Func;
const AliveDotsSpeed = require("./aliveDotsSpeed").Func;
const baseTime = 1*1000;

let flowMulti = MusicFlow

const schedule = [
  {duration: 60 * baseTime, program: programsByShape({reloj: [animateParamProgram(AliveDotsSpeed, 'toneColor', 1, s => (s+0.005)%1), AliveDots.presets().normal]})},
  {duration: 60 * baseTime, program: programsByShape({Warro: [animateParamProgram(AliveDots, 'toneColor', 1, s => (s+0.005)%1), AliveDots.presets().musicMediaSlow]})},
  {duration: 30 * baseTime, program: programsByShape({allOfIt: [Stars, Stars.presets().slowBlue]})},
  {duration: 30 * baseTime, program: programsByShape({Warro: [animateParamProgram(Stars, 'starsColor', 1, s => (s+0.005)%1), Stars.presets().pocasSlow]})},
  {duration: 60 * baseTime, program: programsByShape({trianguloTop: [animateParamProgram(AliveDots, 'toneColor', 1, s => (s+0.005)%1), AliveDots.presets().musicMediaSlow]})},
  {duration: 30*baseTime, program: createMultiProgram([
    {duration: 10000, program: programsByShape({"shuffleSegments10": [MusicFlow, MusicFlow.presets().mediumDoble]})},
    {duration: 10000, program: programsByShape({"shuffleSegments20": [MusicFlow, MusicFlow.presets().mediumDoble]})}
  ])},
  {duration: 30 * baseTime, program: programsByShape({Warro: [AliveDots, AliveDots.presets().constanteLento]})},
  {duration: 30 * baseTime, program: programsByShape({Warro: [AliveDots, AliveDots.presets().constanteRapidoPocas]})},
  {duration: 30 * baseTime, program: programsByShape({V1: [AliveDots, AliveDots.presets().constanteLentoUnidirecional], V2: [AliveDots, AliveDots.presets().constanteLentoUnidirecional]})},
  {duration: 30 * baseTime, program: programsByShape({Warro: [AliveDots, AliveDots.presets().musicModerado]})},
  {duration: 30 * baseTime, program: programsByShape({Warro: [AliveDots, AliveDots.presets().musicQuilombo]})},

  {duration: 15*baseTime, program: programsByShape({Warro: [Radial, {power: 20, escala: 10, velocidad: 10, centerX: -30, centerY: 17}]})},
  {duration: 15*baseTime, program: programsByShape({Warro: [Radial, {power: 20, escala: 10, velocidad: 10}]})},
  {duration: 30*baseTime, program: programsByShape({Warro: [animateParamProgram(VolumeDot, 'numberOfOnLeds', 5, n => (n+1) % 150), {multiplier: 3, numberOfOnLeds: 1}]})},
  {duration: 30*baseTime, program: programsByShape({Warro: [Radial, {power: 20, escala: 1, velocidad: 10}]})},
  {duration: 30*baseTime, program: programsByShape({trianguloTop: [SpeedingSpear, {spearLength: 10}]})},
  {duration: 30*baseTime, program: programsByShape({V1L: VolumeBars, V2R: VolumeBars, trianguloTopRight: VolumeBars, trianguloTopLeft: VolumeBars, trianguloBottomLeft: VolumeBars, trianguloBottomRight: VolumeBars})},
  {duration: 30*baseTime, program: programsByShape({Warro: [SpeedingSpear, {speed: 10, colorVariety: 1, spearLength: 3}]})},
  {duration: 30*baseTime, program: programsByShape({reloj: [Radial, {power: 15, escala: 5, centerX: -15, centerY: 17}]})},
  {duration: 30*baseTime, program: programsByShape({reloj: [ColorSpear, {spearLength: 50, speed: 8}]})},
  {duration: 90*baseTime, program: createMultiProgram([
    {duration: 500, program: programsByShape({"trianguloTop": flowMulti})},
    {duration: 500, program: programsByShape({"trianguloBottom": flowMulti})},
    {duration: 500, program: programsByShape({"V1": flowMulti})},
    {duration: 500, program: programsByShape({"V2": flowMulti})},
    {duration: 500, program: programsByShape({"V1R": flowMulti})},
    {duration: 500, program: programsByShape({"V1L": flowMulti})},
    {duration: 500, program: programsByShape({"V2R": flowMulti})},
    {duration: 500, program: programsByShape({"V2L": flowMulti})},
  ], true)},
  {duration: 30*baseTime, program: programsByShape({Warro: [Rainbow, Rainbow.presets().fastMarks]})},
  {duration: 30*baseTime, program: programsByShape({Warro: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]})},
  {duration: 30*baseTime, program: MixMusicW},
  {
    duration: 30*baseTime,
    program: programsByShape({
      Warro: animateParamProgram(animateParamProgram(Radial, 'escala', 1, s => (s+0.01)%15), 'power',60*30, p => Math.max(1, Math.random()*40))
    })
  },
  {duration: 30*baseTime, program: programsByShape({allOfIt: [Radial, {centerY: 17, velocidad: 10, power: 15}]})},
  {duration: 30*baseTime, program: programsByShape({Warro: [Stars, Stars.presets().pocasMoving]})},
  {duration: 30*baseTime, program: programsByShape({V1L: VolumeBars, V1R: VolumeBars, V2L: VolumeBars, V2R: VolumeBars})},
  {duration: 30*baseTime, program: Hourglass},
  {duration: 30*baseTime, program: programsByShape({reloj: MusicFlow})},
  {duration: 30*baseTime, program: programsByShape({V1: MusicFlow, V2: [MusicFlow, {haciaAfuera: false}]})},
  {duration: 30*baseTime, program: programsByShape({V1: MusicFlow, V2: MusicFlow})},
  {duration: 30*baseTime, program: programsByShape({allOfIt: [animateParamProgram(VolumeDot, 'numberOfOnLeds', 60, n => Math.ceil(Math.random()*150))]})},
  {duration: 30 * baseTime, program: programsByShape({Warro: [Stars, Stars.presets().muchasSlow]})},
  {duration: 20*baseTime, program: programsByShape({allOfIt: [Stars, Stars.presets().pocasSlow]})},
  {duration: 30 * baseTime, program: programsByShape({Warro: [Stars, Stars.presets().pocasFast]})},
  {duration: 30*baseTime, program: programsByShape({Warro: [ColorSpear, {speed: 4, colorVariety: 1, spearLength: 6}]})},
  {duration: 30*baseTime, program: programsByShape({Warro: MusicFlow})},
  {duration: 30*baseTime, program: programsByShape({Warro: [MusicFlow, MusicFlow.presets().fastDobleDesdePuntas]})},

  {duration: 30*baseTime, program: programsByShape({trianguloBottom: Radial})},
  {duration: 30*baseTime, program: programsByShape({trianguloTop: Radial})},

  {duration: 10*baseTime, program: programsByShape({allOfIt: [MusicFrequency, MusicFlow.presets().slowDoble]})},
  {duration: 10*baseTime, program: programsByShape({Warro: Fire})},
  {
    duration: 30*baseTime,
    program: animateParamProgram(Radial, 'velocidad', 1, s => (s+0.01)%15)
  },
  // {duration: 1000, program: programsByShape({trianguloBottom: [Rainbow, Rainbow.presets().fastMarks]})},
]
// las formas que se pueden usar están definidas en Transformation


export const Func = createMultiProgram(schedule, true)