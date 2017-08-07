const EventEmitter = require('events');

class SoundAmplitude extends EventEmitter {

}

module.exports = new SoundAmplitude();

module.exports.on("sound", (value) => {
  // console.log("Received sound ", value)
})