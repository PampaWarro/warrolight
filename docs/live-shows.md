# Live Shows

This guide covers how to build and run a live light show with Warrolight — from composing program sequences to operating the mixer during a DJ set.

## Running the mixer

The web UI is the live control panel. During a show:

1. Start the server and web app (`./tmux-session.sh` or manually)
2. Open `http://localhost:3000` on the computer running the server
3. To control from a phone or tablet, connect to the same WiFi network (via a local router) and open the server's IP on port 3000

The web UI works on mobile — the 3D visualizer is disabled to save battery and bandwidth, but program selection, parameter sliders, and preset management all work. Device status is hidden on small screens.

### UI overview

- **Program list** (left sidebar) — all available programs. Click to switch. Presets appear nested under each program.
- **Parameter controls** (main area) — sliders, dropdowns, and toggles generated from each program's `configSchema`. Changes take effect immediately.
- **Presets** — saved parameter combinations. Click a preset name to load it. Use the save/delete buttons in the config area to manage them.
- **Restart** — reinitializes the current program (resets time, re-runs `init()`)
- **3D preview** — click START to begin streaming LED frames. Drag to rotate. Click the preview to pause/resume. Only available on desktop.
- **Microphone viewer** — real-time audio waveform with metric selector (RMS, peakDecay, fastPeakDecay) and band selector (global, bass, mid, high)
- **Device status** — connection state and FPS for each physical LED controller

### Typical show workflow

1. Load a `PROGRAM_Main_*` show composition — it cycles through effects automatically
2. Monitor via the 3D preview or by watching the physical installation
3. If needed, switch to a different program manually or adjust parameters
4. Save good parameter combinations as presets for reuse

## Presets

Presets store program configurations as JSON files in `server/setups/program-presets/`. Each setup has its own presets file (configured via `presetsFile` in the setup JSON).

**Where presets come from:**
- **Built-in presets** — defined in a program's static `presets()` method. These ship with the code and can't be deleted from the UI.
- **Saved presets** — created via the web UI during rehearsal or live shows. Stored in the JSON file and persist across restarts.

**Preset workflow:**
1. Select a program and tune its parameters
2. Click save, enter a name — it's stored in the presets JSON file
3. The preset appears in the program list and can be loaded with one click
4. Show compositions can reference presets by name when building their schedules

## Show composition

A show composition is a program that orchestrates other programs into a timed sequence. They live in `server/src/light-programs/programs/` with names like `PROGRAM_Main_fuego2024.js` or `PALO.js`.

### MultiProgram — sequential scheduling

The most common pattern. Define a schedule of programs with durations, then wrap it in `createMultiProgram`:

```js
const { createMultiProgram } = require("../base-programs/MultiProgram");

const schedule = [
  { duration: 120, program: Stars,    config: { speed: 2, brillo: 0.8 } },
  { duration: 90,  program: Radial3d, config: { velocidad: 5 } },
  { duration: 60,  program: Noise,    config: { colorMap: "ocean" } },
];

module.exports = createMultiProgram(schedule, 15000 /* crossfade ms */, true /* random order */);
```

- **`duration`** — seconds before transitioning to the next program
- **`config`** — parameter overrides (merged with program defaults)
- **crossfade** — milliseconds of alpha blending between programs (typically 15–20 seconds)
- **random** — if true, shuffles the schedule instead of playing in order

A production show like `PROGRAM_Main_fuego2024` has ~100 schedule entries and runs for over an hour.

### ProgramsByShape — spatial composition

Assigns different programs to different parts of the geometry simultaneously:

```js
const { programsByShape } = require("../base-programs/ProgramsByShape");

module.exports = programsByShape({
  allOfIt: [Radial3d, { velocidad: 10 }],
  totems:  [Stars, { brillo: 0.5 }],
  wings:   [MusicFlow, { speed: 3 }],
});
```

Each shape runs its own program instance on its own sub-geometry. The outputs combine back into the full LED array. This is how complex installations (Joya dome + totems, Palo main structure + wireless sticks) get different effects on different parts.

### MixProgram — blending

Layers multiple programs and blends them together:

```js
const { createMixProgram } = require("../base-programs/MixProgram");

module.exports = createMixProgram(
  [Radial3d, { velocidad: 5 }],
  [Stars, { brillo: 0.3 }],
  { blendMode: "add" }  // or "multiply"
);
```

- **add** — takes the maximum RGB value per LED across all layers (additive light)
- **multiply** — multiplies layers together (darkening, masking effects)

The `mix` program in the UI exposes this interactively — you can pick programs and blend them live.

### DynamicMask — masked composition

Uses three layers: a mask program, a "positive" program (shown where the mask is bright), and a "negative" program (shown where the mask is dark):

```js
const { createDynamicMask } = require("../base-programs/DynamicMask");

module.exports = createDynamicMask(
  RadialSun,     // mask
  MusicFlow,     // positive (where mask is white)
  Stars,         // negative (where mask is black)
);
```

### AnimateProgram — parameter animation

Wraps a program and animates one of its config parameters over time:

```js
const { animateParamProgram } = require("../base-programs/AnimateProgram");

module.exports = animateParamProgram(
  Radial,
  "velocidad",       // param to animate
  1,                 // animate every N frames
  value => (value + 0.01) % 15  // update function
);
```

### OverrideBrightness / OverrideColor — wrappers

Modify a program's output without changing it:

