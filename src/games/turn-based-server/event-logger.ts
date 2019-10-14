import { eventDefinitions } from '../../utils/event-logger/event-definitions';
import { EventLogger } from '../../utils/event-logger';
import { TurnBasedGameEvents } from './events';
import { turnBasedEventDefinitions } from './event-definitions';

let instance: EventLogger<TurnBasedGameEvents>;
export function getTurnBasedGameEventLogger(): EventLogger<TurnBasedGameEvents> {
  if (!instance) {
    instance = new EventLogger<TurnBasedGameEvents>({
      level: IS_PRODUCTION ? 'error' : 'verbose',
      events: {
        ...eventDefinitions,
        ...turnBasedEventDefinitions,
      },
    });
  }

  return instance;
}
