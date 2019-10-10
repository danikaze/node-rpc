import { MethodInterface } from './method-interface';
import { TurnBasedGameServer } from '../turn-server';
import { ClientData, ServerOptions } from '../../utils/server';

export class DrawGameServer extends TurnBasedGameServer<MethodInterface> {
  private static readonly gameTurns: number = 3;
  private static readonly nPlayersRequired: number = 2;
  private static readonly maxDraw: number = 100;

  private readonly scores: { [clientId: string]: number } = {};
  private turnNumber: number = 0;

  constructor(options: ServerOptions) {
    super({
      ...options,
      nPlayersRequired: 2,
    });
  }

  protected hasGameEnded(): boolean {
    return this.turnNumber === DrawGameServer.gameTurns * DrawGameServer.nPlayersRequired;
  }

  protected initPlayer(client: ClientData): Promise<void> {
    this.scores[client.id] = 0;
    return Promise.resolve();
  }

  protected async playerAction(client: ClientData): Promise<void> {
    this.turnNumber++;

    const draw = await this.callRpcMethod<number>(client.id, 'draw', [DrawGameServer.maxDraw]);
    this.scores[client.id] += Math.floor(draw) % (DrawGameServer.maxDraw + 1);
  }

  protected async endGame(): Promise<void> {
    // tslint:disable: no-console
    console.log('********************');
    this.playerIds.forEach(clientId => {
      console.log(`* Client ${clientId}: ${this.scores[clientId]} points`);
    });
    console.log('********************');

    return Promise.resolve();
  }
}