```js
const { OverrideBrightness } = require("../base-programs/OverrideBrightness");

// Constant brightness
module.exports = OverrideBrightness(Stars, 0.3);

// Dynamic brightness (e.g., fade-in over 2 minutes)
module.exports = OverrideBrightness(Stars, (ctx) =>
  Math.min(1, ctx.timeInMs / 120000)
);
```

`OverrideColor` blends program output toward a target hue/saturation, controlled by the `overrideColor`, `overrideHue`, and `overrideSat` config params.

### FX — audio effects

Wraps a program with delay (echo) and/or slow fade effects:

```js
const { makeFXProgram } = require("../base-programs/FX");

module.exports = makeFXProgram(MusicFlow);
// Adds configurable delay (ms, wet, dry, feedback) and slow fade
```

## Music synchronization

Warrolight can sync light programs to specific tracks via VLC integration.

### Setup

The server connects to VLC's HTTP API on port 9099 and polls every 250ms for the current track title, playback position, and duration. This data is available to all programs via `context.nowPlaying`:

```js
context.nowPlaying = {
  title: "Las Olas - Aurora",
  length: 180000,    // total duration in ms
  time: 45000,       // current position in ms
  playing: true
}
```

### NowPlayingTrackProgram — switch by track

Maps track titles to programs. When the song changes, the light program changes:

```js
const { createNowPlayingTrackProgram } = require("../base-programs/NowPlayingTrackProgram");

module.exports = createNowPlayingTrackProgram({
  "": defaultProgram,                    // fallback for unknown tracks
  "Las Olas - Aurora": auroraProgram,
  "Las Olas - Memorias": memoriasProgram,
});
```

### NowPlayingPositionProgram — timed cues within a track

Activates programs at specific times during a track, with fade in/out:

```js
const { createNowPlayingPositionProgram } = require("../base-programs/NowPlayingPositionProgram");

module.exports = createNowPlayingPositionProgram([
  { start: 0,   end: 30,  program: introProgram,   fadeIn: 2, fadeOut: 3 },
  { start: 28,  end: 90,  program: buildupProgram,  fadeIn: 5, fadeOut: 5 },
  { start: 85,  end: 180, program: peakProgram,      fadeIn: 3, fadeOut: 10 },
]);
```

Overlapping time windows blend additively. This enables choreographed light shows synced to specific moments in a track.

## Building a show: real examples

### Automated show rotation (PROGRAM_Main_fuego2024)

The Fuego 2024 show loads ~100 preset configurations from multiple sources and cycles through them in random order with 15-second crossfades:

```js
const schedule = [
  ...getAllPresets(Stars, 120),           // all Stars presets, 120s each
  ...getAllPresets(Radial3d, 90),         // all Radial3d presets
  ...getFilePresets("javier.json", 60),  // presets from JSON file
  // ... many more
];

module.exports = createMultiProgram(schedule, true, 15000);
```

`getAllPresets()` extracts every preset defined in a program's class and creates a schedule entry for each. `getFilePresets()` loads presets from a JSON file. This pattern means the show grows automatically as you save more presets.

### Multi-phase art program (JoyaMate_BM22_art)

A structured show with distinct phases:

1. **Intro** (2 min) — stars at very low brightness, fading in from 5% to 20%
2. **Ramp up** (3 min) — multi-program sequence with brightness animation
3. **Interlude** (3 min) — random schedule from presets
4. **Peak** (3 min) — high-intensity presets
5. **Calesita** (1 min) — spinning polar effect
6. **Ramp down** (2 min) — breathing white light, fading to black

Each phase uses `OverrideBrightness` for smooth transitions and `MultiProgram` for internal sequencing.

### Track-synced show (Joya_BM23_art)

Maps specific songs to choreographed light sequences:

```js
createNowPlayingTrackProgram({
  "": randomSchedule(allPresets, 60),           // default: cycle presets
  "Las Olas - Aurora": auroraShow,              // specific show for this track
  "Las Olas - Memorias": memoriasShow,          // and this one
  "Las Olas - Luz": luzShow,                    // and this one
});
```

Each track-specific show uses `NowPlayingPositionProgram` internally for timed cues within the song.

### Intensity-filtered shows (PALO, Cabra, Hash, DC)

Several installation programs offer runtime intensity selection:

```js
const intensityFilter = {
  any: () => true,
  low: (p) => p.tags?.includes("low"),
  mid: (p) => p.tags?.includes("mid"),
  high: (p) => p.tags?.includes("high"),
};
```

The operator selects an intensity level from the web UI, and the program filters its schedule to only include matching presets. This lets you match the energy of the music without building separate show files.

## Composition patterns summary

| Pattern | Base class | Use case |
|---|---|---|
| Timed sequence | `MultiProgram` | Cycling through effects automatically |
| Spatial split | `ProgramsByShape` | Different effects on different parts of the installation |
| Layered blend | `MixProgram` | Combining two effects additively or multiplicatively |
| Masked blend | `DynamicMask` | Using one program as a mask over two others |
| Parameter drift | `AnimateProgram` | Slowly changing a parameter over time |
| Brightness wrap | `OverrideBrightness` | Fade in/out, overall dimming |
| Color override | `OverrideColor` | Shift hue/saturation of any program |
| Audio effects | `FX` | Echo/delay and slow fade |
| Track switching | `NowPlayingTrackProgram` | Different programs per song |
| Timed cues | `NowPlayingPositionProgram` | Events at specific times in a track |

These can be nested arbitrarily — a `MultiProgram` schedule can contain `ProgramsByShape` entries that each use `OverrideBrightness` wrapping `MixProgram` layers with `FX` effects. This compositional depth is what makes complex live shows possible.
