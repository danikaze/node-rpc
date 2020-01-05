import { EventLogger } from '../../utils/event-logger';
import { ServerLogger } from '../../utils/event-logger/server';

export class TurnBasedServerLogger extends ServerLogger {
  public playerConnected(clientId: string, playerN: number, playersRequired: number): void {
    this.logger.info(`Player ${clientId} connected (${playerN}/${playersRequired})`);
  }

  public playerTurnError(
    clientId: string,
    error: string,
    errorN: number,
    errorsBeforeKick: number
  ): void {
    this.logger.warn(`Turn error ${errorN}/${errorsBeforeKick} for client ${clientId}: ${error}`);
  }

  public gameLogDump(path: string, error?: Error): void {
    if (error) {
      this.logger.error(`Error while dumping game log into ${path} (${error})`);
    } else {
      this.logger.info(`Game log dumped into ${path}`);
    }
  }

  public gameStart(): void {
    this.logger.info(`Game starts`);
  }

  public gameEnd(): void {
    this.logger.info(`Game ended`);
  }
}

export class TurnBasedEventLogger extends EventLogger {
  public turnBasedServer = new TurnBasedServerLogger();
}
