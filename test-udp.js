const dgram = require('dgram');

const PORT = 6666;
const HOST = '192.168.0.5';

// var message = new Buffer('My KungFu is Good!');


//
const server = dgram.createSocket('udp4');

server.on('listening', function () {
  const address = server.address();
  console.log('UDP Server listening on ' + address.address + ":" + address.port);
});

server.on('message', function (message, remote) {
  console.log(remote.address + ':' + remote.port + ' - ' + message);

  //const client = dgram.createSocket('udp4');
  setInterval(() => {
    let responseMsg = new Buffer("000111222333444555666777888999");
    server.send(responseMsg, 0, responseMsg.length, remote.port, remote.address, function (err, bytes) {
      if (err) throw err;
      console.log('UDP message sent to ' + remote.address + ':' + remote.port);
    })
  }, 1000)
  //client.close();
});



server.bind(PORT);