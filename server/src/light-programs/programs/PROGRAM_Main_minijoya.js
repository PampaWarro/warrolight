const _ = require("lodash");
const createMultiProgram = require("../base-programs/MultiPrograms");
const animateParamProgram = require("../base-programs/AnimatePrograms");
const programsByShape = require("../base-programs/ProgramsByShape");
const mixPrograms = require("../base-programs/MixProgram");

const Rainbow = require("./../../light-programs/programs/rainbow");
const Radial = require("./radial");
const Lineal = require("./lineal");
const RadialSun = require("./radialSun");
const Stars = require("./stars");
const VolumeDot = require("./musicVolumeDot");
const VolumeDotRandom = require("./musicVolumeDotRandom");
const VolumeBars = require("./musicVolumeBars");
const MusicFlow = require("./musicFlow");
// const Fire = require("./fire").Func;
const SpeedingSpear = require("./speeding-spear");
const ColorSpear = require("./color-spear");
const AliveDots = require("./aliveDots");
const SoundWaves = require("./../../light-programs/programs/sound-waves");
const WaterFlood = require("./water-flood");
const Rays = require("./rays");
const AliveDotsSpeed = require("./aliveDotsSpeed");
const BassWarpGrid = require("./bassWarpGrid");
const Bombs = require("./bombs");
const Shapes = require("./shapes");
const Mix = require("./mix");

const MusicFrequencyDot = require("./musicFrequencyDot");
const BandParticles = require("./bandParticles");
const StripePatterns = require("./stripe-patterns");
const FrequencyActivation = require("./frequencyActivation");
const Circles = require("./circles");

// TODO: AJUSTAR ANTES  DE COMITEAR!!!
const baseTime = 1 * 1000 * 1;

function getAllPresets(funcClass, time, shape = "all") {
  return _.map(funcClass.presets(), (preset, name) => {
    return {
      duration: time * baseTime,
      program: programsByShape({ [shape]: [funcClass, preset] }, name)
    };
  });
}

function getFilePresets(presetFileName, duration = 30) {
  const presetsByProgram = require(`../../../setups/program-presets/${presetFileName}`);
  const presets = [];
  _.each(presetsByProgram, (presetsByName, programName) => {
    const ProgramClass = require(`./${programName}.js`);

    _.each(presetsByName, (config, name) => {
      presets.push({duration: duration * baseTime, program: programsByShape({all: [ProgramClass, config]}, name)});
      console.log(`Loaded preset ${programName.green} ${name.yellow} from ${presetFileName}`)
    })
  })
  return presets;
}

function sineScale(s) {
  return (Math.sin(this.timeInMs / 1000) + 1) * 8 + 0.5;
}

let flowDefault = [MusicFlow, MusicFlow.presets().default];

let radialSunByBand = programsByShape({
  top: [
    RadialSun,
    { soundMetric: "highFastPeakDecay", saturation: 1, centerY: -2, escala: .1 }
  ],
  bottomNoBase: [
    RadialSun,
    {
      soundMetric: "midFastPeakDecay",
      saturation: 0.95,
      escala: .2,
      power: 3,
      centerY: -2
    }
  ],
  base: [
    RadialSun,
    { soundMetric: "bassFastPeakDecay", saturation: 0.8, centerY: 11, power: 5, escala: .1 }
  ]
});

let volumeDotsRandomByBand = count =>
  programsByShape({
    top: [
      VolumeDotRandom,
      { soundMetric: "highFastPeakDecay", numberOfOnLeds: count }
    ],
    bottomNoBase: [
      VolumeDotRandom,
      { soundMetric: "midFastPeakDecay", numberOfOnLeds: count }
    ],
    base: [
      VolumeDotRandom,
      { soundMetric: "bassFastPeakDecay", numberOfOnLeds: count * 2 }
    ]
  });

let volumeDotByBand = count =>
  programsByShape({
    top: [
      VolumeDot,
      { soundMetric: "highFastPeakDecay", numberOfOnLeds: count }
    ],
    bottomNoBase: [
      VolumeDot,
      { soundMetric: "midFastPeakDecay", numberOfOnLeds: count }
    ],
    base: [
      VolumeDot,
      { soundMetric: "bassFastPeakDecay", numberOfOnLeds: count * 2 }
    ]
  });

