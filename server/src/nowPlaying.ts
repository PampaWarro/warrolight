import { EventEmitter } from "events";
import net from "node:net";

const COMMANDS = [
  "get_title",
  "get_length",
  "get_time",
];

// Connects to the VLC Telnet interface.
// Usage: vlc -I telnet --telnet-password warro --random <music folder>
class NowPlaying extends EventEmitter {
  status: {
    title: string,
    length: number,
    time: number,
    progress: number,
  };
  client: net.Socket;
  password: string;
  pollIntervalId: NodeJS.Timer;
  gotPrompt: boolean;
  pendingCommands: string[];
  connected: boolean;

  constructor() {
    super();
    this.password = "warro";
    this.reset();
  }

  currentStatus() {
    return this.status;
  }

  private reset() {
    this.status = { title: null, length: null, time: null, progress: null };
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
            if (line === ">") {
              this.gotPrompt = true;
              continue;  // Ignore prompt.
            }
            if (!this.gotPrompt) {
              continue; // Ignore all data before prompt.
            }
            const command = this.pendingCommands.shift();
            switch (command) {
              case "get_title":
                this.status.title = line;
                break;
              case "get_length":
                this.status.length = parseInt(line, 10);
                this.updateProgress();
                break;
              case "get_time":
                this.status.time = parseInt(line, 10);
                this.updateProgress();
                break;
              default:
                throw `Unexpected command ${command}`
            }
          }
          return true;
        },
      },
    }, () => {
      console.log("VLC connected.");
      this.connected = true;
      this.client.write(`${this.password}\n`);
      this.pollIntervalId = setInterval(this.poll.bind(this), 250);
    });
    this.client.on("error", (error) => {
      // console.log("error", error);
    });
    this.client.on("close", () => {
      if (this.connected) {
        console.log("VLC disconnected.");
      }
      this.client = null;
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
      this.reset();
      setTimeout(this.connect.bind(this), 1000);
    });
  }


  private updateProgress() {
    const time = this.status.time;
    const length = this.status.length;
    if (length && time != null) {
      this.status.progress = time / length;
    } else {
      this.status.progress = time;
    }
  }

  private poll() {
    for (let command of COMMANDS) {
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