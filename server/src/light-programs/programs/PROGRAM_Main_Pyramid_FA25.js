const _ = require("lodash");
const {getAllPresets, getFilePresets} = require("../../presets.js");
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
const baseTime = 1 * 1000;

function sineScale(s) {
    return (Math.sin(this.timeInMs / 1000) + 1) * 8 + 0.5;
}

let flowDefault = [MusicFlow, MusicFlow.presets().default];

let radialSunByBand = programsByShape({
    innerTriangle: [
        RadialSun,
        { soundMetric: "highFastPeakDecay", saturation: 1, centerY: -2 }
    ],
    middleTriangle: [
        RadialSun,
        {
            soundMetric: "midFastPeakDecay",
            saturation: 0.95,
            escala: 20,
            power: 3,
            centerY: -2
        }
    ],
    outerTriangle: [
        RadialSun,
        { soundMetric: "bassFastPeakDecay", saturation: 0.8, centerY: 11, power: 5 }
    ]
});

let volumeDotsRandomByBand = count =>
    programsByShape({
        innerTriangle: [
            VolumeDotRandom,
            { soundMetric: "highFastPeakDecay", numberOfOnLeds: count }
        ],
        middleTriangle: [
            VolumeDotRandom,
            { soundMetric: "midFastPeakDecay", numberOfOnLeds: count }
        ],
        outerTriangle: [
            VolumeDotRandom,
            { soundMetric: "bassFastPeakDecay", numberOfOnLeds: count * 2 }
        ]
    });

let volumeDotByBand = count =>
    programsByShape({
        innerTriangle: [
            VolumeDot,
            { soundMetric: "highFastPeakDecay", numberOfOnLeds: count }
        ],
        middleTriangle: [
            VolumeDot,
            { soundMetric: "midFastPeakDecay", numberOfOnLeds: count }
        ],
        outerTriangle: [
            VolumeDot,
            { soundMetric: "bassFastPeakDecay", numberOfOnLeds: count * 2 }
        ]
    });

