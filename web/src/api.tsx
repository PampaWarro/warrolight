import { MicConfig, ConfigValue } from "./types";
import { EventEmitter } from "events";
import ReconnectingWebSocket from "reconnecting-websocket";

export class API extends EventEmitter {
  ws: ReconnectingWebSocket;

  constructor() {
    super();

    // Grab host from current page, so that it works from other devices
    const ws = new ReconnectingWebSocket(`ws://${window.location.hostname}:8080/`, "warro");
    this.emit("connecting");

    ws.addEventListener("open", () => {
      this.emit("connect");
    });

    ws.addEventListener("close", () => {
      this.emit("disconnect");
    });

    ws.addEventListener("message", e => {
      const [event, data] = JSON.parse(e.data);
      this.emit(event, data);
    });

    this.ws = ws;
  }

  setCurrentProgram(name: string) {
    this.send("setCurrentProgram", name);
  }

  setPreset(preset: string) {
    this.send("setPreset", preset);
  }

  savePreset(programName: string, presetName: string, currentConfig: { [param: string]: ConfigValue }) {
    this.send("savePreset", {programName, presetName, currentConfig});
  }

  deletePreset(programName: string, presetName: string) {
    this.send("deletePreset", {programName, presetName});
  }

  restartProgram() {
    this.send("restartProgram");
  }

  updateConfigParam(config: { [name: string]: ConfigValue }) {
    this.send("updateConfigParam", config);
  }

  setMicConfig(config: Partial<MicConfig>) {
    this.send("setMicConfig", config);
  }

  startSamplingLights() {
    this.send("startSamplingLights");
  }

  stopSamplingLights() {
    this.send("stopSamplingLights");
  }

  private send(event: string, data?: object | string | number) {
    if (this.ws.readyState !== 1 /* OPEN */) {
      console.warn("websocket not ready when attempting to send message");
      return;
    }
    this.ws.send(JSON.stringify([event, data]));
  }
}
