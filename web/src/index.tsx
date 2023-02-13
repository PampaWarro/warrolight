import React from "react";
import ReactDOM from 'react-dom/client';
import "bootstrap/dist/css/bootstrap.css";
import "jquery";
import "bootstrap/dist/js/bootstrap.bundle";
import "./index.scss";
import Root from "./Root";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "*",
    element: <Root />,
  },
]);


ReactDOM.createRoot(document.getElementById("root")!).render(
  <RouterProvider router={router} />
);

