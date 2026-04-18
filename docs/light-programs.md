# Light Programs

Light programs are the core creative unit of Warrolight. Each program generates per-frame LED colors — some react to music, some produce geometric animations, and some compose other programs into curated show sequences.

## How programs work

Every program extends `LightProgram` and implements `drawFrame(leds, context)`, called ~60 times per second:

```js
const LightProgram = require("../base-programs/LightProgram");

class MyProgram extends LightProgram {
  init() {
    // Called once when the program starts or restarts
  }

  drawFrame(leds, context) {
    // Called every frame. Write [r, g, b] into leds[i].
    const bass = context.audio.bassFastPeakDecay;
    for (let i = 0; i < leds.length; i++) {
      leds[i] = [bass * 255, 0, 0];
    }
  }

  static configSchema() {
    // Parameters exposed as sliders in the web UI
    return {
      speed: { type: "number", min: 0, max: 10, default: 1 },
      color: { type: "color", default: "#ff0000" },
    };
  }
}

module.exports = MyProgram;
```

The `context` object provides:
- **`context.audio`** — real-time audio metrics: `bassMax`, `bassRms`, `bassFastPeakDecay`, `midMax`, `highMax`, `rms`, `fastPeakDecay`, `fft[]`, and more
- **`context.timeInMs`** — milliseconds since the program started
- **`context.nowPlaying`** — currently playing track metadata

Programs access their config via `this.config` (e.g., `this.config.speed`). Config changes from the web UI take effect immediately.

## Base classes

Beyond `LightProgram`, several base classes provide higher-level abstractions:

| Base class | Purpose |
|---|---|
| `LightProgram` | Direct per-LED color computation |
| `LayerBasedProgram` | Composites from drawable layers with blend modes (add, multiply, hue, etc.) |
| `ProgramsByShape` | Routes different programs to different geometry shapes |
| `MultiProgram` | Schedules programs with timed transitions and crossfades |
| `MixProgram` | Blends multiple programs together (add or multiply) |
| `AnimateProgram` | Animates config parameters over time |
| `NowPlayingPositionProgram` | Switches programs based on track playback position |
| `NowPlayingTrackProgram` | Switches programs based on currently playing track name |
| `OverrideBrightness` / `OverrideColor` | Wraps a program to modify brightness or hue |

The `FX` system can wrap any program with effects like delay and slow fade.

## Utility library

Programs share utilities in `server/src/light-programs/utils/`:

- **`ColorUtils`** — HSV/RGB conversion, color mixing, clamping, dimming
- **`layers`** — Layer system with blend modes (normal, add, difference, subtract, multiply, hue)
- **`drawables`** — Visual primitives for `LayerBasedProgram`: `SolidColor`, `Line`, `Circle`, `InfiniteCircles`, `Grid`, `PolarColors`, `GradientSolidSphere`, `RandomPixels`, etc.

## Program catalog

### Foundational programs (Nov 2019)

The original batch from the project's start. These are the building blocks that most show compositions reference:

| Program | Audio | Description |
|---|---|---|
| `all-white` | No | Solid white with brightness control |
| `all-off` | No | All LEDs off |
| `rainbow` | No | Moving rainbow stripes |
| `stars` | Optional | Random twinkling with adjustable flash duration |
| `rays` | Optional | Particle trails with decay. Presets: rainbow smoke, fire |
| `aliveDots` | Yes | Colored dots with audio-driven acceleration |
| `aliveDotsSpeed` | Yes | Simpler dot variant with RMS-based speed |
| `musicVolumeBars` | Yes | Horizontal bar graph filling from left |
| `musicVolumeDot` | Yes | Single dot positioned by audio level |
| `musicVolumeDotRandom` | Yes | Random dots light up with audio intensity |
| `musicFrequencyDot` | Yes | Bass/mid/high mapped to RGB at center |
| `musicFlow` | Yes | Color wave flowing bidirectionally with music |
| `frequencyActivation` | Yes | FFT frequency visualization across strip |
| `warroBass` | Yes | Bass-reactive effect |
| `sound-waves` | Yes | 3D expanding spheres from a point, triggered by audio |
| `radial` | No | Concentric sine wave circles |
| `radialSun` | No | Sun-like expansion from top/bottom/center |
| `radialWarp` | No | Infinite circles with warp distortion |
| `lineal` | No | Horizontal/vertical sine wave stripes |
| `circles` | Optional | 3D distance-based hue calculation |
| `shapes` | Optional | Composite layers: polar background, lines, circles, rain |
| `bombs` | Optional | Grid with warp distortion around center |
| `bassWarpGrid` | Yes | Bass-driven grid warping |
| `bandParticles` | Yes | Three particle streams for bass/mid/high bands |
| `stripe-patterns` | Yes | Dynamic stripe mutation driven by audio |
| `water-flood` | No | Water level fill with sinusoidal waves |
| `color-spear` | No | Moving spear of color across LEDs |
| `speeding-spear` | No | Accelerating spear |
| `debugSetup` | No | Colors each stripe differently for wiring verification |
| `debugShapes` | No | Cycles through shape regions (white, 2s each) |

