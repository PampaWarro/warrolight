import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import Socket from './socket';
import { App } from './App';

if (!window.socket) {
    window.socket = new Socket("ws://localhost:8080/", "warro");
}

ReactDOM.render(<App />, document.getElementById('root'));