let rainbowIteratingShapes = createMultiProgram(
  [
    {
      duration: 500,
      program: programsByShape({
        top: [Rainbow, Rainbow.presets().purpleDots]
      })
    },
    {
      duration: 500,
      program: programsByShape({
        bottom: [Rainbow, Rainbow.presets().purpleDots]
      })
    },
    {
      duration: 500,
      program: programsByShape({
        topLeft: [Rainbow, Rainbow.presets().purpleDots]
      })
    },
    {
      duration: 500,
      program: programsByShape({
        topRight: [Rainbow, Rainbow.presets().purpleDots]
      })
    },
    {
      duration: 500,
      program: programsByShape({
        base: [Rainbow, Rainbow.presets().purpleDots]
      })
    }
  ],
  true,
  0
);

let radialSunArribaAbajo = mixPrograms(
  [
    RadialSun,
    {
      ...RadialSun.presets().fromBottom,
      soundMetric: "bassPeakDecay",
      power: 2,
      escala: 1
    }
  ],
  [
    RadialSun,
    {
      ...RadialSun.presets().fromTop,
      soundMetric: "highPeakDecay",
      power: 2,
      escala: 1.5
    }
  ]
);

let starsSunrise = mixPrograms(
  [Stars, Stars.presets().pocasSlow],
  [
    RadialSun,
    {
      ...RadialSun.presets().fromBottom,
      soundMetric: "bassPeakDecay",
      power: 2,
      escala: 1.7,
      saturation: 0.5
    }
  ]
);