### Early additions (Dec 2019 – Feb 2020)

| Program | Audio | Description |
|---|---|---|
| `noise` | No | Simplex noise cloud with gradient coloring |
| `gradientSphere` | No | Moving sphere with gradient mapping |
| `mix` | Yes | User-configurable program mixer (add/multiply blend) |
| `radial3d` | No | 3D radial with Z-axis distance |
| `ca` | No | Cellular automata (Wolfram rules) with gradient |
| `musicFlash` | Yes | Full-strip flash with audio intensity |

### Conga programs (Nov 2021)

Built for the Conga tetrahedral art car. Interactive game-like programs:

| Program | Description |
|---|---|
| `congaShooting` | Tug-of-war bullet game with collisions |
| `congaShooting2` | Variant of shooting game |
| `congaScore` | Score display as bar graph |
| `congaRope` | Rope visualization |

### 2022 expansion (Feb – Aug 2022)

Major wave of new programs and the first show compositions for Burning Man:

| Program | Audio | Description |
|---|---|---|
| `musicExplosions` | Yes | 3D particle explosions on peaks |
| `relampejo` | No | Lightning flash effect |
| `waveform` | Yes | Direct audio waveform visualization |
| `polar` | No | Rotating polar coordinates with 3D matrix transforms |
| `randomShapes` | Optional | Randomly illuminates shape regions |
| `dynamicMask` | Yes | Three-subprogram blend (mask, positive, negative) |
| `vertexGlow` | Optional | Glow and ripple effects around geometry vertices |

**Show compositions (2022):**
| Program | Description |
|---|---|
| `PROGRAM_Main_minijoya` | Full show schedule for minijoya sculpture |
| `PROGRAM_Main_minijoya_intro` | Intro sequence |
| `PROGRAM_Main_minijoya_transition` | Transition effects |
| `JoyaMate_BM22_art` | Complex multi-phase art program (intro → ramp-up → peak → outro) |

### 2023 programs (Feb – Nov 2023)

Shows for Burning Man 2023 and new installations:

| Program | Description |
|---|---|
| `Cabra` | Cabra (goat head) installation program |
| `Joya_BM23_art` | Track-synced show (Aurora, Memorias, Luz) |
| `Joya_BM23_music` | Intensity-level music program (low/mid/high) |
| `Hash_music` | Hash art installation scheduler |

### 2024 programs (Jan – Dec 2024)

| Program | Audio | Description |
|---|---|---|
| `DC_music` | Yes | Disco Chalet with shape masks |
| `music-flow-waves` | Yes | 3D wave propagation with hue calculation |
| `PROGRAM_Main_fuego2024` | Yes | Massive 589-line show rotation for Fuego 2024 |
| `hsv` | No | Solid HSV color picker |
| `waveform2` | Yes | 2D waveform display |
| `PALO` | Yes | Palo installation scheduler |

## Program types explained

### Standalone programs

Most programs are standalone — they write directly to the `leds` array based on time, audio, and geometry. They can run on any installation regardless of shape.

### Show compositions (PROGRAM_Main_*)

These are curated playlists built for specific events. They use `MultiProgram` to schedule a sequence of programs with crossfades and timed transitions. Example from `PROGRAM_Main_fuego2024`:

```js
createMultiProgram([
  { program: "stars",    duration: 120, config: { /* preset */ } },
  { program: "radial3d", duration: 90,  config: { /* preset */ } },
  { program: "noise",    duration: 60,  config: { /* preset */ } },
  // ... hundreds of entries
], /* crossfade */ true, /* random order */ false);
```

These are the programs you load for a live show — they cycle through effects automatically.

### Shape-mapped programs (ProgramsByShape)

These assign different sub-programs to different geometry regions. Used heavily for complex installations like Joya (dome + totems) where different parts should have different effects simultaneously:

```js
ProgramsByShape({
  "dome": { program: "radial3d", config: { /* ... */ } },
  "totems": { program: "stars", config: { /* ... */ } },
});
```

### Installation-specific programs

Programs like `Cabra`, `DC_music`, `Hash_music`, `PALO`, and the `Joya_*` / `JoyaMate_*` series are tailored to specific installations. They reference shapes and presets specific to that installation's geometry.

## Adding a new program

1. Create `server/src/light-programs/programs/my-program.js`
2. Extend `LightProgram` (or `LayerBasedProgram` for layer-based effects)
3. Implement `drawFrame(leds, context)` and optionally `init()` and `configSchema()`
4. Add the filename (without `.js`) to the `programNames` array in `server/src/LightController.js`
5. Restart the server — the program will appear in the web UI's program list

For audio-reactive programs, use `context.audio.bassFastPeakDecay` (responds to beats) or `context.audio.rms` (responds to overall volume) as a starting point. The `fft[]` array gives raw frequency data for more detailed analysis.

For spatial effects, access LED positions via `this.geometry` (x/y/z arrays) to create effects that depend on the physical location of each LED.
