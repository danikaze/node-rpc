/*
 * Client side implementation of the Logger interface
 */
import { extendObjectsOnly } from 'extend-objects-only';
import { NsLogger, LoggerOptions, LoggerLevel, defaultOptions } from '.';

const levelsPriority = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
};
const levelsFormat = {
  error: 'color: red',
  warn: 'color: yellow',
  info: 'color: green',
  verbose: 'color: grey',
  debug: 'color: blue',
};
const nsLoggers: { [namespace: string]: NsLogger } = {};
let instance: Logger;

class Logger {
  private readonly options: LoggerOptions;

  constructor(options: LoggerOptions) {
    this.options = options;
  }

  public log(level: LoggerLevel, namespace: string, message: string): void {
    if (this.options.silent || levelsPriority[this.options.level] < levelsPriority[level]) {
      return;
    }

    const method = level === 'verbose' || level === 'debug' ? 'info' : level;
    const time = new Date();
    console[method](`%c${time.toISOString()} [${namespace}] ${message}`, levelsFormat[level]);
  }
}

export function init(options?: Partial<LoggerOptions>): void {
  const opt = extendObjectsOnly({}, defaultOptions, options) as LoggerOptions;

  instance = instance || new Logger(opt);
}

export function getLogger(namespace: string): NsLogger {
  // Since this function can be called several times for a logger,
  // the result is cached to avoid creating the same functions several times
  if (nsLoggers[namespace]) {
    return nsLoggers[namespace];
  }

  nsLoggers[namespace] = {
    error: instance.log.bind(instance, 'error', namespace),
    warn: instance.log.bind(instance, 'warn', namespace),
    info: instance.log.bind(instance, 'info', namespace),
    verbose: instance.log.bind(instance, 'verbose', namespace),
    debug: instance.log.bind(instance, 'debug', namespace),
  };

  return nsLoggers[namespace];
}
