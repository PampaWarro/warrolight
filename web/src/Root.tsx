import * as React from "react";
import { Routes, Route, Link } from "react-router-dom";
import { App } from "./App";

export default function Root() {
  return (
    <Routes>
      <Route index element={<App />} />
      <Route path="wand" element={<Wand />} />
      <Route path="buttons" element={<Buttons />} />
      <Route path="*" element={<NoMatch />} />
    </Routes>
  );
}

function Wand() {
  return (
    <div>
      <h2>Wand</h2>
    </div>
  );
}

function Buttons() {
  return (
    <div>
      <h2>Buttons</h2>
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
