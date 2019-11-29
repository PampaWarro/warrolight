import ReconnectingWebSocket from 'reconnecting-websocket';
import { EventEmitter } from 'events';

export default class Socket {
    emitter: EventEmitter
    ws: ReconnectingWebSocket

    constructor(url: string, protocol: string) {
        const emitter = new EventEmitter();
        this.emitter = emitter;

        // TODO: fix listener leaks instead of incrementing this
        emitter.setMaxListeners(100);

        const ws = new ReconnectingWebSocket(url, protocol);
        this.ws = ws;

        emitter.emit('connecting');


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

    on(event: string, listener: (...args: any[]) => void) {
        this.emitter.on(event, listener)
    }

    emit(event: string, data?: object | string | number) {
        if (this.ws.readyState !== 1 /* OPEN */) {
            console.warn("websocket not ready when attempting to send message")
            return
        }
        const e = { type: event, payload: data }
        this.ws.send(JSON.stringify(e))
    }
}
