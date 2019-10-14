import { Events } from './events';

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
  public add(type: keyof E, data?: E[keyof E]) {
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
}
