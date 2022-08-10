const _ = require("lodash");

const DynamicMask = require("../programs/dynamicMask");
const programsByShape = require("../base-programs/ProgramsByShape");
const {getPresetsByProgram, getProgramClass} = require("../../presets.js");

function getFilteredPresets(fileName, filter) {
  const presets = [];
  for (const [program, programPresets] of Object.entries(
           getPresetsByProgram(fileName))) {
    for (const [name, config] of Object.entries(programPresets)) {
      if (!filter || filter(program, name, config)) {
        presets.push({
          presetName : name,
          programName : program,
          programClass : getProgramClass(program),
          config : config
        });
      }
    }
  }
  return presets;
}

function presetToByShapeSpec({programClass, config}) {
  return [ programClass, config ];
}

function randomSchedule(filter, baseDuration, randomDuration) {
  const presets = getFilteredPresets('joyamatehd', filter);
  const masks = getFilteredPresets('joyamatehd', (program, name, config) => {
    if (filter && !filter(program, name, config)) {
      return false;
    }
    if (program === 'shapes' && name === 'rotor') {
      return true;
    }
    if (program === 'polar' && name.startsWith('joyamate')) {
      return true;
    }
    if (program === 'randomshapes') {
      return true;
    }
    return false;
  });
  return function() {
    const byShapeSpec = {};
    if (Math.random() < .8) {  // 80% of the time it's all.
      if (Math.random() < .5) { // Fill all with a single preset.
        byShapeSpec.all = presetToByShapeSpec(_.sample(presets));
      } else { // Or two presets using dynamic mask.
        byShapeSpec.all = [
          DynamicMask, {
            mask : _.sample(masks),
            positive : _.sample(presets),
            negative : _.sample(presets)
          }
        ];
      }
    } else { // Rest of the time it's joya/mate by shape.
      const randomVal = Math.random();
      // 1/3 joya only, 1/3 mate only, 1/3 joya/mate.
      if (randomVal < 2 / 3) {
        let preset = presetToByShapeSpec(_.sample(presets));
        while (preset[1].tags.includes('shape-specific')) {
          preset = presetToByShapeSpec(_.sample(presets));
        }
        byShapeSpec.joya = preset;
      }
      if (randomVal >= 1 / 3) {
        let preset = presetToByShapeSpec(_.sample(presets));
        while (preset[1].tags.includes('shape-specific')) {
          preset = presetToByShapeSpec(_.sample(presets));
        }
        byShapeSpec.mate = preset;
      }
    }
    return {
      duration : baseDuration + Math.random() * randomDuration,
      program : programsByShape(byShapeSpec),
    };
  }
}

module.exports = {
  randomSchedule,
};
