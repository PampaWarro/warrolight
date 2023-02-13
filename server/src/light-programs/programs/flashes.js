const _ = require("lodash");
const createMultiProgram = require("../base-programs/MultiPrograms");

const AllWhite = require("./all-white");
const BombsTap = require("./bombsTap");
const Lineal = require("./lineal");
const Noise = require("./noise");
const Radial = require("./radial");
const Radial3D = require("./radial3d");
const RadialSun = require("./radialSun");
const Rainbow = require("./rainbow");
const VertexGlow = require("./vertexGlow");
const WarroBass = require("./warroBass");
const WaveForm = require('./waveform');

// TODO: AJUSTAR ANTES  DE COMITEAR!!!
// const baseTime = 1 * 1000 * 1;
 const baseTime = 1 * 100 * 1;

const schedule = [
//   { duration: 60 * baseTime, program: AllWhite },
  { duration: 30 * baseTime, program: BombsTap },
  { duration: 30 * baseTime, program: Lineal },
  { duration: 30 * baseTime, program: Noise },
  { duration: 30 * baseTime, program: Radial },
  { duration: 30 * baseTime, program: Radial3D },
  { duration: 30 * baseTime, program: RadialSun },
  { duration: 30 * baseTime, program: Rainbow },
  { duration: 30 * baseTime, program: VertexGlow },
  { duration: 30 * baseTime, program: WarroBass },
  { duration: 30 * baseTime, program: WaveForm },
//   { duration: 30 * baseTime, program:  },
];

module.exports = createMultiProgram(schedule, true, 2000);
