import { Client } from './utils/client';
import { logEvent } from './utils/event-logger';

async function run(): Promise<void> {
  logEvent('CLIENT_START', { version: APP_VERSION });

  const client = new Client({
    file: getClientFilename(),
    host: SERVER_HOST,
    port: SERVER_PORT,
  });
  await client.connect();
  await client.rpc();
}

function getClientFilename(): string {
  const defaultFileName = 'draw';
  const paramName = 'file';
  const findStr = `--${paramName}=`;
  const param = process.argv.filter(arg => arg.indexOf(findStr) !== -1)[0];
  if (!param) {
    return defaultFileName;
  }
  return param.substr(findStr.length);
}

run();
