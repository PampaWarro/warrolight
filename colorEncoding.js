module.exports = {
  ENCODING_POS_RGB: 1,
  ENCODING_POS_VGA: 2,
  ENCODING_VGA: 3,
  ENCODING_RGB: 4,

  arrayFromRGB: rgb => {
    const red = parseInt(rgb.substr(1, 2), 16)
    const blue = parseInt(rgb.substr(3, 2), 16)
    const green = parseInt(rgb.substr(5, 2), 16)
    return [red, blue, green]
  },

  rgbToVga: (r, g, b) => {
    return (r & 0xE0) + ((g & 0xE0) >> 3) + ((b & 0xC0) >> 6)
  }
}
