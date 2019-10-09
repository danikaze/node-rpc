import { logEvent } from './utils/event-logger';
import { DrawGameServer } from './games/draw/server';

async function run(): Promise<void> {
  logEvent('SERVER_START', { version: APP_VERSION });

  const server = new DrawGameServer({
    port: SERVER_PORT,
  });
  server.start();
}

run();
