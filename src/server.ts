// tslint:disable: no-console
import { Server } from './utils/server';

async function run(): Promise<void> {
  console.log(`[${APP_VERSION}] Creating server`);

  const server = new Server({
    port: SERVER_PORT,
  });
  server.start();
}

try {
  run();
} catch (e) {
  console.error('App error', e);
}
