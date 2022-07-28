const { loadAllPresetFiles } = require("./presets.js");
const fs = require("fs");

const allPresets = loadAllPresetFiles();
const merged = {};
Object.entries(allPresets).forEach(([file, presets]) => {
  console.log(`Processing ${file}`);
  Object.entries(presets).forEach(([program, programPresets]) => {
    console.log(`Program ${program}`);
    if (!(program in merged)) {
      merged[program] = {};
    }
    const mergedProgram = merged[program];
    Object.entries(programPresets).forEach(([name, preset]) => {
      console.log(`Preset ${name}`);
      let duplicateCount = 0;
      let uniqueName = name;
      while (uniqueName in mergedProgram) {
        uniqueName = `${name}_${++duplicateCount}`;
      }
      if (uniqueName !== name) {
        console.log(`Deduped name to ${uniqueName}`);
      }
      mergedProgram[uniqueName] = preset;
    });
  });
});

fs.writeFileSync("merged.json", JSON.stringify(merged));
