import { EventDefinition as BasicEventDefinition } from '../../utils/event-logger';
import { TurnBasedGameEvents } from './events';

export const turnBasedEventDefinitions: Partial<BasicEventDefinition<TurnBasedGameEvents>> = {
  SERVER_PLAYER_CONNECTED: {
    level: 'info',
    msg: ({
      clientId,
      playerN,
      playersRequired,
    }: TurnBasedGameEvents['SERVER_PLAYER_CONNECTED']) => [
      `Player ${clientId} connected (${playerN}/${playersRequired})`,
    ],
  },
  SERVER_PLAYER_TURN_ERROR: {
    level: 'warn',
    msg: ({
      clientId,
      error,
      errorN,
      errorsBeforeKick,
    }: TurnBasedGameEvents['SERVER_PLAYER_TURN_ERROR']) => [
      `Turn error ${errorN}/${errorsBeforeKick} for client ${clientId}: ${error}`,
    ],
  },
  SERVER_GAME_LOG_DUMP: {
    level: 'info',
    msg: ({ path }: TurnBasedGameEvents['SERVER_GAME_LOG_DUMP']) => [
      `Game log dumped into ${path}`,
    ],
  },
  SERVER_GAME_LOG_DUMP_ERROR: {
    level: 'error',
    msg: ({ path, error }: TurnBasedGameEvents['SERVER_GAME_LOG_DUMP_ERROR']) => [
      `Error while dumping game log into ${path}`,
    ],
  },
};
