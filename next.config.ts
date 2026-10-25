import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagen Docker mínima: copia solo lo necesario para correr el servidor.
  output: "standalone",
  poweredByHeader: false,
  // Túneles de Cloudflare (quick tunnels) en desarrollo: sin esto Next bloquea el WebSocket de HMR.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // Permite compilar a otra carpeta (pruebas E2E) sin chocar con un servidor de desarrollo abierto.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
