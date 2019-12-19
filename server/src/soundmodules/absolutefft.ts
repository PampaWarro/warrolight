import {EventEmitter} from 'events';
import FFT from 'fft.js';

// Computes the discrete Fourier transform (DFT) of the windowedSamples in each
// channel. The output is the absolute energy per FFT bin.
class AbsoluteFFTModule {
  _fft: FFT;
  _complexOutput: number[];
  constructor(config: any) {
    this._fft = new FFT(config.frameSize);
    this._complexOutput = this._fft.createComplexArray();
  }
  run(frame: any, emitter: EventEmitter) {
    frame.allChannels.forEach((channel: any) => {
      this._fft.realTransform(this._complexOutput, channel.windowedSamples);
      const out = new Float32Array(this._complexOutput.length / 4);
      for (let i = 0; i < out.length; i++) {
        out[i] = Math.sqrt(Math.pow(this._complexOutput[2 * i], 2) +
                           Math.pow(this._complexOutput[2 * i + 1], 2));
      }
      channel.absolutefft = out;
    });
  }
}

export const deps = [ "window" ];
export const init = (config: any) => new AbsoluteFFTModule(config);
