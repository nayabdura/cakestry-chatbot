module.exports = {
  apps: [
    {
      name: 'cakestry',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: '/var/www/cakestry',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
      },
    },
  ],
};
