import { default as Db } from './db'
const uuid  = require('uuid')
const Router = require('koa-router')

export default class Api {
  api

  constructor() {
    this.api = Router({
      prefix: '/api'
    })
  }

  setup(db, app) {
    this.setupRoutes(db)
    this.bindToApp(app)
  }

  bindToApp(app) {
    app.use(this.api.routes())
    app.use(this.api.allowedMethods())
  }

  setupRoutes(db: Db) {
    this.api
      .get('/resource/:id', async (ctx, next) => {
        const resource = await db.getResource(ctx.params.id)
        ctx.body = JSON.stringify(resource)
      })
      .post('/resource', async (ctx, next) => {
        const data = JSON.parse(ctx.request.body)
        const id: string = uuid.v4()
        data.id = id
        const resource = await db.saveResource(id, data)
        ctx.body = JSON.stringify(resource)
      })
      .get('/all_claims', async (ctx, next) => {
        ctx.body = JSON.stringify(await db.getAllResources())
      })
  }
}
