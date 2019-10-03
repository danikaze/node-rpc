const packageJson = require('./package.json');

module.exports = {
  APP_VERSION: packageJson.version,
  SERVER_HOST: 'localhost',
  SERVER_PORT: 10101,
  RPC_FOLDER: './rpc/', // requires final '/'
};
