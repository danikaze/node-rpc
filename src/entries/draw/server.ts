import { DrawGameServer } from '../../games/draw/server';

async function run(): Promise<void> {
  const server = new DrawGameServer({
    port: SERVER_PORT,
    loggerInitOptions: {
      outputFile: 'logs/draw/server/%DATE%_%TIME%.log',
    },
  });
  server.start();
}

run();
