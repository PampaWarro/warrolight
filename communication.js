const _ = require('lodash');
const express = require('express');

const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);
const now = require('performance-now');

const path = require('path');

const Device = require('./device')
const Multiplexer = require('./multiplexer')

let multiplexer;
let numberOfLights = 1;

// // W Chica
// const device1 = new Device(150, 'COM15');
// setTimeout(() => {
//   multiplexer = new Multiplexer(150, [device1], (index) => {
//     // Skip the first 7 leds on the strip, which are on the back of thw small W
//     if(index < 7){
//       return [0, 8]
//     } else {
//       return [0, index]
//     }
//   })
//   numberOfLights = multiplexer.numberOfLights
// }, 6000)


// W grande
var device1, device2
device1 = new Device(300, 'COM4')
device2 = new Device(300, 'COM5')

setTimeout(() => {
  multiplexer = new Multiplexer(600, [device1, device2], (index) => {
    if (index < 150) {
      if (index < 41)
        return [0, 0]

      return [0, index]
    } else if (index < 300) {
      if ((index - 150) < 40)
        return [0, 0]

      return [0, index]
    } else if (index < 450) {
      if ((index - 300 < 37))
        return [0, 0]

      return [1, index - 300]
    } else {
      if ((index - 450) < 34)
        return [0, 0]

      return [1, index - 300]
    }
  })
 numberOfLights = multiplexer.numberOfLights
}, 6000)

let state = "off"
io.on('connection', (socket) => {
  function setState(newState){
    if(state !== newState) {
      state = newState;
      console.log("Broadcasteando state", state)
      io.sockets.emit('data', {state: state})
    }
  }

  function sendLightsToLeds(colorArray){
    if (multiplexer) {
      multiplexer.setState(colorArray)
    }
  }

  let djActionTotalTime = 0;
  let djActionInterval = 0;
  let djActionStartTime = 0;
  let colorFunc = null;
  function temporalEffectAction(getColorsFunc, timeInc){
    const emitTimeRemaining = _.throttle(t => io.sockets.emit('data', {stateTimeRemaining: t}), 200)
    return () => {
      setState("dj-action");
      colorFunc = getColorsFunc;
      djActionTotalTime += timeInc;

      if(!djActionInterval){
        djActionStartTime = new Date();

        // 60 fps
        djActionInterval = setInterval(()=>{
          if(state === "dj-action") {
            let elapsedTime = new Date() - djActionStartTime;
            if (elapsedTime < djActionTotalTime) {
              sendLightsToLeds(colorFunc())
              emitTimeRemaining(djActionTotalTime - elapsedTime)
            } else {
              djActionTotalTime = 0
              setState("off");
              clearTimeout(djActionInterval)
              djActionInterval = 0
            }
          }
          else {
            djActionTotalTime = 0
            clearTimeout(djActionInterval)
            djActionInterval = 0
          }
        }, 1000/60)
      }
    }
  }


  const djActions = {
    "off": {
      description: "APAGAR +5s",
      run: temporalEffectAction(t => _.range(0,numberOfLights).map(i => '#000000'), 5000)
    },
    "white": {
      description: "WHITE +5s",
      run: temporalEffectAction(t => _.range(0,numberOfLights).map(i => '#777777'), 5000)
    },
    "warro": {
      description: "Logo Pampa Warro +2s",
      run: temporalEffectAction(t => {
        let todoNaranja = _.range(0,numberOfLights).map(i => '#FF9933')
        _.each(_.range(0,30).concat(_.range(450,480)), i => todoNaranja[i] = "#000000")
        return todoNaranja
      }, 2000)
    },
    "resume": {
      description: "Retomar programa",
      run: () => setState("off")
    }
  }

  socket.emit('data', {state: state, actions: _.mapValues(djActions, action => action.description)})

  socket.on('message', (data) => {
    if (data.action === 'leds') {
      if (state !== "dj-action") {
        setState("running-program")
        sendLightsToLeds(data.payload)
      }
    } else if (data.action === "dj-action"){
      let action = djActions[data.payload];
      if(action) {
        console.log(`DJ ACTION ${action.description}`)
        action.run()
      }
    } else if (data.action === "remoteCmd"){
      console.log("Remote command:", data.payload)
      socket.broadcast.emit('cmd', data.payload)
    }
  })
});

server.listen(3000, '0.0.0.0')
