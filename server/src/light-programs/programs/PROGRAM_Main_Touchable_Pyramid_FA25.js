const _ = require("lodash");
const {getFilePresets} = require("../../presets.js");
const createMultiProgram = require("../base-programs/MultiPrograms");


// TODO: AJUSTAR ANTES  DE COMITEAR!!!
const baseTime = 1 * 1000;

function sineScale(s) {
    return (Math.sin(this.timeInMs / 1000) + 1) * 8 + 0.5;
}

const schedule = [
    ...getFilePresets('pyramid.json', 60 * baseTime),
];


// const schedule2 = [
//   ...getFilePresets('default.json', 60 * baseTime),
// ]
// las formas que se pueden usar están definidas en Transformation

module.exports = createMultiProgram(schedule, true, 15000, true);
