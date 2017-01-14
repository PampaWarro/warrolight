const getFromStripe = (stripes, func, defaultValue, propName) => {
  return stripes.reduce((prop, stripe) => {
    return func(prop, stripe[propName].reduce(
      (prop2, coordinate) => func(prop2, coordinate), defaultValue
    ))
  }, defaultValue)
}

export default class Geometry {
  constructor(stripes, width, height, marginX, marginY) {
    this.stripes = stripes
    this.width = parseInt(width, 10)
    this.height = parseInt(height, 10)

    const minX = getFromStripe(this.stripes, Math.min, Infinity, 'x')
    const maxX = getFromStripe(this.stripes, Math.max, -Infinity, 'x')
    const minY = getFromStripe(this.stripes, Math.min, Infinity, 'y')
    const maxY = getFromStripe(this.stripes, Math.max, -Infinity, 'y')

    const xScale = (width - 2 * marginX ) / ( maxX - minX )
    const yScale = (height - 2 * marginY ) / ( maxY - minY )
    const xBase = marginX
    const yBase = marginY

    this.x = []
    this.y = []
    const stripeCount = this.stripes.length
    let count = 0
    for (let i = 0; i < stripeCount; i++) {
      const stripe = this.stripes[i]
      const stripeLength = stripe.leds
      for (let j = 0; j < stripeLength; j++) {
        this.x[count + j] = (stripe.x[j] - minX) * xScale + xBase
        this.y[count + j] = (stripe.y[j] - minY) * yScale + yBase
      }
      count += stripeLength
    }
    this.leds = count
  }
}
