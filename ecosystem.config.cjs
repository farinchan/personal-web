module.exports = {
  apps: [
    {
      name: 'personal-web',
      script: '.output/server/index.mjs',
      interpreter_args: '--env-file=.env',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
      },
    },
  ],
}
