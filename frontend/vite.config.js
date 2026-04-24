import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const routerBasename = process.env.VITE_ROUTER_BASENAME || "/";
const base =
  routerBasename === "/"
    ? "/"
    : routerBasename.endsWith("/")
      ? routerBasename
      : `${routerBasename}/`;

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173
  }
});
