import { Client } from '../../utils/client';
import { implementation } from '../../games/rogue/clients/ui';

async function run(): Promise<void> {
  const client = new Client({
    module: implementation,
    host: SERVER_HOST,
    port: SERVER_PORT,
    loggerInitOptions: {
      console: false,
      outputFile: 'logs/rogue/client/%DATE%_%TIME%.log',
    },
  });
  await client.connect();
  await client.rpc();
}

run();
