import { Server, ClientData } from './utils/server';
import { ClientInterface } from './client-interface';
import { logEvent } from './utils/event-logger';

async function run(): Promise<void> {
  logEvent('SERVER_START', { version: APP_VERSION });

  const server = new GameServer({
    port: SERVER_PORT,
  });
  server.start();
}

class GameServer extends Server<ClientInterface> {
  protected async logic(client: ClientData): Promise<void> {
    await this.callRpcMethod(client, 'getDate');
    await this.callRpcMethod(client, 'add', [1, 2]);
    await this.callRpcMethod(client, 'box', ['text']);
  }
}

run();
