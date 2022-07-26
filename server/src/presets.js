const _ = require("lodash");
const programsByShape = require("./light-programs/base-programs/ProgramsByShape");

// Get a multiProgram schedule entry for each class-defined preset in the given
// class.
function getAllPresets(funcClass, duration, shape = "all") {
  return _.map(funcClass.presets(), (preset, name) => {
    return {
      duration: duration,
      program: programsByShape({ [shape]: [funcClass, preset] }, name),
    };
  });
}

// Get a multiProgram schedule entry for each preset defined in the given file.
function getFilePresets(presetFileName, duration = 30) {
  const presetsByProgram = require(`../setups/program-presets/${presetFileName}`);
  const presets = [];
  _.each(presetsByProgram, (presetsByName, programName) => {
    const ProgramClass = require(`./light-programs/programs/${programName}.js`);

    _.each(presetsByName, (config, name) => {
      presets.push({
        duration: duration,
        program: programsByShape({ all: [ProgramClass, config] }, name),
      });
      console.log(
        `Loaded preset ${programName.green} ${name.yellow} from ${presetFileName}`
      );
    });
  });
  return presets;
}

module.exports = {
  getAllPresets,
  getFilePresets,
};
