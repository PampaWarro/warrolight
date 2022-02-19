const cp = require('child_process');
const EventEmitter = require('events');
const path = require('path');
const { decodeMultiStream } = require('@msgpack/msgpack');
const pythonFromEnv = process.env.PYTHONPATH;
const venvPath =
    cp.execSync('pipenv --venv', {encoding : 'utf8', cwd : __dirname}).trim();
const pythonBinaryFolder = /^win/.test(process.platform) ? 'Scripts' : 'bin';

const python = pythonFromEnv ? pythonFromEnv : path.join(venvPath, pythonBinaryFolder, 'python');
const mainScript = path.join(__dirname, 'main.py')

class AudioInput extends EventEmitter {
  constructor(options) {
    super();
    // this._sampleRate = options._sampleRate || 48000;
    const deviceIndex = options.deviceIndex || null;
    const profile = options.profile || null;
    this._args = [ '-u' ];
    if (!profile) {
      this._args.push(mainScript);
    } else {
      const profilePath = options.profilePath || 'audioprofile.pstats';
      this._args.push('-m', 'cProfile', '-o', profilePath, mainScript);
    }
    if (deviceIndex) {
      this._args.push('-d', deviceIndex.toString());
    }
    this._subprocess = null;
    this._stopping = false;
  }

  start() {
    if (this._subprocess) {
      throw 'AudioInput already started';
    }
    this._stopping = false;
    this._subprocess = cp.spawn(python, this._args, {
      stdio : [ 'inherit', 'pipe', 'inherit' ],
    });

    (async () => {
      for await (const frame of decodeMultiStream(this._subprocess.stdout)) {
        this.emit('audioframe', frame);
      }
    })();

    this.emit('start');
    this._subprocess.on('exit', (code, signal) => {
      if (!that._stopping) {
        let msg;
        if (code !== null) {
          msg = `Audio subprocess exited with code ${code}.`;
        } else {
          msg = `Audio subprocess terminated with signal ${signal}.`;
        }
        this.emit('error', msg);
      }
      this._subprocess = null;
      this.emit('stop');
    });
  }

  stop() {
    this._stopping = true;
    if (!this._subprocess.kill()) {
      console.error('Failed to kill audio subprocess.');
    } else {
      this._subprocess = null;
    }
  }
}

function listDevices() {
  const command = [ python, mainScript, '-l' ].join(' ')
  return cp.execSync(command, {encoding : 'utf8'}).trim();
}

module.exports = {
  AudioInput,
  listDevices,
}
