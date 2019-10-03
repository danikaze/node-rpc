// tslint:disable: no-console
import { Client } from './utils/client';
import { ClientInterface } from './client-interface';

async function run(): Promise<void> {
  console.log(`[${APP_VERSION}] Starting client`);

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
