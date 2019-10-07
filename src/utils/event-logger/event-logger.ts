// tslint:disable: no-console
import { EventType, EventData } from './event-types';

export interface EventLoggerOptions {
  /**
   * Maximum severity level to log
   */
  level: LoggerLevel;
}

export type LoggerLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

/**
 * Abstraction class to log all the events of the application without having to define how to treat
 * them within the logic of the program.
 * When an event E happens, the code shouldn't worry about what to do with it:
 * ignore it, log it as `log`, `info`, etc., or how to log it.
 * Just add an event and its data, and it will be treated the same all the time by this class
 */
export class EventLogger {
  protected readonly level: LoggerLevel;

  constructor(options?: EventLoggerOptions) {
    this.level = (options && options.level) || 'error';
  }

  public add(type: EventType, data?: EventData[EventType]) {
    if (data) {
      console.log(`Event ${type}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`Event ${type}`);
    }
  }
}
