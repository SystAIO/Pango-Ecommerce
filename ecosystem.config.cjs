/** PM2 process definitions for the two services (run from the repo root). */
const frontendPort = process.env.PANGO_FRONTEND_PORT || "3100";
const backendPort = process.env.PANGO_BACKEND_PORT || "4100";

module.exports = {
  apps: [
    {
      name: "pango-backend",
      cwd: "./backend",
      script: "dist/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: backendPort,
        HOST: "127.0.0.1",
      },
    },
    {
      name: "pango-frontend",
      cwd: "./frontend",
      script: "./node_modules/next/dist/bin/next",
      args: `start -p ${frontendPort} -H 127.0.0.1`,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: frontendPort,
      },
    },
  ],
};
