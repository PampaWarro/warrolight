const _ = require("lodash");
const {getAllPresets, getFilePresets} = require("../../presets.js");
const LightProgram = require("../base-programs/LightProgram");
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
const WarroBass = require("./warroBass");

const MusicFrequencyDot = require("./musicFrequencyDot");
const BandParticles = require("./bandParticles");
const StripePatterns = require("./stripe-patterns");
const FrequencyActivation = require("./frequencyActivation");
const Circles = require("./circles");

// Programas pensados para la profundidad de la W con los dos arcos.
const DepthWaves = require("./depthWaves");
const DepthBands = require("./depthBands");
const PerspectiveRise = require("./perspectiveRise");
const Vortex = require("./vortex");
const KillBill = require("./killBill");
const WhiteRipples = require("./whiteRipples");
const StarFire = require("./starFire");
const GhostParade = require("./ghostParade");
const BatFlight = require("./batFlight");
const EyesInTheDark = require("./eyesInTheDark");
const WitchBrew = require("./witchBrew");
const HauntedStorm = require("./hauntedStorm");
const SlicePlanes = require("./slicePlanes");
const WarpTunnel = require("./warpTunnel");
const DepthEcho = require("./depthEcho");
const RackFocus = require("./rackFocus");
const CometTunnel = require("./cometTunnel");

// TODO: AJUSTAR ANTES  DE COMITEAR!!!
const baseTime = 1 * 1000;

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
      escala: 20,
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

