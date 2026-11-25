// Prints every controller that talks on the WarroLight ports: who (address),
// on which port, and what it says. YEAH = waiting for frames, PERF = getting
// frames (the number is its frames per second). One line per sender every 5 s.
const dgram = require("dgram");

const PORTS = [6677, 8886, 8887, 8888, 8889];
const lastPrinted = new Map();

for (const port of PORTS) {
  const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
  socket.on("message", (message, remote) => {
    const text = message.toString("latin1", 0, 12).replace(/[^\x20-\x7e]/g, ".");
    const key = `${port} ${remote.address}:${remote.port} ${text.slice(0, 4)}`;
    const now = Date.now();
    if (now - (lastPrinted.get(key) || 0) < 5000) return;
    lastPrinted.set(key, now);
    const time = new Date().toTimeString().slice(0, 8);
    console.log(`${time} port ${port} from ${remote.address}:${remote.port} ${message.length}B "${text}"`);
  });
  socket.on("error", (error) => console.log(`port ${port}: ${error.message}`));
  socket.bind(port);
}
