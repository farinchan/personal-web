module.exports = {
  apps: [
    {
      name: 'personal-web',
      script: '.output/server/index.mjs',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        HOST: '0.0.0.0',
      },
    },
  ],
}
