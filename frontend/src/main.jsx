import React from "react";
import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

function applySystemTheme() {
  if (typeof window === "undefined") return;
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const updateTheme = () => {
    document.documentElement.setAttribute("data-bs-theme", mediaQuery.matches ? "dark" : "light");
  };

  updateTheme();
  mediaQuery.addEventListener("change", updateTheme);
}

applySystemTheme();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.VITE_ROUTER_BASENAME || "/"}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
