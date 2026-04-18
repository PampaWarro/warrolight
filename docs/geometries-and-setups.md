# Geometries and Setups

Every physical installation in Warrolight needs three things: a **geometry** (where the LEDs are in space), a **shape mapping** (named regions of LEDs), and a **setup** (which ties geometry, shapes, and devices together). This guide explains how each part works and how to create new ones.

## The Stripe class

All geometries are built from `Stripe` objects (`server/src/geometry.js`). A `Stripe` represents one physical LED strip — a sequence of points in space, each corresponding to one LED.

`Stripe` has three factory methods:

```js
// 3D line between two points
Stripe.line([x1, y1, z1], [x2, y2, z2], numberOfLeds, pixelRatio)

// Legacy 2D (z = 0)
Stripe.old2d(x1, y1, x2, y2, numberOfLeds, pixelRatio)

// 3D, but with axes swapped for CAD-style coordinates (x, z, y-up → x, -y, -z)
Stripe.fromXZUpwardY([x1, z1, y1], [x2, z2, y2], numberOfLeds, pixelRatio)
```

All three interpolate a straight line between two endpoints and distribute `numberOfLeds` evenly along it.

The optional `pixelRatio` (default 1) indicates LED density. A value of 2 means the physical strip has twice the LED density of the logical resolution — the system will only address every other LED. This is useful when you have high-density strips but want to reduce bandwidth.

## Writing a geometry

A geometry file lives in `server/setups/geometries/` and exports an array of `Stripe` objects.

### Simple example: circo.js (4 hanging sticks)

```
a1 a2 a3 a4     (top attachment points)
 |  |  |  |
 |  |  |  |
 |  |  |  |
b1 b2 b3 b4     (bottom endpoints, angled outward)
```

```js
const { Stripe } = require("../../src/geometry");

const scale = x => 40 * x;

// Top points (close together, high up)
const a1 = [-.675, 0, 3].map(scale);
const a2 = [-.225, 0, 3].map(scale);
const a3 = [ .225, 0, 3].map(scale);
const a4 = [ .675, 0, 3].map(scale);

// Bottom points (spread out, lower)
const b1 = [-2.287, .806, 1.267].map(scale);
const b2 = [ -.806, 2.287, 1.357].map(scale);
const b3 = [  .806, 2.287, 1.357].map(scale);
const b4 = [ 2.287, .806, 1.267].map(scale);

module.exports = {
  stripes: [
    Stripe.fromXZUpwardY(a1, b1, 150),
    Stripe.fromXZUpwardY(a2, b2, 150),
    Stripe.fromXZUpwardY(a3, b3, 150),
    Stripe.fromXZUpwardY(a4, b4, 150),
  ],
  vertices: [0, 149, 150, 299, 300, 449, 450, 599],
};
```

Key points:
- Coordinates come from real-world measurements (meters), then get scaled up
- Each `Stripe` is one physical LED strip with 150 LEDs
- `fromXZUpwardY` is used because the measurements use a CAD-style coordinate system

### More complex example: cabra.js (goat head)

```
A  B   C  D      (horn tips)
 \ |   | /
  \|   |/
   X   X         (crossing point)
   |\ /|
   | X |
   |/ \|
   E   F
    \ /
     G            (chin)
```

```js
const { Stripe } = require("../../src/geometry");

const scale = x => 20 * x;

const A = [-3.32, -4.73].map(scale);
const B = [-1.38, -4.81].map(scale);
// ... more points ...
const G = [0, 0].map(scale);

module.exports = [
  Stripe.old2d(...G, ...B, 300, 2),  // 2 = high density
  Stripe.old2d(...G, ...C, 300, 2),
  Stripe.old2d(...F, ...A, 300, 2),
  Stripe.old2d(...E, ...D, 300, 2),
];
```

This one uses the older export style (plain array instead of `{ stripes, vertices }`), and `old2d` for a flat 2D layout.

