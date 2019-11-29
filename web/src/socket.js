import ReconnectingWebSocket from 'reconnecting-websocket';
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

        emitter.emit('connecting');

        const ws = new ReconnectingWebSocket(url, protocol);
        this.ws = ws;

        ws.addEventListener('open', () => {
            emitter.emit('connected')
        })

        ws.addEventListener('close', () => {
            emitter.emit('disconnect')
        })

        ws.addEventListener('error', (e) => {
            emitter.emit('error', e)
        })

        ws.addEventListener('message', (e) => {
            const data = JSON.parse(e.data)
            emitter.emit(data.type, data.payload)
        })
    }

    on(event, listener) {
        this.emitter.on(event, listener)
    }

    emit(event, data) {
        if (this.ws.readyState != 1 /* OPEN */) {
            console.warn("websocket not ready when attempting to send message")
            return
        }
        const e = { type: event, payload: data }
        this.ws.send(JSON.stringify(e))
    }
}
