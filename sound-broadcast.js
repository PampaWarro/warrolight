const EventEmitter = require('events');

class AudioEmitter extends EventEmitter {

}

module.exports = new AudioEmitter();

module.exports.on("sound", (value) => {
  // console.log("Received sound ", value)
})
