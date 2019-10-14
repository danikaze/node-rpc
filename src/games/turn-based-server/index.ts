// tslint:disable: no-console
import { sync as mkdirp } from 'mkdirp';
import { MethodCollection } from '../../utils/msgs';
import { Server, ServerOptions, ClientData } from '../../utils/server';
import { EventLogger } from '../../utils/event-logger';
import { TurnBasedGameEvents } from './events';
import { getTurnBasedGameEventLogger } from './event-logger';
import { writeFile } from 'fs';
import { dirname } from 'path';

export interface TurnBasedGameServerOptions<E extends TurnBasedGameEvents>
  extends ServerOptions<E> {
  /** Number of players required to connect before starting the game */
  nPlayersRequired: number;
  /** Number of turn errors required before kicking a client */
  errorsBeforeKick?: number;
  /** If specified, the game log will be dumped to this file when ended */
  gameLog?: string;
}

interface TurnBasedGamePlayerData {
  errors: number;
}

export abstract class TurnBasedGameServer<
  IF extends MethodCollection,
  E extends TurnBasedGameEvents = TurnBasedGameEvents
> extends Server<IF, E> {
  public static defaultOptions = {
    errorsBeforeKick: 3,
  };
  protected readonly playerIds: string[] = [];
  private readonly nPlayersRequired: number;
  private readonly errorsBeforeKick: number;
  private readonly gameLog: string;
  private readonly playerData: { [clientId: string]: TurnBasedGamePlayerData } = {};
  private readonly playerDataAtStart: { id: string; host: string; port: number }[] = [];
  private currentPlayerIndex: number = -1;

  constructor(options: TurnBasedGameServerOptions<E>) {
    super({
      eventLogger: (options.eventLogger || getTurnBasedGameEventLogger()) as EventLogger<E>,
      ...options,
    });
    this.nPlayersRequired = options.nPlayersRequired;
    this.errorsBeforeKick =
      options.errorsBeforeKick || TurnBasedGameServer.defaultOptions.errorsBeforeKick;
    this.gameLog = options.gameLog;
  }

  /**
   * Method called when a new client connects to the server
   * (requires a `super.onClientConnection` call if overriden)
   */
  protected async onClientConnection(client: ClientData): Promise<void> {
    this.playerIds.push(client.id);
    const nPlayers = this.playerIds.length;

    this.eventLogger.add('SERVER_PLAYER_CONNECTED', {
      clientId: client.id,
      playerN: nPlayers,
      playersRequired: this.nPlayersRequired,
    });

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
   * When the game finishes, this method will be called if `options.gameLog` is set
   * Can be overriden for custom logs (no `super.dumpGameLog` call required)
   */
  protected async dumpGameLog(path: string): Promise<void> {
    return new Promise<void>(resolve => {
      const data = {
        players: this.playerDataAtStart,
        game: this.eventLogger.getList(),
      };
      writeFile(path, JSON.stringify(data), { encoding: 'utf8' }, error => {
        if (error) {
          this.eventLogger.add('SERVER_GAME_LOG_DUMP_ERROR', { path, error: String(error) });
        } else {
          this.eventLogger.add('SERVER_GAME_LOG_DUMP', { path });
        }
        resolve();
      });
    });
  }

  /**
   * Allow using basic placeholders for the game log dump filepath:
   * - {TIMESTAMP}
   * - {DATE}
   * - {TIME}
   */
  private replacePathTemplate(path: string): string {
    const date = new Date();

    let res = path.replace(/\{TIMESTAMP\}/g, date.getTime().toString());
    res = res.replace(/\{DATE\}/g, date.toLocaleDateString());
    res = res.replace(/\{TIME\}/g, date.toLocaleTimeString());

    return res;
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
    this.eventLogger.add('SERVER_GAME_START', undefined);
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
    this.eventLogger.add('SERVER_PLAYER_TURN_ERROR', {
      clientId: client.id,
      error: error.toString(),
      errorN: this.playerData[client.id].errors,
      errorsBeforeKick: this.errorsBeforeKick,
    });
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
    this.eventLogger.add('SERVER_GAME_END', undefined);

    // start dumping the game log while closing clients at the same time
    const promises: Promise<void>[] = [];

    if (this.gameLog) {
      const filePath = this.replacePathTemplate(this.gameLog);
      mkdirp(dirname(filePath));
      promises.push(this.dumpGameLog(filePath));
    }

    [...this.playerIds].forEach(clientId => {
      promises.push(this.closeClient(clientId));
    });

    await Promise.all(promises);
  }
}
