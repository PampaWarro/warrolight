const WebSocket = require("ws");
const { startMic } = require("./mic");
const soundAnalyzer = require("./soundAnalyzer");
const { MicConfig, startSoundListener } = require("./sound");
const LightsService = require("./LightsService");

exports.startServer = function startServer(controller) {
  startMic();

  const micConfig = new MicConfig({
    sendingMicData: true,
    metric: "Rms"
  });

  const sound = startSoundListener(soundAnalyzer, micConfig);

  const wss = new WebSocket.Server({ port: 8080 });

  wss.on("connection", function connection(ws) {
    function send(event, data) {
      ws.send(JSON.stringify([event, data]));
    }

    // Each service handles a single client, consider using broadcasting
    // to send data to all connected clients, then let clients takeover
    // between themselves to avoid holding too many connections open.
    const service = new LightsService(controller, micConfig, send);

    sound.setListener(lastVolumes => send("micSample", lastVolumes));

    ws.on("message", function incoming(message) {
      const [event, data] = JSON.parse(message);

      switch (event) {
        case "setMicDataConfig":
          service.setMicDataConfig(data);
          return;
        case "startSamplingLights":
          service.startSamplingLights(data);
          return;
        case "stopSamplingLights":
          service.stopSamplingLights(data);
          return;
        case "restartProgram":
          service.restartProgram(data);
          return;
        case "updateConfigParam":
          service.updateConfigParam(data);
          return;
        case "setPreset":
          service.setPreset(data);
          return;
        case "setCurrentProgram":
          service.setCurrentProgram(data);
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
