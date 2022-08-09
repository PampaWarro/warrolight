const _ = require("lodash");
const programsByShape = require("./light-programs/base-programs/ProgramsByShape");
const { glob } = require("glob");
const path = require("path");

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

function getPresetsByProgram(presetFileName) {
  return require(`../setups/program-presets/${presetFileName}`);
}

function getProgramClass(programName) {
  return require(`./light-programs/programs/${programName}.js`);
}

// Get a multiProgram schedule entry for each preset defined in the given file.
function getFilePresets(presetFileName, duration = 30) {
  const presetsByProgram = getPresetsByProgram(presetFileName);
  const presets = [];
  _.each(presetsByProgram, (presetsByName, programName) => {
    const ProgramClass = getProgramClass(programName);

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

function loadAllPresetFiles() {
  const files = glob.sync(path.join(__dirname, "../setups/program-presets", "*.json"));
  const allPresets = {};
  files.forEach(file => {
    allPresets[path.basename(file)] = require(file);
  });
  return allPresets;
}

module.exports = {
  getAllPresets,
  getFilePresets,
  loadAllPresetFiles,
  getPresetsByProgram,
  getProgramClass,
};
