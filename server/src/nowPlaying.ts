const logger = require("pino")(require("pino-pretty")());
import _ from "lodash";
import { EventEmitter } from "events";
import { DOMParser } from "@xmldom/xmldom";
import xpath from "xpath";

// Connects to the VLC HTTP XML API.
// Usage without GUI: vlc -I http --http-password warro --http-port 9099 --random --loop <music folder>
// Usage with GUI: vlc --extraintf http --http-password warro --http-port 9099 --random --loop <music folder>
class NowPlaying extends EventEmitter {
  status: {
    title: string,
    length: number,
    time: number,
    playing: boolean,
    lastTimeUpdate: number,
  };
  port: number;
  password: string;
  pollIntervalId: NodeJS.Timer = null;
  connected: boolean = false;
  headers: Headers;
  url: URL;

  constructor() {
    super();
    this.port = 9099;
    this.password = "warro";
    this.url = new URL(`http://127.0.0.1:${this.port}/requests/status.xml`);
    this.headers = new Headers();
    this.headers.set("Authorization", "Basic " + Buffer.from(":" + this.password).toString("base64"));
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
  }

  private startPolling() {
    if (this.pollIntervalId) {
      throw "Already started";
    }
    this.pollIntervalId = setInterval(this.poll.bind(this), 250);
  }

  private async poll() {
    let response;
    try {
      response = await fetch(this.url, { headers: this.headers });
      if (!this.connected) {
        logger.info("VLC connected.");
        this.connected = true;
      }
    } catch {
      if (this.connected) {
        logger.warn("VLC disconnected.");
        this.connected = false;
      }
      this.reset();
      return;
    }
    try {
      const text = await response.text();
      const data = new DOMParser().parseFromString(text, "text/xml")
      const state = (xpath.select("//state/text()", data, true) as Attr).textContent;
      const title = state == "stopped" ? null : (xpath.select("//information/category[@name='meta']/info[@name='filename']/text()", data, true) as Attr).textContent;
      if (title != this.status.title) {
        this.emit("trackchange", title);
      }
      this.status.title = title;
      const length = parseInt((xpath.select("//length/text()", data, true) as Attr).textContent, 10);
      this.status.length = length;
      const time = parseInt((xpath.select("//time/text()", data, true) as Attr).textContent, 10);
      if (time != this.status.time) {
        this.status.lastTimeUpdate = Date.now();
      }
      this.status.time = time;
      this.status.playing = state == "playing";
    } catch (e) {
      logger.error(e);
    }
  }

  public start() {
    this.startPolling();
  }

  public stop() {
    if (!this.pollIntervalId) {
      throw "Not connected";
    }
    clearInterval(this.pollIntervalId);
    this.pollIntervalId = null;
  }
}

module.exports = new NowPlaying();
