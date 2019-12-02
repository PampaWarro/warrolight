const WebSocket = require("ws");
const { startMic } = require("./mic");
const soundEmitter = require("./soundEmitter");
const { MicConfig, startSoundListener } = require("./sound");
const LightsService = require("./LightsService");

exports.startServer = function startServer(controller) {
  startMic();

  const micConfig = new MicConfig({
    sendingMicData: true,
    metric: "Rms"
  });

  const sound = startSoundListener(soundEmitter, micConfig);

  const wss = new WebSocket.Server({ port: 8080 });

  wss.on("connection", function connection(ws) {
    function send(type, payload) {
      ws.send(JSON.stringify({ type, payload }));
    }

    // Each service handles a single client, consider using broadcasting
    // to send data to all connected clients, then let clients takeover
    // between themselves to avoid holding too many connections open.
    const service = new LightsService(controller, micConfig, send);

    sound.setListener(lastVolumes => send("micSample", lastVolumes));

    ws.on("message", function incoming(message) {
      const { type, payload } = JSON.parse(message);

      switch (type) {
        case "setMicDataConfig":
          service.setMicDataConfig(payload);
          return;
        case "startSamplingLights":
          service.startSamplingLights(payload);
          return;
        case "stopSamplingLights":
          service.stopSamplingLights(payload);
          return;
        case "restartProgram":
          service.restartProgram(payload);
          return;
        case "updateConfigParam":
          service.updateConfigParam(payload);
          return;
        case "setPreset":
          service.setPreset(payload);
          return;
        case "setCurrentProgram":
          service.setCurrentProgram(payload);
          return;
      }
    });

    service.connect();

    ws.on("disconnect", () => {
      sound.clearListener();
      service.disconnect();
    });
  });
};
