import { EventEmitter } from 'events';

export default class Socket {
    constructor(url, protocol) {
        this.emitter = new EventEmitter();
        // TODO: fix listener leaks instead of incrementing this
        this.emitter.setMaxListeners(100);

        this.connect(url, protocol)
    }

    connect(url, protocol) {
        const emitter = this.emitter;
        const socket = this;

        emitter.emit('connecting');

        const ws = new WebSocket(url, protocol);
        this.ws = ws;

        ws.onopen = function () {
            emitter.emit('connected')
        }

        ws.onclose = function (e) {
            console.log(e)
            emitter.emit('disconnect')
            setTimeout(socket.connect.bind(socket, url, protocol), 2000)
        }

        ws.onerror = function (e) {
            console.log(e)
            emitter.emit('error', e)
        }

        ws.onmessage = function (e) {
            const data = JSON.parse(e.data)
            emitter.emit(data.type, data.payload)
        }
    }

    on(event, listener) {
        this.emitter.on(event, listener)
    }

    emit(event, data) {
        const e = { type: event, payload: data }
        this.ws.send(JSON.stringify(e))
    }
}
