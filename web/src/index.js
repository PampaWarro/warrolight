import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Socket from './socket';
import { Simulator } from './Simulator';

if (!window.socket) {
    window.socket = new Socket("ws://localhost:8080/", "warro");
}

ReactDOM.render(<Simulator />, document.getElementById('root'));
