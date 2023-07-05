const createMultiProgram = require("../base-programs/MultiPrograms");
const createNowPlayingTrackProgram = require("../base-programs/NowPlayingTrackProgram");
const overrideBrightness = require("../base-programs/OverrideBrightness");
const { randomSchedule } = require("../joya-utils/preset");

const timeScale = 1; // RESET to 1 before commit.
const seconds = (1 / timeScale) * 1000;
const minutes = 60 * seconds;
const baseDuration = 30 * seconds;
const randomDuration = 5 * seconds;

const fallback = overrideBrightness(
  createMultiProgram(
    randomSchedule({
      presetsFile: 'joyahdtotems',
      mainShapes: ['joya', 'totems'],
      filter: (program, presetName, config) =>
        config.tags &&
        config.tags.includes('music-optional') &&
        (config.tags.includes('intensity-low') ||
          config.tags.includes('intensity-mid')),
      baseDuration,
      randomDuration,
    }),
    false, 7 * seconds),
  .5);

const placeholder = overrideBrightness(
  createMultiProgram(
    randomSchedule({
      presetsFile: 'joyahdtotems',
      mainShapes: ['joya', 'totems'],
      filter: (program, presetName, config) => true,
      baseDuration,
      randomDuration,
    }),
    false, 7 * seconds),
  .5);

const aurora = placeholder;
const hello = placeholder;
const key = placeholder;
const geminis = placeholder;
const costa = placeholder;
const baconhead = placeholder;
const carbon = placeholder;
const bahia = placeholder;
const antes = placeholder;
const savane = placeholder;
const luz = placeholder;
const memorias = placeholder;
const arboles = placeholder;
const lujo = placeholder;
const nidos = placeholder;


module.exports = createNowPlayingTrackProgram({
  "Las Olas - Aurora": aurora,
  "Hello World": hello,
  "SidiRum - Key": key,
  "Chasys - Geminis": geminis,
  "SidiRum - Costa Sureña": costa,
  "Nicola Cruz x Donso (Baconhead": baconhead,
  "Aedrian - Carbon": carbon,
  "BRxSR - Bahía": bahia,
  "BRxSR - antes de": antes,
  "Ali Farka Toure - Savane": savane,
  "Las Olas - Luz": luz,
  "Las Olas Ft. Pedro Alvide - Memorias": memorias,
  "Los Arboles - (SidiRum REMIX).wav": arboles,
  "Lujo Asiatico": lujo,
  "SidiRum - Nidos": nidos,
  "": fallback,
});