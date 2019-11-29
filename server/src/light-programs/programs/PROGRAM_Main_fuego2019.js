const _ = require("lodash");
const createMultiProgram = require("../base-programs/MultiPrograms");
const animateParamProgram = require("../base-programs/AnimatePrograms");
const programsByShape = require("../base-programs/Transformations");
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
const WarroBass = require("./warroBass");

const MusicFrequencyDot = require("./musicFrequencyDot");
const BandParticles = require("./bandParticles");
const StripePatterns = require("./stripe-patterns");
const FrequencyActivation = require("./frequencyActivation");
const RadialWarp = require("./radialWarp");
const Circles = require("./circles");

const baseTime = 1 * 1000;

function getAllPresets(funcClass, time, shape = "Warro") {
  return _.map(funcClass.presets(), preset => {
    return {
      duration: time * baseTime,
      program: programsByShape({ [shape]: [funcClass, preset] })
    };
  });
}

function sineScale(s) {
  return (Math.sin(this.timeInMs / 1000) + 1) * 8 + 0.5;
}

let flowDefault = [MusicFlow, MusicFlow.presets().default];

let radialSunByBand = programsByShape({
  totemsExt: [
    RadialSun,
    { soundMetric: "highFastPeakDecay", saturation: 1, centerY: -2 }
  ],
  totemsInt: [
    RadialSun,
    {
      soundMetric: "midFastPeakDecay",
      saturation: 0.95,
      escala: 50,
      power: 3,
      centerY: -2
    }
  ],
  WarroOnly: [
    RadialSun,
    { soundMetric: "bassFastPeakDecay", saturation: 0.8, centerY: 11, power: 5 }
  ]
});

let volumeDotsRandomByBand = count =>
  programsByShape({
    totemsExt: [
      VolumeDotRandom,
      { soundMetric: "highFastPeakDecay", numberOfOnLeds: count }
    ],
    totemsInt: [
      VolumeDotRandom,
      { soundMetric: "midFastPeakDecay", numberOfOnLeds: count }
    ],
    WarroOnly: [
      VolumeDotRandom,
      { soundMetric: "bassFastPeakDecay", numberOfOnLeds: count * 2 }
    ]
  });

let volumeDotByBand = count =>
  programsByShape({
    totemsExt: [
      VolumeDot,
      { soundMetric: "highFastPeakDecay", numberOfOnLeds: count }
    ],
    totemsInt: [
      VolumeDot,
      { soundMetric: "midFastPeakDecay", numberOfOnLeds: count }
    ],
    WarroOnly: [
      VolumeDot,
      { soundMetric: "bassFastPeakDecay", numberOfOnLeds: count * 2 }
    ]
  });

