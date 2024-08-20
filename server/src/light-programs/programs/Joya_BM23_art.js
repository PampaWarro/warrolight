const createMultiProgram = require("../base-programs/MultiPrograms");
const createNowPlayingTrackProgram = require("../base-programs/NowPlayingTrackProgram");
const createNowPlayingPositionProgram = require("../base-programs/NowPlayingPositionProgram");
const overrideBrightness = require("../base-programs/OverrideBrightness");
const programsByShape = require("../base-programs/ProgramsByShape");
const { randomSchedule, getPreset } = require("../joya-utils/preset");
const makeOverrideColorProgram = require("../base-programs/OverrideColor");

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

const s = t => {
  let [,min, sec] = t.match(/(\d+):(\d+)/);
  return parseInt(min)*60+parseInt(sec);
}

const memorias = createNowPlayingPositionProgram([
  {
    start: s("00:05"), end: s("01:20"), fadeIn: 30, fadeOut: 10,
    program: programsByShape({all: getPreset('joyahdtotems', 'mix', 'JoyaTorchesStars'),}, 'JoyaTorchesStars'),
  },
  {
    start: s("00:45"), end: s("02:50"), fadeIn: 10, fadeOut: 10,
    program: programsByShape({all: getPreset('joyahdtotems', 'sound-waves', 'JoyaBottomLento'),}, 'JoyaBottomLento'),
  },
  {
    start: s("01:15"), end: s("02:50"), fadeIn: 10, fadeOut: 10,
    program: programsByShape({all: getPreset('joyahdtotems', 'sound-waves', 'JoyaTopLento'),}, 'JoyaTopLento'),
  },
  {
    start: s("01:45"), end: s("02:10"), fadeIn: 4, fadeOut: 2,
    program: programsByShape({all: getPreset('joyahdtotems', 'mix', 'JoyaPolarColor'),}, 'JoyaPolarColor'),
  },
  // {
  //   start: s("01:50"), end: s("02:50"), fadeIn: 2, fadeOut: 2,
  //   program: programsByShape({all: getPreset('joyahdtotems', 'mix', 'JoyaMidFlash'),}, 'JoyaMidFlash'),
  // },
  {
    start: s("02:15"), end: s("02:50"), fadeIn: 2, fadeOut: 2,
    program: programsByShape({all: getPreset('joyahdtotems', 'mix', 'FireDotsExplosion'),}, 'FireDotsExplosion'),
  },
  {
    start: s("02:45"), end: s("04:00"), fadeIn: 5, fadeOut: 30,
    program: programsByShape({all: getPreset('joyahdtotems', 'mix', 'JoyaTriexplosions'),}, 'JoyaTriexplosions'),
  },
  {
    start: s("03:26"), end: s("04:20"), fadeIn: 15, fadeOut: 10,
    program: programsByShape({all: getPreset('joyahdtotems', 'sound-waves', 'JoyaDesdePunta'),}, 'JoyaDesdePunta'),
  },
  {
    start: s("04:10"), end: s("04:26"), fadeIn: 12, fadeOut: 4,
    program: programsByShape({joya: getPreset('joyahdtotems', 'rays', 'fireFastSound'),}, 'fireFastSound'),
  },
  {
    start: s("04:24"), end: s("05:00"), fadeIn: 2, fadeOut: 2,
    program: programsByShape({all: getPreset('joyahdtotems', 'musicVolumeDotRandom', 'JoyaSensitive'),}, 'JoyaSensitive'),
  },
  {
    start: s("04:55"), end: s("05:25"), fadeIn: 2, fadeOut: 10, // JoyaBassExplosions
    program: programsByShape({all: getPreset('joyahdtotems', 'musicExplosions', 'RandomColorPunches'),}, 'JoyaBassExplosions'),
  },
  {
    start: s("05:20"), end: s("05:49"), fadeIn: 15,  fadeOut: 15,
    // program: programsByShape({all: getPreset('joyahdtotems', 'stars', 'JoyaFewStars'),}, 'JoyaFewStars'),
    program: programsByShape({all: getPreset('joyahdtotems', 'bandParticles', 'sensitive'),}, 'sensitive'),
  },
  {
    start: s("05:20"), fadeIn: 15,
    // program: programsByShape({all: getPreset('joyahdtotems', 'stars', 'JoyaFewStars'),}, 'JoyaFewStars'),
    program: programsByShape({all: getPreset('joyahdtotems', 'mix', 'JoyaPuntitaAzul'),}, 'sensitive'),
  },
]);

const luz = createNowPlayingPositionProgram([
  { // intro solo mid
    start: s("00:00"), end: s("01:00"), fadeIn: 10, fadeOut: 10,
    program: programsByShape({all: getPreset('joyahdtotems', 'mix', 'JoyaIntroLuz'),}, 'JoyaIntroLuz'),
  },
  { // Aparece Beat
    start: s("00:50"), end: s("01:35"), fadeIn: 10, fadeOut: 1,
    program: programsByShape({all: getPreset('joyahdtotems', 'mix', 'JoyaPinkXRay'),}, 'JoyaBottomLento'),
  },
  { // Se va el beat
    start: s("1:35"), end: s("02:23"), fadeIn: 1, fadeOut: 10,
    program: programsByShape({all: getPreset('joyahdtotems', 'sound-waves', 'JoyaBottomLento'),}, 'JoyaBottomLento'),
  },
  { // Aparece Beat
    start: s("02:20"), end: s("03:25"), fadeIn: 3, fadeOut: 3,
    program: programsByShape({all: getPreset('joyahdtotems', 'mix', 'JoyaRelampeja'),}, 'JoyaBottomLento'),
  },
  { // Aparece Beat
    start: s("03:30"), fadeIn: 1, fadeOut: 20,
    program: programsByShape({all: getPreset('joyahdtotems', 'mix', 'JoyaPinkBlueExplosions'),}, 'JoyaBottomLento'),
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
const arboles = placeholder;
const lujo = placeholder;
const nidos = placeholder;

module.exports = makeOverrideColorProgram(createNowPlayingTrackProgram({
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
}));
