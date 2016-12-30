import { default as Service } from './systems/service'

import { default as Api } from './systems/api'

import { default as Db } from './systems/db'

const { io, socket, app } = Service

const db = new Db()

io.on('message', (ctx, data) => {
  if (data.action === 'something') {
    // Action on it
  }
})

const api = new Api()
api.setup(db, app)

Service.app.listen(3000)