const allSchedule = shape => [
  ...getAllPresets(DepthWaves, 60 * baseTime, shape),
  ...getAllPresets(DepthBands, 60 * baseTime, shape),
  ...getAllPresets(PerspectiveRise, 60 * baseTime, shape),
  ...getAllPresets(Vortex, 60 * baseTime, shape),
  ...getAllPresets(KillBill, 60 * baseTime, shape),
  ...getAllPresets(WhiteRipples, 60 * baseTime, shape),
  ...getAllPresets(StarFire, 60 * baseTime, shape),
  ...getAllPresets(GhostParade, 60 * baseTime, shape),
  ...getAllPresets(BatFlight, 60 * baseTime, shape),
  ...getAllPresets(EyesInTheDark, 60 * baseTime, shape),
  ...getAllPresets(WitchBrew, 60 * baseTime, shape),
  ...getAllPresets(HauntedStorm, 60 * baseTime, shape),
  ...getAllPresets(SlicePlanes, 60 * baseTime, shape),
  ...getAllPresets(WarpTunnel, 60 * baseTime, shape),
  ...getAllPresets(DepthEcho, 60 * baseTime, shape),
  ...getAllPresets(RackFocus, 60 * baseTime, shape),
  ...getAllPresets(CometTunnel, 60 * baseTime, shape),

  ...getAllPresets(Mix, 60 * baseTime, "Warro"),

  ...getFilePresets('default.json', 60 * baseTime),

  ...getAllPresets(Rays, 30 * baseTime, "Warro"),

  ...getAllPresets(Circles, 30 * baseTime, shape),

  ...getAllPresets(StripePatterns, 30 * baseTime, shape),

  ...getAllPresets(MusicFrequencyDot, 30 * baseTime, shape),


  { duration: 60 * baseTime, program: BandParticles },
  { duration: 60 * baseTime, program: BandParticles },
  { duration: 60 * baseTime, program: BandParticles },

  { duration: 30 * baseTime, program: starsSunrise },

  { duration: 30 * baseTime, program: radialSunArribaAbajo },

  ...getAllPresets(Shapes, 60 * baseTime, shape),

  { duration: 30 * baseTime, program: WarroBass },
  { duration: 30 * baseTime, program: WarroBass }, // Es muy buenoo!!! más
  { duration: 60 * baseTime, program: WarroBass }, // Es muy buenoo!!! más

  ...getAllPresets(Bombs, 60 * baseTime, shape),

  ...getAllPresets(BassWarpGrid, 60 * baseTime, shape),

  ...getAllPresets(RadialSun, 30 * baseTime, shape),
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
  ...getAllPresets(SoundWaves, 30 * baseTime, shape),
  {
    duration: 60 * baseTime,
    program: programsByShape({
      [shape]: [
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

  ...getAllPresets(Lineal, 30 * baseTime, "Warro"),

  ...getAllPresets(WaterFlood, 30 * baseTime, shape),

  ...getAllPresets(AliveDots, 30 * baseTime, "Warro"),
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
          multiplier: 1.5,
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

  ...getAllPresets(Stars, 30 * baseTime, "Warro")
];


// const schedule2 = [
//   ...getFilePresets('default.json', 60 * baseTime),
// ]
// las formas que se pueden usar están definidas en Transformation

// Combinaciones de Halloween que reparten los programas entre la W y los arcos.
// Sólo tienen sentido con la geometría entera.
const halloweenCombos = [
  {
    duration: 60 * baseTime,
    program: programsByShape({WarroOnly: BatFlight, arcos: GhostParade}, "murcielagosYFantasmas"),
  },
  {
    duration: 60 * baseTime,
    program: programsByShape({WarroOnly: EyesInTheDark, arcos: HauntedStorm}, "ojosEnLaTormenta"),
  },
  {
    duration: 60 * baseTime,
    program: programsByShape({WarroOnly: WitchBrew, arcos: [EyesInTheDark, EyesInTheDark.presets().muchosOjos]}, "elCaldero"),
  },
  {
    duration: 60 * baseTime,
    program: programsByShape({WarroOnly: [StarFire, StarFire.presets().hoguera], arcos: [EyesInTheDark, EyesInTheDark.presets().teSiguen]}, "fogataConOjos"),
  },
  {
    duration: 60 * baseTime,
    program: programsByShape({WarroOnly: HauntedStorm, arcos: [GhostParade, GhostParade.presets().procesion]}, "tormentaDeFantasmas"),
  },
];

const halloweenSchedule = shape => [
  ...getAllPresets(GhostParade, 60 * baseTime, shape),
  ...getAllPresets(BatFlight, 60 * baseTime, shape),
  ...getAllPresets(EyesInTheDark, 60 * baseTime, shape),
  ...getAllPresets(WitchBrew, 60 * baseTime, shape),
  ...getAllPresets(HauntedStorm, 60 * baseTime, shape),

  // Variantes que no están entre los presets de cada programa.
  {duration: 60 * baseTime, program: programsByShape({[shape]: [GhostParade, {ghostsPerSecond: 3, maxGhosts: 18, speed: 30, size: 2.5, fog: 0.3}]}, "estampida")},
  {duration: 60 * baseTime, program: programsByShape({[shape]: [BatFlight, {batsPerSecond: 6, maxBats: 40, size: 2, speed: 40}]}, "enjambre")},
  {duration: 60 * baseTime, program: programsByShape({[shape]: [EyesInTheDark, {eyesPerSecond: 3, maxEyes: 25, size: 0.8, stalkers: 0.5}]}, "manada")},
  {duration: 60 * baseTime, program: programsByShape({[shape]: [WitchBrew, {level: 0.25, bubblesPerSecond: 30, vapor: 1, sloshSpeed: 2}]}, "humareda")},
  {duration: 60 * baseTime, program: programsByShape({[shape]: [HauntedStorm, {strikesPerSecond: 1, thunderDelay: 0.3, witchlight: 1, fog: 0.5}]}, "aquelarre")},
  {duration: 60 * baseTime, program: programsByShape({[shape]: [StarFire, StarFire.presets().hoguera]}, "hoguera")},
  {duration: 60 * baseTime, program: programsByShape({[shape]: [StarFire, StarFire.presets().soloBrasas]}, "brasas")},

  // Los programas de profundidad, con colores de Halloween.
  {duration: 60 * baseTime, program: programsByShape({[shape]: [WarpTunnel, WarpTunnel.presets().halloween]}, "warpHalloween")},
  {duration: 60 * baseTime, program: programsByShape({[shape]: [CometTunnel, CometTunnel.presets().calabazas]}, "calabazas")},
  {duration: 60 * baseTime, program: programsByShape({[shape]: [SlicePlanes, SlicePlanes.presets().escanerToxico]}, "escanerToxico")},
  {duration: 60 * baseTime, program: programsByShape({[shape]: [SlicePlanes, SlicePlanes.presets().calabazaYBruja]}, "calabazaYBruja")},
  {duration: 60 * baseTime, program: programsByShape({[shape]: [RackFocus, RackFocus.presets().embrujado]}, "focoEmbrujado")},
  {duration: 60 * baseTime, program: programsByShape({[shape]: [DepthEcho, DepthEcho.presets().pocion]}, "ecoPocion")},

  ...(shape === "allOfIt" ? halloweenCombos : []),
];

const schedules = {
  all: allSchedule,
  halloween: halloweenSchedule,
};

// Dónde se pueden poner los programas: todo, sólo la W o sólo los arcos.
const shapes = ["allOfIt", "WarroOnly", "arcos", "arco1", "arco2"];

// El main elige al azar entre los programas del modo seleccionado. Con una shape
// que no sea "allOfIt", los programas generales se dibujan sólo en esa shape, y
// los que usan formas propias (V1, totems, etc.) se recortan para no prender
// nada fuera de ella.
module.exports = class MainWarcos extends LightProgram {
  init() {
    this.build();
  }

  build() {
    const {mode, shape} = this.config;
    const schedule = (schedules[mode] || allSchedule)(shape);
    const MultiProgram = createMultiProgram(schedule, true, 15000, true);
    this.program = new MultiProgram(this.config, this.geometry, this.shapeMapping, this.lightController);
    this.program.init();
    this.built = {mode, shape};

    const map = shape !== "allOfIt" && this.shapeMapping()[shape];
    this.outside = null;
    if (map) {
      this.outside = new Array(this.numberOfLeds).fill(true);
      for (const i of map) this.outside[i] = false;
    }
  }

  drawFrame(leds, context) {
    this.program.timeInMs = this.timeInMs;
    this.program.drawFrame(leds, context);
    if (this.outside) {
      for (let i = 0; i < this.numberOfLeds; i++) {
        if (this.outside[i]) leds[i] = [0, 0, 0];
      }
    }
  }

  updateConfig(config) {
    this.config = config;
    if (this.program && (config.mode !== this.built.mode || config.shape !== this.built.shape)) {
      this.build();
    }
  }

  getDebugHelpers() {
    return this.program ? this.program.getDebugHelpers() : [];
  }

  toString() {
    return this.program ? this.program.toString() : super.toString();
  }

  static configSchema() {
    let res = super.configSchema();
    res.mode = {type: String, values: Object.keys(schedules), default: "all"};
    res.shape = {type: String, values: shapes, default: "allOfIt"};
    return res;
  }
};
