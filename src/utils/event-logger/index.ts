import { Events } from './events';
import { eventDefinitions } from './event-definitions';

// tslint:disable: no-console
export interface EventLoggerOptions<E> {
  /**
   * Maximum severity level to log in this instance
   */
  level: LoggerLevel;
  /**
   * Definitions of the actions to perform for each event
   * If an event type is not specified, it will use a default msg and an 'info' level
   */
  events?: Partial<EventDefinition<E>>;
}

export type EventDefinition<E> = Record<
  keyof E,
  {
    /** Level of the message for this kind of event */
    level: LoggerLevel;
    /** Custom string to log for this message */
    msg?: (data?: E[keyof E]) => string[];
  }
>;

export interface GetListOptions<E> {
  /** If specified, only this type of events will be returned (takes precedence over `blackList`) */
  whiteList?: (keyof E)[];
  /** If specified, all but this events will be returned */
  blackList?: (keyof E)[];
}

export type LoggerLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

/**
 * Abstraction class to log all the events of the application without having to define how to treat
 * them within the logic of the program.
 * When an event E happens, the code shouldn't worry about what to do with it:
 * ignore it, log it as `log`, `info`, etc., or how to log it.
 * Just add an event and its data, and it will be treated the same all the time by this class
 */
export class EventLogger<E extends Events> {
  // level priority order
  private static readonly levels: LoggerLevel[] = ['error', 'warn', 'info', 'verbose', 'debug'];
  // mapping from levels to console[method]
  private static readonly levelMap = {
    error: 'error',
    warn: 'warn',
    info: 'info',
    verbose: 'info',
    debug: 'info',
  };

  protected readonly level: number;
  protected readonly definitions: Partial<EventDefinition<E>>;
  private readonly list: { type: keyof E; data?: E[keyof E] }[] = [];

  constructor(options?: EventLoggerOptions<E>) {
    this.level = EventLogger.levels.indexOf((options && options.level) || 'error');
    this.definitions = (options && options.events) || {};
  }

  /**
   * Log the specified event
   */
  public add<T extends keyof E>(type: T, data: E[T]) {
    this.list.push({ type, data });

    const def = this.definitions[type];
    const level = (def && def.level) || 'info';
    const eventLevel = EventLogger.levels.indexOf(level);
    if (eventLevel > this.level) {
      return;
    }

    let msgParams: string[];
    if (def && def.msg) {
      msgParams = def.msg(data);
    } else if (data) {
      msgParams = [`Event ${type}`, JSON.stringify(data, null, 2)];
    } else {
      msgParams = [`Event ${type}`];
    }

    console[EventLogger.levelMap[level]](...msgParams);
  }

  /**
   * Get the list of the logged events
   */
  public getList({ whiteList, blackList }: GetListOptions<E> = {}): {
    type: keyof E;
    data?: E[keyof E];
  }[] {
    if (whiteList) {
      return this.list.filter(event => whiteList.indexOf(event.type) !== -1);
    }
    if (blackList) {
      return this.list.filter(event => whiteList.indexOf(event.type) === -1);
    }
    return this.list;
  }
}

let instance: EventLogger<Events>;
export function getBasicEventLogger(): EventLogger<Events> {
  if (!instance) {
    instance = new EventLogger<Events>({
      level: IS_PRODUCTION ? 'error' : 'verbose',
      events: eventDefinitions,
    });
  }

  return instance;
}
