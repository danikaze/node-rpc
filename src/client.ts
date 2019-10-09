import { Client } from './utils/client';
import { logEvent } from './utils/event-logger';

async function run(): Promise<void> {
  logEvent('CLIENT_START', { version: APP_VERSION });

  const client = new Client({
    host: SERVER_HOST,
    port: SERVER_PORT,
    file: 'draw',
  });
  await client.connect();
  await client.rpc();
}

run();
