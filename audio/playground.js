const express = require('express');
const {Server} = require('http');
const path = require('path');
const SocketIO = require('socket.io');
const {AudioInput, listDevices} = require('./input');

const app = express();
const server = new Server(app);
const io = SocketIO(server);

const audio = new AudioInput({
  // profile : true,
  fakeAudio: true,
});
console.log('Audio devices:\n', listDevices());
audio.start();

app.get(
    '/',
    (req, res) => { res.sendFile(path.join(__dirname, 'static/index.html')); });
app.use('/static', express.static('static'));

io.on('connection', (socket) => {
  console.log('user connected');
  socket.on('disconnect', () => { console.log('user disconnected'); });
});

audio.on('audioframe', (frame) => { io.emit('audioframe', frame); });

const host = '0.0.0.0';
const port = 3000;
server.listen(
    port, host,
    () => {console.log(`Server is running in http://${host}:${port}/`)});
