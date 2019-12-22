import {fork, ChildProcess} from 'child_process';
import {soundEmitter} from './SoundEmitter';

let process: ChildProcess = null;

export function startMic() {
  if (process) {
    throw new Error("mic already started!");
  }
  process = fork(`${__dirname}/micProcess.ts`);
  process.on('close', (code) => {
    console.log(`child mic process exited with code ${code}`);
    process = null;
  });
  let lastAudioTime: number = null;
  process.on('message', (message) => {
    const [id, contents] = message;
    soundEmitter.emit(id, contents);
    if (id == 'processedaudioframe') {
      let now = Date.now();
      if (lastAudioTime) {
        let dt = now - lastAudioTime;
        // console.log(dt);
      }
      lastAudioTime = now;
    }
  });
}
