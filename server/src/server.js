const WebSocket = require("ws");
const LightsService = require("./LightsService");

exports.startServer = function startServer(controller) {
  const wss = new WebSocket.Server({ port: 8080 });

  // Broadcast to all connected clients
  function broadcast(event, data) {
    const message = JSON.stringify([event, data]);
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  let liveRemoteControls = 0;

  const logConnectedClients = () => console.log(`There are ${liveRemoteControls} connected remote controls`.cyan);


  wss.on("connection", function connection(ws) {
    // Send to itself
    liveRemoteControls++;
    logConnectedClients();

    function send(event, data) {
      const message = JSON.stringify([event, data]);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
    }

    const service = new LightsService(controller, send, broadcast);

    ws.on("message", function incoming(message) {
      const [event, data] = JSON.parse(message);

      if (event in service) {
        service[event](data);
      } else {
        console.warn(`Unknown event name: ${event}`);
      }
    });

    service.connect();

    ws.on("close", () => {
      service.disconnect();
      liveRemoteControls--;
      logConnectedClients();
    });
  });
};