let rainbowIteratingShapes = createMultiProgram(
  [
    {
      duration: 500,
      program: programsByShape({
        totems: [Rainbow, Rainbow.presets().purpleDots]
      })
    },
    {
      duration: 500,
      program: programsByShape({
        wings: [Rainbow, Rainbow.presets().purpleDots]
      })
    },
    {
      duration: 500,
      program: programsByShape({
        wingsLeft: [Rainbow, Rainbow.presets().purpleDots]
      })
    },
    {
      duration: 500,
      program: programsByShape({
        wingsRight: [Rainbow, Rainbow.presets().purpleDots]
      })
    },
    {
      duration: 500,
      program: programsByShape({
        wingsX: [Rainbow, Rainbow.presets().purpleDots]
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
      escala: 50
    }
  ],
  [
    RadialSun,
    {
      ...RadialSun.presets().fromTop,
      soundMetric: "highPeakDecay",
      power: 2,
      escala: 70
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
      escala: 80,
      saturation: 0.5
    }
  ]
);

const schedule = [
  ...getAllPresets(Circles, 30, "allOfIt"),

  ...getAllPresets(StripePatterns, 30, "allOfIt"),

  ...getAllPresets(MusicFrequencyDot, 30, "allOfIt"),

  { duration: 60 * baseTime, program: FrequencyActivation },

  { duration: 60 * baseTime, program: BandParticles },
  { duration: 60 * baseTime, program: BandParticles },
  { duration: 60 * baseTime, program: BandParticles },

  { duration: 30 * baseTime, program: starsSunrise },

  { duration: 30 * baseTime, program: radialSunArribaAbajo },

  ...getAllPresets(Shapes, 60, "allOfIt"),

  { duration: 30 * baseTime, program: WarroBass },
  { duration: 30 * baseTime, program: WarroBass }, // Es muy buenoo!!! más
  { duration: 60 * baseTime, program: WarroBass }, // Es muy buenoo!!! más

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
      totemL1: flowDefault,
      totemL2: flowDefault,
      totemR1: flowDefault,
      totemR2: flowDefault,
      V1L: flowDefault,
      V2R: flowDefault
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
            trianguloTop: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            X: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            V1: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            V2: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            V1R: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            V1L: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            V2R: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            V2L: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            totemL1: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            totemL2: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            totemR1: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
          })
        },
        {
          duration: 500,
          program: programsByShape({
            totemR2: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
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
      Warro: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
    })
  },
  { duration: 30 * baseTime, program: programsByShape({ reloj: MusicFlow }) },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      V1: MusicFlow,
      V2: [MusicFlow, { haciaAfuera: false }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({ V1: MusicFlow, V2: MusicFlow })
  },
  { duration: 30 * baseTime, program: programsByShape({ Warro: MusicFlow }) },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      Warro: [MusicFlow, MusicFlow.presets().fastDobleDesdePuntas]
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
      Warro: animateParamProgram(
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
      Warro: animateParamProgram(
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
      Warro: [Radial, { centerY: 17.3, velocidad: 10, power: 15 }]
    })
  },
  {
    duration: 15 * baseTime,
    program: programsByShape({
      Warro: [
        Radial,
        { power: 20, escala: 10, velocidad: 10, centerX: -30, centerY: 17.3 }
      ]
    })
  },
  {
    duration: 15 * baseTime,
    program: programsByShape({
      wings: [Radial, { power: 20, escala: 10, velocidad: 10 }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      Warro: [Radial, { power: 20, escala: 1, velocidad: 10 }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      reloj: [Radial, { power: 15, escala: 5, centerX: -15, centerY: 17.3 }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({ X: Radial, totemL1: Radial, totemR1: Radial })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({ trianguloTop: Radial, wings: Radial })
  },
  {
    duration: 30 * baseTime,
    program: animateParamProgram(Radial, "velocidad", 1, s => (s + 0.01) % 15)
  },

  {
    duration: 60 * baseTime,
    program: programsByShape({
      Warro: [
        animateParamProgram(Rays, "colorHueOffset", 60, x => x + 0.01),
        Rays.presets().fireFast
      ]
    })
  },
  ...getAllPresets(Rays, 60),

  ...getAllPresets(Lineal, 30),

  ...getAllPresets(WaterFlood, 40, "allOfIt"),

  ...getAllPresets(AliveDots, 30),
  {
    duration: 30 * baseTime,
    program: programsByShape({
      V1: [AliveDots, AliveDots.presets().constanteLentoUnidirecional],
      V2: [AliveDots, AliveDots.presets().constanteLentoUnidirecional]
    })
  },
  {
    duration: 60 * baseTime,
    program: programsByShape({
      Warro: [
        animateParamProgram(AliveDots, "toneColor", 1, s => (s + 0.005) % 1),
        AliveDots.presets().musicMediaSlow
      ]
    })
  },

  {
    duration: 60 * baseTime,
    program: programsByShape({
      reloj: [
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
      Warro: [
        animateParamProgram(Stars, "starsColor", 1, s => (s + 0.005) % 1),
        Stars.presets().pocasSlow
      ]
    })
  },
  {
    duration: 60 * baseTime,
    program: programsByShape({
      trianguloTop: [
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
      Warro: [
        animateParamProgram(VolumeDot, "numberOfOnLeds", 5, n => (n + 1) % 100),
        {
          multiplier: 3,
          numberOfOnLeds: 1
        }
      ]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      Warro: [
        animateParamProgram(VolumeDot, "numberOfOnLeds", 30, n =>
          Math.ceil(Math.random() * 100)
        )
      ]
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      trianguloTop: [SpeedingSpear, { spearLength: 10 }]
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      V1L: VolumeBars,
      V2R: VolumeBars,
      trianguloTopRight: VolumeBars,
      trianguloTopLeft: VolumeBars,
      trianguloBottomLeft: VolumeBars,
      trianguloBottomRight: VolumeBars
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      V1L: VolumeBars,
      V1R: VolumeBars,
      V2L: VolumeBars,
      V2R: VolumeBars
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      Warro: [SpeedingSpear, { speed: 10, colorVariety: 1, spearLength: 3 }]
    })
  },

  {
    duration: 30 * baseTime,
    program: programsByShape({
      reloj: [ColorSpear, { spearLength: 15, speed: 8 }]
    })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({
      Warro: [ColorSpear, { speed: 4, colorVariety: 1, spearLength: 6 }]
    })
  },

  {
    duration: 15 * baseTime,
    program: programsByShape({ Warro: [Rainbow, Rainbow.presets().fastMarks] })
  },
  {
    duration: 30 * baseTime,
    program: programsByShape({ Warro: [Rainbow, Rainbow.presets().purpleDots] })
  },

  // {duration: 30*baseTime, program: Hourglass},

  ...getAllPresets(Stars, 30)
];

// las formas que se pueden usar están definidas en Transformation

module.exports = createMultiProgram(schedule, true);
