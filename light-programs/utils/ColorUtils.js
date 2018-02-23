module.exports = class ColorUtils {
  // static red: '#FF0000'
  // static green: '#00FF00'
  // static blue: '#0000FF'
  // static yellow: '#ffff00'
  // static orange: '#FFA500'
  // static purple: '#FF00FF'
  // static black: '#000000'

  static rgbToHex(r, g, b) {
    function componentToHex(c) {
      var hex = Math.max(0, Math.min(255, Math.floor(c))).toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  static HSVtoHex(h, s, v){
    return ColorUtils.rgbToHex(... ColorUtils.HSVtoRGB(h, s, v));
  }

  static HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
      s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }
    return [
      Math.round(Math.min(255, r * 255)),
      Math.round(Math.min(255, g * 255)),
      Math.round(Math.min(255, b * 255))
    ];
  }

  static hexToRgb(hexColor) {
    if (hexColor) {
      // in three-character format, each value is multiplied by 0x11 to give an
      // even scale from 0x00 to 0xff
      let hex = hexColor.replace('#', '');
      let r = parseInt(hex.substring(0, 2), 16);
      let g = parseInt(hex.substring(2, 4), 16);
      let b = parseInt(hex.substring(4, 6), 16);

      return [r, g, b];
    } else {
      console.log("hexToRgb called without value")
      throw "caca"
    }
  }

  static mix([r,g,b], [r2, g2, b2], ratio) {
    return [Math.floor(r*(1-ratio)+r2*ratio), Math.floor(g*(1-ratio)+g2*ratio), Math.floor(b*(1-ratio)+b2*ratio)]
  }

  static clamp(r, g, b) {
    return [
      Math.max(0, Math.min(255, Math.round(r))),
      Math.max(0, Math.min(255, Math.round(g))),
      Math.max(0, Math.min(255, Math.round(b)))];
  }

  static dim([r, g, b], number) {
    r = Math.floor(r * number);
    g = Math.floor(g * number);
    b = Math.floor(b * number);
    return [r, g, b];
  }
}