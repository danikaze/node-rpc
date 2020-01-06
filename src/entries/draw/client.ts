import { Client } from '../../utils/client';
import { implementation } from '../../games/draw/client';

async function run(): Promise<void> {
  const client = new Client({
    module: implementation,
    host: SERVER_HOST,
    port: SERVER_PORT,
    loggerInitOptions: {
      outputFile: 'logs/draw/client/%DATE%_%TIME%.log',
    },
  });
  await client.connect();
  await client.rpc();
}

run();
