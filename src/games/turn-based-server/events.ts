import { Events } from '../../utils/event-logger/events';

export interface TurnBasedGameEvents extends Events {
  SERVER_PLAYER_CONNECTED: {
    clientId: string;
    playerN: number;
    playersRequired: number;
  };
  SERVER_PLAYER_TURN_ERROR: {
    clientId: string;
    error: string;
    errorN: number;
    errorsBeforeKick: number;
  };
}
