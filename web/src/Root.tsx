import * as React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { API } from "./api";
import { App } from "./App";
import { DJButtons } from "./DJButtons";

export default class Root extends React.Component{
    render(){
        const api = new API();
        return (
            <Routes>
                <Route index element={<App api={api}/>} />
                <Route path="wand" element={<Wand />} />
                <Route path="buttons" element={<DJButtons api={api}/>} />
                <Route path="*" element={<NoMatch />} />
            </Routes>
        );
    }
}

function Wand() {
  return (
    <div>
      <h2>Wand</h2>
    </div>
  );
}

function NoMatch() {
  return (
    <div>
      <h2>Nothing to see here!</h2>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </div>
  );
}
