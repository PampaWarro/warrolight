module.exports = class ColorUtils {
  // static red: '#FF0000'
  // static green: '#00FF00'
  // static blue: '#0000FF'
  // static yellow: '#ffff00'
  // static orange: '#FFA500'
  // static purple: '#FF00FF'
  // static black: '#000000'

  static rgbToHex(r, g, b, a) {
    function componentToHex(c) {
      const hex = Math.max(0, Math.min(255, Math.floor(c))).toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  static HSVtoHex(h, s, v, a) {
    return ColorUtils.rgbToHex(...ColorUtils.HSVtoRGB(h, s, v, a));
  }

  static RGBtoHSV(r, g, b, a) {
    if (arguments.length === 1) {
      (g = r.g), (b = r.b), (r = r.r), (a = r.a);
    }
    a = a === undefined ? 1 : a;
    let max = Math.max(r, g, b),
      min = Math.min(r, g, b),
      d = max - min,
      h,
      s = max === 0 ? 0 : d / max,
      v = max / 255;

    switch (max) {
      case min:
        h = 0;
        break;
      case r:
        h = g - b + d * (g < b ? 6 : 0);
        h /= 6 * d;
        break;
      case g:
        h = b - r + d * 2;
        h /= 6 * d;
        break;
      case b:
        h = r - g + d * 4;
        h /= 6 * d;
        break;
    }

    return [h, s, v, a];
  }

  static HSVtoRGB(h, s, v, a) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
      (s = h.s), (v = h.v), (h = h.h);
    }
    a = a === undefined ? 1 : a;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0:
        (r = v), (g = t), (b = p);
        break;
      case 1:
        (r = q), (g = v), (b = p);
        break;
      case 2:
        (r = p), (g = v), (b = t);
        break;
      case 3:
        (r = p), (g = q), (b = v);
        break;
      case 4:
        (r = t), (g = p), (b = v);
        break;
      case 5:
        (r = v), (g = p), (b = q);
        break;
    }
    return [
      Math.round(Math.min(255, r * 255)),
      Math.round(Math.min(255, g * 255)),
      Math.round(Math.min(255, b * 255)),
      a
    ];
  }

  static hexToRgb(hexColor) {
    if (hexColor) {
      // in three-character format, each value is multiplied by 0x11 to give an
      // even scale from 0x00 to 0xff
      let hex = hexColor.replace("#", "");
      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);

      return [r, g, b, 1];
    } else {
      console.log("hexToRgb called without value");
      throw "caca";
    }
  }

  static mix([r, g, b, a], [r2, g2, b2, a2], ratio) {
    a = a === undefined ? 1 : a;
    a2 = a2 === undefined ? 1 : a2;
    return [
      Math.floor(r * (1 - ratio) + r2 * ratio),
      Math.floor(g * (1 - ratio) + g2 * ratio),
      Math.floor(b * (1 - ratio) + b2 * ratio),
      a * (1 - ratio) + a2 * ratio
    ];
  }

  static clamp(r, g, b, a) {
    a = a === undefined ? 1 : a;
    return [
      Math.max(0, Math.min(255, Math.round(r))),
      Math.max(0, Math.min(255, Math.round(g))),
      Math.max(0, Math.min(255, Math.round(b))),
      Math.max(0, Math.min(1, a))
    ];
  }

  static dim([r, g, b, a], number) {
    r = Math.floor(r * number);
    g = Math.floor(g * number);
    b = Math.floor(b * number);
    a = a === undefined ? 1 : a;
    return [r, g, b, a];
  }

  // Modulo that handles negative numbers better.
  static mod(x, m) {
    return ((x % m) + m) % m;
  }
};
