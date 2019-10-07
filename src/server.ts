// tslint:disable: no-console
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
  protected static nPlayersRequired: number = 2;
  protected static nTurns: number = 3;
  protected readonly scores: { [clientId: string]: number } = {};

  protected async onClientConnection(client: ClientData): Promise<void> {
    const nPlayers = Object.keys(this.connections).length;
    console.log(`Connected player ${nPlayers}/${GameServer.nPlayersRequired}`);
    this.scores[client.id] = 0;

    if (nPlayers === GameServer.nPlayersRequired) {
      this.startGame();
    }
  }

  protected async startGame(): Promise<void> {
    for (let i = 0; i < GameServer.nTurns; i++) {
      console.log(`Turn ${i + 1}/${GameServer.nTurns}`);
      await this.turn();
    }

    this.endGame();
  }

  protected async endGame(): Promise<void> {
    Object.keys(this.connections).forEach(async clientId => {
      console.log(`Client ${clientId}: ${this.scores[clientId]} points`);
      await this.closeClient(clientId);
    });
  }

  protected async turn(): Promise<void> {
    const ids = Object.keys(this.connections);
    this.scores[ids[0]] += await this.callRpcMethod<number>(ids[0], 'draw');
    this.scores[ids[1]] += await this.callRpcMethod<number>(ids[1], 'draw');
  }
}

run();
