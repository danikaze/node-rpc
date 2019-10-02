// tslint:disable: no-console
import { Client } from './utils/client';

async function run(): Promise<void> {
  console.log(`[${APP_VERSION}] Starting client`);

  return new Promise<void>(async (resolve, reject) => {
    const client = new Client({ host: SERVER_HOST, port: SERVER_PORT });
    await client.connect();
    await client.sendData(`Testing client ${new Date().getTime()}`);
    await client.waitData();
    await client.waitData();
    await client.close();
  });
}

try {
  run();
} catch (e) {
  console.error('App error', e);
}
