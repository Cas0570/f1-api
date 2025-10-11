// eslint-disable-next-line no-undef
module.exports = {
  apps: [
    {
      name: 'f1-api',
      script: './dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
