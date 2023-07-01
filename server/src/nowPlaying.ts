const logger = require("pino")(require('pino-pretty')());
import _ from "lodash";
import net from "node:net";
import { EventEmitter } from "events";

// Connects to the VLC Telnet interface.
// Usage: vlc -I telnet --telnet-password warro --random --loop <music folder>
class NowPlaying extends EventEmitter {
  status: {
    title: string,
    length: number,
    time: number,
    playing: boolean,
    lastTimeUpdate: number,
    [key: string]: any,
  };
  client: net.Socket;
  password: string;
  pollIntervalId: NodeJS.Timer;
  gotPrompt: boolean;
  pendingCommands: string[];
  connected: boolean;

  COMMANDS: { [key: string]: { fieldName: string, transform: (x: string) => any } } = {
    "get_title": {
      fieldName: "title",
      transform: (value: string) => value,
    },
    "get_length": {
      fieldName: "length",
      transform: (value: string) => parseInt(value, 10),
    },
    "get_time": {
      fieldName: "time",
      transform: (value: string) => parseInt(value, 10),
    },
    "status": {
      fieldName: "playing",
      transform: (value: string) => value === "( state playing )"
    },
  };

  constructor() {
    super();
    this.password = "warro";
    this.reset();
  }

  currentStatus() {
    const playing = this.status.playing;
    const delta = playing ? (Date.now() - this.status.lastTimeUpdate) / 1000 : 0;
    const time = this.status.time + delta;
    const length = this.status.length;
    const progress = length ? _.clamp(time / this.status.length, 0, 1) : 0;
    return {
      title: this.status.title,
      length,
      time,
      progress,
      playing,
    }
  }

  private reset() {
    this.status = { title: null, length: null, time: null, playing: false, lastTimeUpdate: null };
    this.gotPrompt = false;
    this.pendingCommands = [];
    this.connected = false;
  }

  private connect() {
    if (this.client) {
      throw "Already connected";
    }
    this.client = net.connect({
      port: 4212,
      onread: {
        buffer: Buffer.alloc(4 * 1024),
        callback: (nread, buf) => {
          const lines = buf.slice(0, nread).toString().trim().split("\n").map(s => s.trim());
          for (let line of lines) {
            if (line.startsWith("(") && !line.startsWith("( state")) {
              continue; // Ignore non-state status lines.
            }
            if (line === ">") {
              this.gotPrompt = true;
              continue;  // Ignore prompt.
            }
            if (!this.gotPrompt) {
              continue; // Ignore all data before prompt.
            }
            const command = this.pendingCommands.shift();
            const { fieldName, transform } = this.COMMANDS[command];
            const value = transform(line);
            if ((fieldName === "time" && this.status.time != value) || (fieldName === "playing" && !value)) {
              this.status.lastTimeUpdate = Date.now();
            }
            if (fieldName === "title" && this.status.title != value) {
              this.emit("trackchange", line);
            }
            this.status[fieldName] = value;
          }
          return true;
        },
      },
    }, () => {
      logger.info("VLC connected.");
      this.connected = true;
      this.client.write(`${this.password}\n`);
      this.pollIntervalId = setInterval(this.poll.bind(this), 250);
    });
    this.client.on("error", () => {
      // Need to handle and ignore error to prevent program from crashing.
    });
    this.client.on("close", () => {
      if (this.connected) {
        logger.info("VLC disconnected.");
      }
      this.client = null;
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
      this.reset();
      setTimeout(this.connect.bind(this), 1000);
    });
  }

  private poll() {
    for (let command in this.COMMANDS) {
      this.client.write(`${command}\n`);
      this.pendingCommands.push(command);
    }
  }

  public start() {
    this.connect();
  }

  public stop() {
    if (!this.client || !this.pollIntervalId) {
      throw "Not connected";
    }
    this.client.destroy();
  }
}

module.exports = new NowPlaying();