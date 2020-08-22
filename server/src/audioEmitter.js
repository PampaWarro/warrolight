const {EventEmitter} = require('events');

class AudioEmitter extends EventEmitter {
  constructor(){
    super();
    this.currentFrame = null;
    this.ready = false;
  }
  
  
  updateFrame(frame) {
    this.currentFrame = frame;
    this.ready = true;
    this.emit('audioframe', frame);
  }
}

const audioEmitter = new AudioEmitter();

module.exports = audioEmitter;
