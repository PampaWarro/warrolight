Promise = require('bluebird')
import * as IORedis from 'ioredis'

export default class Db {
  redis: IORedis.Redis

  constructor() {
    this.redis = new IORedis()
  }

  makeId(key) {
    return 'res-' + key
  }

  async getResource(id: string) {
    const res = await this.redis.get(this.makeId(id)) 
    return JSON.parse(res)
  }

  async saveResource(id: string, object) {
    const key = this.makeId(id)
    await this.redis.sadd('resources', key)
    await this.redis.set(this.makeId(id), JSON.stringify(object))
  }

  async getAllResources() {
    const resources = this.redis.smembers('resources')
    return await Promise.all(resources.map(id => {
      return this.getResource(id)
    }))
  }
}
