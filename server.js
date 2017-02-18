const _ = require('lodash');
const express = require('express');

const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);
const now = require('performance-now');

const path = require('path');
const webpack = require('webpack');
const config = require('./webpack.config');

const compiler = webpack(config);

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: "/"
}));
app.use(require('webpack-hot-middleware')(compiler));

app.get('*', function (req, res, next) {
  var filename = path.join(compiler.outputPath,'index.html');
  compiler.outputFileSystem.readFile(filename, function(err, result){
    if (err) {
      return next(err);
    }
    res.set('content-type','text/html');
    res.send(result);
    res.end();
  });
})

server.listen(3001, '0.0.0.0')
