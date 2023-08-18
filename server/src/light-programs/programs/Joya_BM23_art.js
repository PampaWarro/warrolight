const createMultiProgram = require("../base-programs/MultiPrograms");
const createNowPlayingTrackProgram = require("../base-programs/NowPlayingTrackProgram");
const createNowPlayingPositionProgram = require("../base-programs/NowPlayingPositionProgram");
const overrideBrightness = require("../base-programs/OverrideBrightness");
const programsByShape = require("../base-programs/ProgramsByShape");
const { randomSchedule, getPreset } = require("../joya-utils/preset");

const VertexGlow = require("./vertexGlow")
const CA = require("./ca")

const timeScale = 1; // RESET to 1 before commit.
const seconds = (1 / timeScale) * 1000;
const minutes = 60 * seconds;
const baseDuration = 30 * seconds;
const randomDuration = 5 * seconds;

function trackFadeInOut({ fadeInSeconds, fadeOutSeconds, power }) {
  power |= 1;
  return function ({ nowPlaying }) {
    if (!nowPlaying.length) {
      return 1;
    }
    const secondsSinceStart = nowPlaying.time;
    const secondsUntilEnd = nowPlaying.length - nowPlaying.time;
    let brightness = 1;
    if (secondsSinceStart < fadeInSeconds) {
      brightness = Math.min(brightness, secondsSinceStart / fadeInSeconds);
    }
    if (secondsUntilEnd < fadeOutSeconds) {
      brightness = Math.min(brightness, secondsUntilEnd / fadeOutSeconds);
    }
    return Math.pow(brightness, power);;
  };
}

const fallback = createMultiProgram(
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
  false, 7 * seconds);


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
  trackFadeInOut({
    fadeInSeconds: 15,
    fadeOutSeconds: 15,
    power: 2,
  })
);

const aurora = createNowPlayingPositionProgram([
  {
    end: 166,
    fadeIn: 45,
    fadeOut: 60,
    program: programsByShape({
      all: getPreset('joyahdtotems', 'mix', 'mid-moving-stars'),
    }),
  },
  {
    start: 75,
    fadeIn: 10,
    fadeOut: 10,
    program: programsByShape({
      all: getPreset('joyahdtotems', 'mix', 'totem-mid-dots'),
    }),
  },
  {
    start: 117,
    end: 166,
    fadeIn: 10,
    fadeOut: 10,
    program: programsByShape({
      all: getPreset('joyahdtotems', 'mix', 'flow-lineal'),
    }),
  },
  {
    start: 165,
    fadeIn: 10,
    fadeOut: 10,
    program: programsByShape({
      all: getPreset('joyahdtotems', 'mix', 'MovingBastonpejos'),
    }),
  },
]);

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
  "Los Arboles - (SidiRum REMIX)": arboles,
  "Lujo Asiatico": lujo,
  "SidiRum - Nidos": nidos,
  "": fallback,
});
