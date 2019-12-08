const WebSocket = require("ws");
const LightsService = require("./LightsService");

exports.startServer = function startServer(controller) {
  const wss = new WebSocket.Server({ port: 8080 });

  // Broadcast to all connected clients
  function send(event, data) {
    const message = JSON.stringify([event, data]);
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  const service = new LightsService(controller, send);

  wss.on("connection", function connection(ws) {

    ws.on("message", function incoming(message) {
      const [event, data] = JSON.parse(message);

      if (event in service) {
        service[event](data);
      } else {
        console.warn(`Unknown event name: ${event}`);
      }
    });

    service.connect();

    ws.on("disconnect", () => {
      service.disconnect();
    });
  });
};
