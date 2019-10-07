import { Client } from './utils/client';
import { ClientInterface } from './client-interface';
import { logEvent } from './utils/event-logger';

async function run(): Promise<void> {
  logEvent('CLIENT_START', { version: APP_VERSION });

  const client = new Client<ClientInterface>({
    host: SERVER_HOST,
    port: SERVER_PORT,
    file: 'client1',
  });
  await client.connect();
  await client.rpc();
  await client.close();
}

run();
