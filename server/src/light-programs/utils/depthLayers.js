const _ = require("lodash");

// Groups the leds of a geometry in layers by depth (z), from the back (layer 0)
// to the front. Each led also gets its "rise": 0 at the floor of its layer and
// 1 at the top of it, so that both halves of an arch (or both legs of the W)
// go up together, symmetrically.
//
// Leds closer than `tolerance` in z are considered part of the same layer.
module.exports = function depthLayers(geometry, tolerance = 1) {
  const leds = geometry.leds;
  const zs = _.sortBy(_.uniq(geometry.z.slice(0, leds).map(z => Math.round(z))));

  const layerZs = [];
  for (const z of zs) {
    if (!layerZs.length || z - _.last(layerZs) > tolerance) {
      layerZs.push(z);
    }
  }

  const layerOf = new Array(leds);
  for (let i = 0; i < leds; i++) {
    const z = geometry.z[i];
    layerOf[i] = _.sortedLastIndex(layerZs, z + tolerance) - 1;
  }

  // y grows downwards: the floor is the max y of each layer.
  const top = new Array(layerZs.length).fill(Infinity);
  const bottom = new Array(layerZs.length).fill(-Infinity);
  for (let i = 0; i < leds; i++) {
    const l = layerOf[i];
    top[l] = Math.min(top[l], geometry.y[i]);
    bottom[l] = Math.max(bottom[l], geometry.y[i]);
  }

  const rise = new Array(leds);
  for (let i = 0; i < leds; i++) {
    const l = layerOf[i];
    rise[i] = (bottom[l] - geometry.y[i]) / Math.max(bottom[l] - top[l], 1);
  }

  // Each layer is symmetric around its own vertical axis. `side` is the
  // distance to it, the same for a led and its mirror on the other half.
  const left = new Array(layerZs.length).fill(Infinity);
  const right = new Array(layerZs.length).fill(-Infinity);
  for (let i = 0; i < leds; i++) {
    const l = layerOf[i];
    left[l] = Math.min(left[l], geometry.x[i]);
    right[l] = Math.max(right[l], geometry.x[i]);
  }
  const center = left.map((x, l) => (x + right[l]) / 2);
  const side = new Array(leds);
  for (let i = 0; i < leds; i++) {
    side[i] = Math.abs(geometry.x[i] - center[layerOf[i]]);
  }

  return {
    count: layerZs.length,
    z: layerZs,
    layerOf,
    rise,
    center,
    side,
  };
};
