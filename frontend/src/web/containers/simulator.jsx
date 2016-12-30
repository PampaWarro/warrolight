import * as React from 'react'

import { browserHistory } from 'react-router'
import { Card, Col, Row } from 'antd'
import { Link } from 'react-router'
import { default as styled } from 'styled-components'

const randomcolor = require('randomcolor')

const sum = (a, b) => a + b
const width = 1.6
const height = 1
const config = {
  numberOfLeds: 150
}

const xAnchors = [
  0, 0.25, 0.35,  0.25, 0.45,  0.35, 0.45, 0.7
].map(e => e * width)

const yAnchors = [
  1,    0, 0.60,    1,    1, 0.60,    0, 1
].map(e => e * height)

const anchorSegments = [
  0, 33, 17, 17, 16, 17, 17, 33, 1
]

const anchorIndex = anchorSegments.map((value, index) => {
  return anchorSegments.slice(0, index + 1).reduce(sum)
})

const xPos = []
const yPos = []

const xScale = 400 * width
const yScale = 400 * height

let lesserIndex = 0
let higherIndex = 1
for (let i = 0; i < 150; i++) {
  if (anchorIndex[higherIndex] === i) {
    lesserIndex++; higherIndex++
  }
  let relIndex = i - anchorIndex[lesserIndex]
  xPos.push(xAnchors[lesserIndex] +
      (xAnchors[higherIndex] - xAnchors[lesserIndex]) * relIndex
    / (anchorSegments[higherIndex])
  )
  yPos.push(yAnchors[lesserIndex] + 
      (yAnchors[higherIndex] - yAnchors[lesserIndex]) * relIndex
    / (anchorSegments[higherIndex])
  )
}

export class WSimulator extends React.Component {

  constructor() {
    super(...arguments)
    this.state = {}
  }

  getConfig() {
    return this.config
  }

  setTiles(tiles) {
    this.setState({ tiles })
  }

  drawTiles() {
    if (!this.state.tiles) {
      return
    }
    return this.state.tiles.map((tile, index) => {
      return <div style={{
          'backgroundColor': tile,
          'left': xPos[index] * xScale + 'px',
          'top': (yScale - yPos[index] * yScale) + 'px',
          'width': '10px',
          'height': '10px',
          'position': 'absolute'
        }}
        key={ 'tile-' + index }
      />
    })
  }
  render() {
    return <div style={{
      position: 'relative',
      marginTop: '20px',
      marginLeft: '20px',
      width: '100%',
      height: '100%'
    }}> {this.drawTiles()} </div>
  }
}