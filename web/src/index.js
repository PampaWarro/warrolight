import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { Simulator } from './Simulator';
import { EventEmitter } from 'events';

if (!window.socket) {

    class Socket {
        constructor(url, protocols) {
            const ws = new WebSocket(url, protocols);
            this.ws = ws;

            const emitter = new EventEmitter();
            emitter.setMaxListeners(100);
            emitter.emit('connecting');

            this.emitter = emitter;

            ws.onopen = function () {
                emitter.emit('connected')
            }

            ws.onclose = function () {
                emitter.emit('disconnect')
            }

            ws.onerror = function (e) {
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
    
    // TODO: add reconnection
    const socket = new Socket("ws://localhost:8080/", "warro")

    window.socket = socket;
}

ReactDOM.render(<Simulator />, document.getElementById('root'));
