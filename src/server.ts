// tslint:disable: no-console
import { Server, ClientData } from './utils/server';
import { ClientInterface } from './client-interface';

async function run(): Promise<void> {
  console.log(`[${APP_VERSION}] Creating server`);

  const server = new GameServer({
    port: SERVER_PORT,
  });
  server.start();
}

class GameServer extends Server<ClientInterface> {
  protected async logic(client: ClientData): Promise<void> {
    try {
      await this.callRpcMethod(client, 'getDate');
      await this.callRpcMethod(client, 'add', [1, 2]);
      await this.callRpcMethod(client, 'box', ['text']);
    } catch (e) {
      console.log('RPC method timeout: ', e);
    }
  }
}

try {
  run();
} catch (e) {
  console.error('App error', e);
}
