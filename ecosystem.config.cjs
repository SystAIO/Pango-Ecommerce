/** PM2 process definitions for the two services (run from the repo root). */
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
        PORT: 4000,
      },
    },
    {
      name: "pango-frontend",
      cwd: "./frontend",
      script: "./node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
