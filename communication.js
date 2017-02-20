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

var device1, device2, device3, device4
var multiplexer

device1 = new Device(300, 'COM4')
device2 = new Device(300, 'COM5')


setTimeout(() => {
  multiplexer = new Multiplexer(600, [device1, device2], (index) => {
    if(index < 300) {
      return [0, index]
    } else {
      if(index < 450)
        return [1, index - 300 + 150]
      else
        return [1, index - 300 - 150]
    }
  })
}, 2000)

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
      run: temporalEffectAction(t => _.range(0,600).map(i => '#000000'), 5000)
    },
    "white": {
      description: "WHITE +5s",
      run: temporalEffectAction(t => _.range(0,600).map(i => '#777777'), 5000)
    },
    "warro": {
      description: "Logo Pampa Warro +2s",
      run: temporalEffectAction(t => {
        let todoNaranja = _.range(0,600).map(i => '#FF9933')
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
    }
  })
});

server.listen(3000, '0.0.0.0')
