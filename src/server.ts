import { DrawGameServer } from './games/draw/server';

async function run(): Promise<void> {
  const server = new DrawGameServer({
    port: SERVER_PORT,
  });
  server.start();
}

run();
