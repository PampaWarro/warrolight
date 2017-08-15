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
const AliveDotsSpeed = require("./aliveDotsSpeed");

const baseTime = 0.1*1000;

function getAllPresets(funcClass, time){
  return _.map(funcClass.presets(), preset => {
    return {duration: time * baseTime, program: programsByShape({Warro: [funcClass, preset]})}
  })
}

const schedule = [

  ... getAllPresets(SoundWaves, 60),
  {duration: 60*baseTime, program: programsByShape({Warro: [animateParamProgram(SoundWaves, 'centerX', 120, x => -x), {centerX: -20, speed: 0.5}]})},


  ... getAllPresets(WaterFlood, 60),


  ... getAllPresets(AliveDots, 30),
  {duration: 30 * baseTime, program: programsByShape({V1: [AliveDots, AliveDots.presets().constanteLentoUnidirecional], V2: [AliveDots, AliveDots.presets().constanteLentoUnidirecional]})},
  {duration: 60 * baseTime, program: programsByShape({Warro: [animateParamProgram(AliveDots, 'toneColor', 1, s => (s+0.005)%1), AliveDots.presets().musicMediaSlow]})},


  {
    duration: 30*baseTime,
    program: programsByShape({
      Warro: animateParamProgram(animateParamProgram(Radial, 'escala', 1, s => Math.max((s*1.01)%15, 0.5), 'power',60*30, p => Math.max(1, Math.random()*40)))
    })
  },
  {duration: 30*baseTime, program: programsByShape({Warro: [Radial, {centerY: 17.3, velocidad: 10, power: 15}]})},
  {duration: 15*baseTime, program: programsByShape({Warro: [Radial, {power: 20, escala: 10, velocidad: 10, centerX: -30, centerY: 17.3}]})},
  {duration: 15*baseTime, program: programsByShape({Warro: [Radial, {power: 20, escala: 10, velocidad: 10}]})},
  {duration: 30*baseTime, program: programsByShape({Warro: [Radial, {power: 20, escala: 1, velocidad: 10}]})},
  {duration: 30*baseTime, program: programsByShape({reloj: [Radial, {power: 15, escala: 5, centerX: -15, centerY: 17.3}]})},
  {duration: 30*baseTime, program: programsByShape({X: Radial})},
  {duration: 30*baseTime, program: programsByShape({trianguloTop: Radial})},
  {duration: 30*baseTime, program: animateParamProgram(Radial, 'velocidad', 1, s => (s+0.01)%15)},


  {duration: 60 * baseTime, program: programsByShape({reloj: [animateParamProgram(AliveDotsSpeed, 'toneColor', 1, s => (s+0.005)%1), AliveDots.presets().normal]})},
  {duration: 30 * baseTime, program: programsByShape({Warro: [animateParamProgram(Stars, 'starsColor', 1, s => (s+0.005)%1), Stars.presets().pocasSlow]})},
  {duration: 60 * baseTime, program: programsByShape({trianguloTop: [animateParamProgram(AliveDots, 'toneColor', 1, s => (s+0.005)%1), AliveDots.presets().musicMediaSlow]})},
  {duration: 30*baseTime, program: createMultiProgram([
    {duration: 10000, program: programsByShape({"shuffleSegments10": [MusicFlow, MusicFlow.presets().mediumDoble]})},
    {duration: 10000, program: programsByShape({"shuffleSegments20": [MusicFlow, MusicFlow.presets().mediumDoble]})}
  ])},


  {duration: 30*baseTime, program: programsByShape({Warro: [animateParamProgram(VolumeDot, 'numberOfOnLeds', 5, n => (n+1) % 50), {multiplier: 3, numberOfOnLeds: 1}]})},
  {duration: 30*baseTime, program: programsByShape({Warro: [animateParamProgram(VolumeDot, 'numberOfOnLeds', 15, n => Math.ceil(Math.random()*50))]})},


  {duration: 30*baseTime, program: programsByShape({trianguloTop: [SpeedingSpear, {spearLength: 10}]})},


  {duration: 30*baseTime, program: programsByShape({V1L: VolumeBars, V2R: VolumeBars, trianguloTopRight: VolumeBars, trianguloTopLeft: VolumeBars, trianguloBottomLeft: VolumeBars, trianguloBottomRight: VolumeBars})},
  {duration: 30*baseTime, program: programsByShape({V1L: VolumeBars, V1R: VolumeBars, V2L: VolumeBars, V2R: VolumeBars})},


  {duration: 30*baseTime, program: programsByShape({Warro: [SpeedingSpear, {speed: 10, colorVariety: 1, spearLength: 3}]})},


  {duration: 30*baseTime, program: programsByShape({reloj: [ColorSpear, {spearLength: 15, speed: 8}]})},
  {duration: 30*baseTime, program: programsByShape({Warro: [ColorSpear, {speed: 4, colorVariety: 1, spearLength: 6}]})},


  {duration: 90*baseTime, program: createMultiProgram([
    {duration: 500, program: programsByShape({"trianguloTop": MusicFlow})},
    {duration: 500, program: programsByShape({"X": MusicFlow})},
    {duration: 500, program: programsByShape({"V1": MusicFlow})},
    {duration: 500, program: programsByShape({"V2": MusicFlow})},
    {duration: 500, program: programsByShape({"V1R": MusicFlow})},
    {duration: 500, program: programsByShape({"V1L": MusicFlow})},
    {duration: 500, program: programsByShape({"V2R": MusicFlow})},
    {duration: 500, program: programsByShape({"V2L": MusicFlow})},
  ], true)},
  {duration: 30*baseTime, program: programsByShape({Warro: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]})},
  {duration: 30*baseTime, program: programsByShape({reloj: MusicFlow})},
  {duration: 30*baseTime, program: programsByShape({V1: MusicFlow, V2: [MusicFlow, {haciaAfuera: false}]})},
  {duration: 30*baseTime, program: programsByShape({V1: MusicFlow, V2: MusicFlow})},
  {duration: 30*baseTime, program: programsByShape({Warro: MusicFlow})},
  {duration: 30*baseTime, program: programsByShape({Warro: [MusicFlow, MusicFlow.presets().fastDobleDesdePuntas]})},


  {duration: 15*baseTime, program: programsByShape({Warro: [Rainbow, Rainbow.presets().fastMarks]})},
  {duration: 30*baseTime, program: programsByShape({Warro: [Rainbow, Rainbow.presets().purpleDots]})},


  // {duration: 30*baseTime, program: Hourglass},

  {duration: 30 * baseTime, program: programsByShape({Warro: [Stars, Stars.presets().slowBlue]})},
  {duration: 30*baseTime, program: programsByShape({Warro: [Stars, Stars.presets().pocasMoving]})},
  {duration: 30 * baseTime, program: programsByShape({Warro: [Stars, Stars.presets().muchasSlow]})},
  {duration: 20*baseTime, program: programsByShape({Warro: [Stars, Stars.presets().pocasSlow]})},
  {duration: 30 * baseTime, program: programsByShape({Warro: [Stars, Stars.presets().pocasFast]})},

  // {duration: 10*baseTime, program: programsByShape({Warro: Fire})},
]
// las formas que se pueden usar están definidas en Transformation


module.exports = createMultiProgram(schedule, false)