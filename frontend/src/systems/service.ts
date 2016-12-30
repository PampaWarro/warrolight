import * as koa from 'koa'

const Webpack = require('webpack')
const { devMiddleware, hotMiddleware } = require('koa-webpack-middleware')
const Body = require('koa-body')
const Socket = require('koa-socket')
const Logger = require('koa-logger')
const Route = require('koa-route')
const Router = require('koa-router')
const rewrite = require('koa-rewrite')
const mount = require('koa-mount')
require('babel-polyfill')

const webpackConfig = require('../web/webpack.config')

const app = new koa()
app.use(Logger())
app.use(Body())
;
['block', 'claim', 'profile', 'settings', 'search', 'explorer',
 'portfolio', 'main.js'].forEach((name: string) => {
    app.use(rewrite(new RegExp('^\/' + name + '(.*)'), '/assets/'))
})
app.use(rewrite(new RegExp('^\/?$'), '/assets/'))

const compiler = new Webpack(webpackConfig)
const dev = devMiddleware(compiler, {
  noinfo: true,
  publicPath: '/',
  headers: {
    'content-type': 'text/html'
  },
  stats: {
    colors: true
  }
})
const hot = hotMiddleware(compiler, {})
const webpackApp = new koa()
webpackApp.use(async(ctx, next) => {
  await next()
  if (ctx.response.get('Content-Type') === 'application/octet-stream') {
    ctx.response.set('content-type', 'text/html')
  }
})
webpackApp.use(Body())
webpackApp.use(dev)
webpackApp.use(hot)

app.use(mount('/assets', webpackApp))

const socket = new Socket()
socket.attach(app)

socket.on('connection', (ctx: Object) => {
  console.log('client connected')
})

export default {
  app,
  compiler,
  io: app['io'],
  socket: app['_io']
}
