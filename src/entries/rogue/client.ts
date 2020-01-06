import { Client } from '../../utils/client';
import { implementation } from '../../games/rogue/clients/wanderer-pacifist';

async function run(): Promise<void> {
  const client = new Client({
    module: implementation,
    host: SERVER_HOST,
    port: SERVER_PORT,
    loggerInitOptions: {
      outputFile: 'logs/rogue/client/%DATE%_%TIME%.log',
    },
  });
  await client.connect();
  await client.rpc();
}

run();
