// tslint:disable: no-console
import { MethodCollection } from '../utils/msgs';
import { Server, ServerOptions, ClientData } from '../utils/server';

export interface TurnBasedGameServerOptions extends ServerOptions {
  nPlayersRequired: number;
}

export abstract class TurnBasedGameServer<IF extends MethodCollection> extends Server<IF> {
  protected readonly playerIds: string[] = [];
  private readonly nPlayersRequired: number;
  private currentPlayerIndex: number = -1;

  constructor(options: TurnBasedGameServerOptions) {
    super(options);
    this.nPlayersRequired = options.nPlayersRequired;
  }

  /**
   * Method called when a new client connects to the server
   * (requires a `super` call if overriden)
   */
  protected async onClientConnection(client: ClientData): Promise<void> {
    this.playerIds.push(client.id);
    const nPlayers = this.playerIds.length;
    console.log(`Connected player ${nPlayers}/${this.nPlayersRequired}`);

    if (nPlayers === this.nPlayersRequired) {
      await this.initGame();
      await this.gameLoop();
      await this.closeGame();
    }
  }

  /**
   * Method called when a client disconnects from the server
   * (requires a `super` call if overriden)
   */
  protected async onClientDisconnection(client: ClientData): Promise<void> {
    const index = this.playerIds.indexOf(client.id);
    if (index === -1) return;
    this.playerIds.splice(index, 1);
  }

  /**
   * Optional code to execute with each client before starting the game
   */
  protected async initPlayer(client: ClientData): Promise<void> {}

  /**
   * Optional code to execute when starting the game,
   * before any player action but after every player initialization.
   */
  protected async startGame(): Promise<void> {}

  /**
   * Condition to end the game.
   * Called after initializing the game, and after every player action.
   */
  protected abstract hasGameEnded(): boolean;

  /**
   * Method called before every `playerAction` call, to see who's the player acting.
   * By default, this method will alternate in order by every player 1 > 2 > ... > N > 1 > 2 > ...
   */
  protected chooseNext(): ClientData {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerIds.length;
    return this.connections[this.playerIds[this.currentPlayerIndex]];
  }

  /**
   * Action of the player.
   * Must resolve when done.
   */
  protected abstract playerAction(client: ClientData): Promise<void>;

  /**
   * Optional code to execute, when finishing the game (but before closing client connections).
   * This is, when `hasGameEnded` returns `true`.
   */
  protected async endGame(): Promise<void> {}

  /**
   * Internal code to initialize the game before the main loop,
   * after all players have been connected.
   */
  private async initGame(): Promise<void> {
    const clientIds = Object.keys(this.connections);
    clientIds.forEach(async clientId => {
      await this.initPlayer(this.connections[clientId]);
    });
    await this.startGame();
  }

  /**
   * Main game loop, where each player do their actions until the game finishes.
   */
  private async gameLoop(): Promise<void> {
    while (!this.hasGameEnded()) {
      const player = this.chooseNext();
      await this.playerAction(player);
    }
  }

  /**
   * Closing code executed after the game finises.
   * It includes closing client connections.
   */
  private async closeGame(): Promise<void> {
    await this.endGame();

    this.playerIds.forEach(async clientId => {
      await this.closeClient(clientId);
    });
  }
}
