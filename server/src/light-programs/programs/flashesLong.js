const _ = require("lodash");
const createMultiProgram = require("../base-programs/MultiPrograms");

const BombsTap = require("./bombsTap");
const Lineal = require("./lineal");
const Noise = require("./noise");
const Radial = require("./radial");
const Radial3D = require("./radial3d");
const Rainbow = require("./rainbow");
const VertexGlow = require("./vertexGlow");
const WarroBass = require("./warroBass");
const WaveForm = require('./waveform');
const DJTap = require('./DJTap.js');
const BassWarpGrid = require('./bassWarpGrid.js');
const FrequencyActivation = require('./frequencyActivation.js');

const baseTime = 1 * 100 * 3;

const schedule = [
  { duration: 30 * baseTime, program: Lineal },
  { duration: 30 * baseTime, program: Noise },
  { duration: 30 * baseTime, program: Radial },
  { duration: 30 * baseTime, program: Radial3D },
  { duration: 30 * baseTime, program: Rainbow },
  { duration: 30 * baseTime, program: VertexGlow },
  { duration: 30 * baseTime, program: WarroBass },
  { duration: 30 * baseTime, program: WaveForm },
  { duration: 30 * baseTime, program: BassWarpGrid },
  { duration: 30 * baseTime, program: FrequencyActivation },
];

module.exports = createMultiProgram(schedule, true, 1000);
