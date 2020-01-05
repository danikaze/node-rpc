import { default as logSystem, NsLogger, LoggerLevel, LoggerOptions } from '../logger';
import { ServerLogger } from './server';
import { ClientLogger } from './client';

export interface EventLoggerInitOptions extends Partial<LoggerOptions> {
  factory?: typeof EventLogger;
}

export class EventLogger {
  public readonly global: NsLogger;
  public readonly server = new ServerLogger();
  public readonly client = new ClientLogger();

  constructor() {
    this.global = logSystem.getLogger('global');
    this.global.info('EventLogger initializated');
    this.global.verbose(
      `Running version ${APP_VERSION} built from branch ${GIT_BRANCH}:${GIT_VERSION}`
    );
  }

  public static init(options?: EventLoggerInitOptions) {
    if (logger) {
      logger.loggerAlreadyInitialized();
      return;
    }

    logSystem.init(options);
    const Factory = (options && options.factory) || EventLogger;
    logger = new Factory();
  }

  public showLoggerFormats() {
    this.global.error('0. error msg');
    this.global.warn('1. warn msg');
    this.global.info('2. info msg');
    this.global.verbose('3. verbose msg');
    this.global.debug('4. debug msg');
  }

  public msg(level: LoggerLevel, msg: string) {
    this.global[level](msg);
  }

  protected loggerAlreadyInitialized() {
    this.global.warn('Logger was already initialized');
  }
}

export let logger: EventLogger;
