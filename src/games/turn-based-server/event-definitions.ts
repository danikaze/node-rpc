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
};