### Procedural example: palo.js (16 vertical sticks in an arc)

Instead of listing every stripe manually, this one generates them in a loop:

```js
const stripes = [];
let angle = -((N - 1) / 2) * ANGLE_INCREMENT;
for (let i = 0; i < N; i++) {
  const x1 = Math.sin(angle) * RADIUS;
  const z1 = -Math.cos(angle) * RADIUS;
  // ... compute points ...
  stripes.push(Stripe.line(a, b, 150, PIXEL_RATIO));  // front of stick
  stripes.push(Stripe.line(d, c, 150, PIXEL_RATIO));  // back of stick
  angle += ANGLE_INCREMENT;
}
```

Each palo has two stripes (front and back), and they're arranged in an arc. The procedural approach is cleaner when the geometry has a repeating pattern.

## Stripe order matters

The order of stripes in the array defines the logical LED index space. LED 0 is the first LED of the first stripe, and indices continue sequentially through each stripe in order.

**This must match the physical wiring order.** If strip 1 has 150 LEDs and strip 2 has 150 LEDs, then logical LEDs 0–149 map to strip 1 and LEDs 150–299 map to strip 2. The device mapping in the setup JSON relies on these indices being correct.

## Export styles

There are two export formats, both supported by the setup loader (`server/src/setup.js`):

```js
// Newer style — named export with optional vertices
module.exports = {
  stripes: [ /* Stripe objects */ ],
  vertices: [ /* LED indices at notable points (endpoints, corners) */ ],
};

// Older style — plain array
module.exports = [ /* Stripe objects */ ];
```

The `vertices` array is optional and lists LED indices at notable geometric points (like the endpoints of each stripe). Programs like `vertexGlow` use these to create effects anchored to structural points.

## Shape mappings

A shape mapping file (`server/setups/shape-mappings/`) exports a function that returns an object mapping names to arrays of LED indices:

```js
const _ = require("lodash");

module.exports = function getShapes() {
  return {
    allOfIt: _.range(0, 1200),
    leftEye: _.range(85, 146),
    rightEye: _.range(385, 446),
    horns: _.flatten([_.range(146, 300), _.range(446, 600)]),
    // ...
  };
};
```

Each shape is just an array of integers — the LED indices that belong to that region. Programs can then target specific shapes. For example, `PROGRAM_Transition` assigns different sub-programs to different shapes, so the horns might pulse red while the eyes strobe white.

Shape names are arbitrary — pick whatever makes sense for the installation. Common patterns:
- `allOfIt` / `all` — every LED (almost always present)
- Region names: `left`, `right`, `center`, `top`, `bottom`
- Part names: `horns`, `eyes`, `head`, `body`
- Indexed parts: `palo-1`, `palo-2`, `palo-1-front`, `palo-1-back`

## Setup JSON

The setup file (`server/setups/*.json`) is the top-level config that ties everything together:

```json
{
  "geometry": "cabra",
  "shapeMapping": "cabra",
  "lights": 1200,
  "outputDevices": {
    "udp": {
      "type": "udp-chunked",
      "params": {
        "numberOfLights": 1200,
        "name": "cabra-quinled.local",
        "udpPort": 8888
      }
    }
  },
  "lightsToDevicesMapping": [
    {
      "from": 0,
      "to": 1200,
      "baseIndex": 0,
      "deviceName": "udp"
    }
  ],
  "presetsFile": "cabra"
}
```

### Fields

- **`geometry`** — name of the geometry file in `setups/geometries/` (without `.js`)
- **`shapeMapping`** — name of the shape mapping file in `setups/shape-mappings/` (without `.js`)
- **`lights`** — total LED count. Must match the sum of LEDs across all stripes in the geometry
- **`outputDevices`** — named device configurations. Each has a `type` (`serial`, `udp`, `udp-chunked`, `udp-wled`, `angio`, `falcon`) and type-specific `params`
- **`lightsToDevicesMapping`** — maps ranges of logical LED indices to physical devices:
  - `from` / `to` — LED index range (exclusive end)
  - `deviceName` — which device from `outputDevices`
  - `baseIndex` — offset within the device (usually 0 unless multiple ranges map to the same device)
  - `reverse` — (optional) flip the LED order in this range
