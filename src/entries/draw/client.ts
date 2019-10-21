import { Client } from '../../utils/client';
import { MethodInterface } from '../../games/draw/method-interface';

const implementation: MethodInterface = {
  draw: max => Math.round(Math.random() * max),
};

async function run(): Promise<void> {
  const client = new Client({
    module: implementation,
    host: SERVER_HOST,
    port: SERVER_PORT,
  });
  await client.connect();
  await client.rpc();
}

run();
