module.exports = {
  apps: [
    {
      name: 'polybot',
      cwd: '/opt/polyedge-lite/current',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