- **`presetsFile`** — name of the presets file in `setups/program-presets/` (without `.json`)

### Multiple devices example: palo.json

```json
{
  "lights": 4800,
  "outputDevices": {
    "wired": {
      "type": "falcon",
      "params": { "numberOfLights": 3600, "name": "Falcon_F16V5_88DB.lan" }
    },
    "wireless": {
      "type": "udp-chunked",
      "params": { "numberOfLights": 1200, "name": "palo-gw.local", "udpPort": 6678 }
    }
  },
  "lightsToDevicesMapping": [
    { "from": 0,    "to": 600,  "baseIndex": 0,   "deviceName": "wireless" },
    { "from": 600,  "to": 4200, "baseIndex": 0,   "deviceName": "wired" },
    { "from": 4200, "to": 4800, "baseIndex": 600, "deviceName": "wireless" }
  ]
}
```

Here the first and last 600 LEDs go to a wireless ESP-NOW gateway, while the middle 3600 go to a wired Falcon controller. Note how the second wireless mapping uses `baseIndex: 600` — it's the second chunk of LEDs on the same wireless device, continuing after the first 600.

## Creating a new installation

1. **Measure your LED layout** — note the 3D position of each strip's start and end points, and the number of LEDs per strip

2. **Create the geometry** (`server/setups/geometries/mysetup.js`):
   - Draw an ASCII diagram in a comment
   - Define coordinate points from your measurements
   - Create `Stripe` objects in wiring order
   - Export as `{ stripes, vertices }` or a plain array

3. **Create the shape mapping** (`server/setups/shape-mappings/mysetup.js`):
   - Export a function returning an object of `{ shapeName: ledIndexArray }`
   - Always include `allOfIt` covering all LEDs
   - Add regions that make sense for your shape

4. **Create the setup JSON** (`server/setups/mysetup.json`):
   - Reference your geometry and shape mapping by filename
   - Set total `lights` count
   - Configure your output devices
   - Map LED ranges to devices

5. **Set it as the active setup** — either edit `warroLight.setup` in `server/package.json` or run `node src/index.js mysetup.json`

6. **Iterate using the web visualizer** — see the section below

## Verifying with the web visualizer

The web app includes a 3D visualizer (Three.js) that renders your LED geometry with live color data. This is the primary tool for verifying geometry and shape mappings before connecting hardware.

**Starting the preview:**
1. Run the server (`cd server && yarn start`) and web app (`cd web && yarn start`)
2. Open `http://localhost:3000`
3. Click the START button to begin receiving live LED frames
4. Drag with the mouse to rotate the 3D view

**Debug programs for verification:**
- **`debugSetup`** — colors each stripe a different color (from a palette of 10). Use this to verify that stripe order matches your physical wiring — each strip should light up in a distinct color, in the right position. The `brillo` parameter controls a dashed pattern that helps identify strip direction.
- **`debugShapes`** — cycles through your shape mapping regions, lighting each one solid white for 2 seconds. Use this to confirm that named shapes (e.g., `leftEye`, `horns`) cover the correct LEDs.

**Important limitations:**
- **No hot-reload** — geometry is loaded once at server startup. After editing a geometry or setup file, you must restart the server. The web client will receive the updated layout when it reconnects.
- **Read-only** — you cannot modify geometry, shape mappings, or device configuration from the web UI. All changes must be made in the files and require a server restart.
- **Bandwidth** — the visualizer receives base64 RGB data at 60fps. It auto-pauses when the browser tab loses focus to save bandwidth. Click the preview to manually pause/resume.
