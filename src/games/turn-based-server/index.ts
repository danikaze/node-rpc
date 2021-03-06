// tslint:disable: no-console
import { extendObjectsOnly } from 'extend-objects-only';
import { MethodCollection } from '../../utils/msgs';
import { Server, ServerOptions, ClientData } from '../../utils/server';
// import { writeFile } from 'fs';
import { TurnBasedServerLogger, TurnBasedEventLogger } from './event-logger';
import { logger } from '../../utils/event-logger';

export interface TurnBasedGameServerOptions extends ServerOptions {
  /** Number of players required to connect before starting the game */
  nPlayersRequired: number;
  /** Number of turn errors required before kicking a client */
  errorsBeforeKick?: number;
}

interface TurnBasedGamePlayerData {
  errors: number;
}

export abstract class TurnBasedGameServer<IF extends MethodCollection> extends Server<IF> {
  public static defaultOptions = {
    errorsBeforeKick: 3,
  };
  protected readonly playerIds: string[] = [];
  protected readonly logger: TurnBasedServerLogger;
  private readonly nPlayersRequired: number;
  private readonly errorsBeforeKick: number;
  private playerData: { [clientId: string]: TurnBasedGamePlayerData } = {};
  private playerDataAtStart: { id: string; host: string; port: number }[] = [];
  private currentPlayerIndex: number = -1;

  constructor(options: TurnBasedGameServerOptions) {
    super(extendObjectsOnly(
      {
        loggerInitOptions: {
          factory: TurnBasedEventLogger,
        },
      },
      options as Partial<ServerOptions>
    ) as ServerOptions);

    this.nPlayersRequired = options.nPlayersRequired;
    this.errorsBeforeKick =
      options.errorsBeforeKick || TurnBasedGameServer.defaultOptions.errorsBeforeKick;
    this.logger = (logger as TurnBasedEventLogger).turnBasedServer;
  }

  /**
   * Method called when a new client connects to the server
   * (requires a `super.onClientConnection` call if overriden)
   */
  protected async onClientConnection(client: ClientData): Promise<void> {
    this.playerIds.push(client.id);
    const nPlayers = this.playerIds.length;

    this.logger.playerConnected(client.id, nPlayers, this.nPlayersRequired);

    if (nPlayers === this.nPlayersRequired) {
      await this.initGame();
      await this.gameLoop();
      await this.closeGame();
    }
  }

  /**
   * Method called when a client disconnects from the server
   * (requires a `super.onClientDisconnection` call if overriden)
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
   * Close the client as originally done by `Server` class, but clean things done by this class
   * (requires a `super.closeClient` call if overriden)
   */
  protected async closeClient(client: string | ClientData): Promise<void> {
    const clientId = typeof client === 'string' ? client : client.id;
    const idIndex = this.playerIds.indexOf(clientId);
    if (idIndex !== -1) {
      this.playerIds.splice(idIndex, 1);
    }
    await super.closeClient(client);
  }

  /**
   * Internal code to initialize the game before the main loop,
   * after all players have been connected.
   */
  private async initGame(): Promise<void> {
    const clientIds = Object.keys(this.connections);
    clientIds.forEach(async clientId => {
      const playerData = this.connections[clientId];
      this.playerData[clientId] = {
        errors: 0,
      };
      this.playerDataAtStart.push({
        id: clientId,
        host: playerData.socket.remoteAddress,
        port: playerData.socket.remotePort,
      });
      await this.initPlayer(playerData);
    });
    this.logger.gameStart();
    await this.startGame();
  }

  /**
   * Main game loop, where each player do their actions until the game finishes.
   */
  private async gameLoop(): Promise<void> {
    while (!this.hasGameEnded()) {
      const player = this.chooseNext();
      try {
        await this.playerAction(player);
      } catch (error) {
        this.clientError(player, error);
      }
    }
  }

  private async clientError(client: ClientData, error: Error): Promise<void> {
    this.playerData[client.id].errors++;
    this.logger.playerTurnError(
      client.id,
      error.toString(),
      this.playerData[client.id].errors,
      this.errorsBeforeKick
    );
    if (this.errorsBeforeKick <= 0 || this.playerData[client.id].errors < this.errorsBeforeKick) {
      return;
    }
    await this.closeClient(client);
  }

  /**
   * Closing code executed after the game finises.
   * It includes closing client connections.
   */
  private async closeGame(): Promise<void> {
    await this.endGame();
    this.logger.gameEnd();

    // close all clients at the same time
    const promises: Promise<void>[] = [];

    [...this.playerIds].forEach(clientId => {
      promises.push(this.closeClient(clientId));
    });
    await Promise.all(promises);

    this.playerData = {};
    this.playerDataAtStart = [];
  }
}