let rainbowIteratingShapes = createMultiProgram(
    [
        {
            duration: 500,
            program: programsByShape({
                outerTriangle: [Rainbow, Rainbow.presets().purpleDots]
            })
        },
        {
            duration: 500,
            program: programsByShape({
                middleTriangle: [Rainbow, Rainbow.presets().purpleDots]
            })
        },
        {
            duration: 500,
            program: programsByShape({
                innerTriangle: [Rainbow, Rainbow.presets().purpleDots]
            })
        },
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
    ...getAllPresets(Mix, 60 * baseTime),

    ...getFilePresets('default.json', 60 * baseTime),

    ...getAllPresets(Rays, 30 * baseTime),

    ...getAllPresets(Circles, 30 * baseTime),

    ...getAllPresets(StripePatterns, 30 * baseTime),

    ...getAllPresets(MusicFrequencyDot, 30 * baseTime),


    { duration: 60 * baseTime, program: BandParticles },
    { duration: 60 * baseTime, program: BandParticles },
    { duration: 60 * baseTime, program: BandParticles },

    { duration: 30 * baseTime, program: starsSunrise },

    { duration: 30 * baseTime, program: radialSunArribaAbajo },

    ...getAllPresets(Shapes, 60 * baseTime, "allOfIt"),

    ...getAllPresets(Bombs, 60 * baseTime, "allOfIt"),

    ...getAllPresets(BassWarpGrid, 60 * baseTime, "allOfIt"),

    ...getAllPresets(RadialSun, 30 * baseTime, "allOfIt"),
    { duration: 60 * baseTime, program: radialSunByBand },

    { duration: 60 * baseTime, program: volumeDotsRandomByBand(3) },
    { duration: 60 * baseTime, program: volumeDotsRandomByBand(10) },

    { duration: 60 * baseTime, program: rainbowIteratingShapes },

    {
        duration: 60 * baseTime,
        program: programsByShape({
            T3_side1: flowDefault,
            T3_side2: flowDefault,
            T3_side3: flowDefault,
            T2_side1: flowDefault,
            T2_side2: flowDefault,
            T2_side3: flowDefault
        })
    },
    {
        duration: 30 * baseTime,
        program: createMultiProgram(
            [
                {
                    duration: 10000,
                    program: programsByShape({
                        innerTriangle: [MusicFlow, MusicFlow.presets().mediumDoble]
                    })
                },
                {
                    duration: 10000,
                    program: programsByShape({
                        middleTriangle: [
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
                        T1_side1: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
                    })
                },
                {
                    duration: 500,
                    program: programsByShape({
                        T1_side2: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
                    })
                },
                {
                    duration: 500,
                    program: programsByShape({
                        T1_side3: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
                    })
                },
                {
                    duration: 500,
                    program: programsByShape({
                        outerTriangle: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
                    })
                },
                {
                    duration: 500,
                    program: programsByShape({
                        middleTriangle: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
                    })
                },
                {
                    duration: 500,
                    program: programsByShape({
                        innerTriangle: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
                    })
                },
                {
                    duration: 500,
                    program: programsByShape({
                        innerTriangle: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
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
            allOfIt: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro]
        })
    },
    { duration: 30 * baseTime, program: programsByShape({ allOfIt: MusicFlow }) },
    {
        duration: 30 * baseTime,
        program: programsByShape({
            innerTriangle: MusicFlow,
            middleTriangle: [MusicFlow, { haciaAfuera: false }]
        })
    },
    {
        duration: 30 * baseTime,
        program: programsByShape({ outerTriangle: MusicFlow, middleTriangle: MusicFlow })
    },
    { duration: 30 * baseTime, program: programsByShape({ allOfIt: MusicFlow }) },

    {
        duration: 30 * baseTime,
        program: programsByShape({
            allOfIt: [MusicFlow, MusicFlow.presets().fastDobleDesdePuntas]
        })
    },
    ...getAllPresets(SoundWaves, 30 * baseTime, "allOfIt"),
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
            allOfIt: animateParamProgram(
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
            allOfIt: animateParamProgram(
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
            allOfIt: [Radial, { centerY: 17.3, velocidad: 10, power: 15 }]
        })
    },
    {
        duration: 15 * baseTime,
        program: programsByShape({
            allOfIt: [
                Radial,
                { power: 20, escala: 10, velocidad: 10, centerX: -30, centerY: 17.3 }
            ]
        })
    },
    {
        duration: 15 * baseTime,
        program: programsByShape({
            allOfIt: [Radial, { power: 20, escala: 10, velocidad: 10 }]
        })
    },
    {
        duration: 30 * baseTime,
        program: programsByShape({
            allOfIt: [Radial, { power: 20, escala: 1, velocidad: 10 }]
        })
    },
    {
        duration: 30 * baseTime,
        program: programsByShape({
            innerTriangle: [Radial, { power: 15, escala: 5, centerX: -15, centerY: 17.3 }]
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
            allOfIt: [
                animateParamProgram(Rays, "colorHueOffset", 60, x => x + 0.01),
                Rays.presets().fireFast
            ]
        })
    },

    ...getAllPresets(Lineal, 30 * baseTime, "allOfIt"),

    ...getAllPresets(WaterFlood, 30 * baseTime, "allOfIt"),

    ...getAllPresets(AliveDots, 30 * baseTime, "allOfIt"),
    {
        duration: 30 * baseTime,
        program: programsByShape({
            innerTriangle: [AliveDots, AliveDots.presets().constanteLentoUnidirecional],
            outerTriangle: [AliveDots, AliveDots.presets().constanteLentoUnidirecional]
        })
    },
    {
        duration: 60 * baseTime,
        program: programsByShape({
            allOfIt: [
                animateParamProgram(AliveDots, "toneColor", 1, s => (s + 0.005) % 1),
                AliveDots.presets().musicMediaSlow
            ]
        })
    },

    {
        duration: 60 * baseTime,
        program: programsByShape({
            innerTriangle: [
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
            allOfIt: [
                animateParamProgram(Stars, "starsColor", 1, s => (s + 0.005) % 1),
                Stars.presets().pocasSlow
            ]
        })
    },
    {
        duration: 60 * baseTime,
        program: programsByShape({
            allOfIt: [
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
            allOfIt: [
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
            allOfIt: [
                animateParamProgram(VolumeDot, "numberOfOnLeds", 30, n =>
                    Math.ceil(Math.random() * 100)
                )
            ]
        })
    },

    {
        duration: 30 * baseTime,
        program: programsByShape({
            allOfIt: [SpeedingSpear, { spearLength: 10 }]
        })
    },
    {
        duration: 30 * baseTime,
        program: programsByShape({
            allOfIt: VolumeBars,
        })
    },

    {
        duration: 30 * baseTime,
        program: programsByShape({
            allOfIt: [ColorSpear, { speed: 4, colorVariety: 1, spearLength: 6 }]
        })
    },

    {
        duration: 15 * baseTime,
        program: programsByShape({ allOfIt: [Rainbow, Rainbow.presets().fastMarks] })
    },
    {
        duration: 30 * baseTime,
        program: programsByShape({ allOfIt: [Rainbow, Rainbow.presets().purpleDots] })
    },

    // {duration: 30*baseTime, program: Hourglass},

    ...getAllPresets(Stars, 30 * baseTime, "allOfIt")
];


// const schedule2 = [
//   ...getFilePresets('default.json', 60 * baseTime),
// ]
// las formas que se pueden usar están definidas en Transformation

module.exports = createMultiProgram(schedule, true, 15000, true);