const schedule = [
  ...getAllPresets(Mix, 60),

  ...getFilePresets('minijoya.json', 60),


  ...getAllPresets(Rays, 60),

  ...getAllPresets(Circles, 30, "allOfIt"),

  ...getAllPresets(StripePatterns, 30, "allOfIt"),

  ...getAllPresets(MusicFrequencyDot, 30, "allOfIt"),


  { duration: 60 * baseTime, program: BandParticles },
  { duration: 60 * baseTime, program: BandParticles },
  { duration: 60 * baseTime, program: BandParticles },

  { duration: 30 * baseTime, program: starsSunrise },

  { duration: 30 * baseTime, program: radialSunArribaAbajo },

  ...getAllPresets(Shapes, 60, "allOfIt"),

  ...getAllPresets(Bombs, 60, "allOfIt"),

  ...getAllPresets(BassWarpGrid, 60, "allOfIt"),

  ...getAllPresets(RadialSun, 30, "allOfIt"),
  { duration: 60 * baseTime, program: radialSunByBand },

  { duration: 60 * baseTime, program: volumeDotsRandomByBand(3) },
  { duration: 60 * baseTime, program: volumeDotsRandomByBand(10) },

  { duration: 60 * baseTime, program: rainbowIteratingShapes },

  {
    duration: 60 * baseTime,
    program: programsByShape({
      topLeft: flowDefault,
      bottomLeftNoBase: flowDefault,
      topRight: flowDefault,
      bottomRightNoBase: flowDefault,
      base: flowDefault,
    })
  },
  {
    duration: 30 * baseTime,
    program: createMultiProgram(
      [
        {
          duration: 10000,
          program: programsByShape({
            shuffleSegments10: [MusicFlow, MusicFlow.presets().mediumDoble]
          })
        },
        {
          duration: 10000,
          program: programsByShape({
            shuffleSegments20: [
              MusicFlow,
              MusicFlow.presets().fastDobleDesdeCentro
            ]
          })
        }
      ],
      true
    )
  },
  {
    duration: 90 * baseTime,
    program: createMultiProgram(
      [
        {
          duration: 500,
          program: programsByShape({
            top: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            base: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            bottomLeftNoBase: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            bottomRightNoBase: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            tip: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            bottom: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            left: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            right: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            topLeft: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            bottomLeftNoBase: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            topRight: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            bottomRightNoBase: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        }
      ],
      true,
      10000
    )
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      all: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
    })
  },
  { duration: 30 * baseTime, program: programsByShape({ top: MusicFlow }) },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      left: MusicFlow,
      right: [MusicFlow, { haciaAfuera: false }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({ left: MusicFlow, right: MusicFlow })
  },
  { duration: 30 * baseTime, program: programsByShape({ all: MusicFlow }) },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      all: [MusicFlow, MusicFlow.presets().fastDobleDesdePuntas]
    })
  },
  ...getAllPresets(SoundWaves, 60, "allOfIt"),
  {
    duration: 60 * baseTime,
    program: programsByShape({
      allOfIt: [
        animateParamProgram(SoundWaves, "centerX", 120, x => -x),
        {
          waveCenterX: -20,
          speed: 0.5
        }
      ]
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      all: animateParamProgram(
        animateParamProgram(
          Radial,
          "escala",
          1,
          sineScale,
          "power",
          60 * 30,
          p => Math.max(1, Math.random() * 40)
        )
      )
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      all: animateParamProgram(
        animateParamProgram(
          Radial,
          "escala",
          1,
          s => Math.max((s * 1.01) % 15, 0.5),
          "power",
          60 * 30,
          p => Math.max(1, Math.random() * 40)
        )
      )
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      all: [Radial, { centerY: 17.3, velocidad: 10, power: 15 }]
    })
  },
  {
    duration: 15 * baseTime,
    program: programsByShape({
      all: [
        Radial,
        { power: 20, escala: 10, velocidad: 10, centerX: -30, centerY: 17.3 }
      ]
    })
  },
  {
    duration: 15 * baseTime,
    program: programsByShape({
      bottomNoBase: [Radial, { power: 20, escala: 10, velocidad: 10 }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      all: [Radial, { power: 20, escala: 1, velocidad: 10 }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      top: [Radial, { power: 15, escala: 5, centerX: -15, centerY: 17.3 }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({ top: Radial, bottomLeft: Radial, bottomRight: Radial })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({ top: Radial, bottomNoBase: Radial })
  },
  {
    duration: 30 * baseTime,
    program: animateParamProgram(Radial, "velocidad", 1, s => (s + 0.01) % 15)
  },

  {
    duration: 60 * baseTime,
    program: programsByShape({
      all: [
        animateParamProgram(Rays, "colorHueOffset", 60, x => x + 0.01),
        Rays.presets().fireFast
      ]
    })
  },

  ...getAllPresets(Lineal, 30),

  ...getAllPresets(WaterFlood, 40, "allOfIt"),

  ...getAllPresets(AliveDots, 30),
  {
    duration: 30 * baseTime,
    program: programsByShape({
      left: [AliveDots, AliveDots.presets().constanteLentoUnidirecional],
      right: [AliveDots, AliveDots.presets().constanteLentoUnidirecional]
    })
  },
  {
    duration: 60 * baseTime,
    program: programsByShape({
      all: [
        animateParamProgram(AliveDots, "toneColor", 1, s => (s + 0.005) % 1),
        AliveDots.presets().musicMediaSlow
      ]
    })
  },

  {
    duration: 60 * baseTime,
    program: programsByShape({
      top: [
        animateParamProgram(
          AliveDotsSpeed,
          "toneColor",
          1,
          s => (s + 0.005) % 1
        ),
        AliveDots.presets().normal
      ]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      all: [
        animateParamProgram(Stars, "starsColor", 1, s => (s + 0.005) % 1),
        Stars.presets().pocasSlow
      ]
    })
  },
  {
    duration: 60 * baseTime,
    program: programsByShape({
      top: [
        animateParamProgram(AliveDots, "toneColor", 1, s => (s + 0.005) % 1),
        AliveDots.presets().musicMediaSlow
      ]
    })
  },

  { duration: 60 * baseTime, program: volumeDotByBand(3) },
  { duration: 60 * baseTime, program: volumeDotByBand(10) },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      all: [
        animateParamProgram(VolumeDot, "numberOfOnLeds", 5, n => (n + 1) % 100),
        {
          multiplier: 1.5,
          numberOfOnLeds: 1
        }
      ]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      all: [
        animateParamProgram(VolumeDot, "numberOfOnLeds", 30, n =>
          Math.ceil(Math.random() * 100)
        )
      ]
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      top: [SpeedingSpear, { spearLength: 10 }]
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      topLeft: VolumeBars,
      topRight: VolumeBars,
      bottomLeftNoBase: VolumeBars,
      bottomRightNoBase: VolumeBars,
      bottom: VolumeBars,
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      top: VolumeBars,
      bottom: VolumeBars,
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      all: [ColorSpear, { speed: 4, colorVariety: 1, spearLength: 6 }]
    })
  },

  {
    duration: 15 * baseTime,
    program: programsByShape({ all: [Rainbow, Rainbow.presets().fastMarks] })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({ all: [Rainbow, Rainbow.presets().purpleDots] })
  },

  // {duration: 30*baseTime, program: Hourglass},

  ...getAllPresets(Stars, 30)
];

// las formas que se pueden usar están definidas en Transformation

module.exports = createMultiProgram(schedule, false, 1000);
