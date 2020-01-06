/*
 * Server side implementation of the Logger interface
 */
import { createLogger, transports, format, Logger as Winston } from 'winston';
import { extendObjectsOnly } from 'extend-objects-only';
import { NsLogger, LoggerOptions, defaultOptions } from '.';

const customFormat = format.printf(({ level, message, timestamp, namespace }) => {
  return `${timestamp ? `${timestamp} ` : ''}[${level} | ${namespace}] ${message}`;
});

let instance: Winston;
const nsLoggers: { [namespace: string]: NsLogger } = {};

export function init(options?: Partial<LoggerOptions>): void {
  if (instance) {
    return;
  }

  const opt = extendObjectsOnly({}, defaultOptions, options);

  const winstonTransports = opt.transports || [];

  if (opt.console) {
    winstonTransports.push(new transports.Console());
  }

  if (opt.outputFile) {
    const filename = replacePathTemplate(opt.outputFile);
    winstonTransports.push(new transports.File({ filename }));
  }

  instance = createLogger({
    silent: opt.silent,
    level: opt.level,
    transports: winstonTransports,
    format: format.combine(
      format.colorize({ colors: { debug: 'magenta' } }),
      format.timestamp(),
      customFormat
    ),
  });
}

export function getLogger(namespace: string): NsLogger {
  // Since this function can be called several times for a logger,
  // the result is cached to avoid creating the same functions several times
  if (nsLoggers[namespace]) {
    return nsLoggers[namespace];
  }

  const logMessage = (level: string, message: string): void => {
    instance.log({ message, level, namespace });
  };

  nsLoggers[namespace] = {
    error: logMessage.bind(null, 'error'),
    warn: logMessage.bind(null, 'warn'),
    info: logMessage.bind(null, 'info'),
    verbose: logMessage.bind(null, 'verbose'),
    debug: logMessage.bind(null, 'debug'),
  };

  return nsLoggers[namespace];
}

/**
 * Allow using basic placeholders for the game log dump filepath:
 * - %TIMESTAMP%
 * - %DATE%
 * - %TIME%
 */
function replacePathTemplate(path: string): string {
  const date = new Date();

  let res = path.replace(/%TIMESTAMP%/g, date.getTime().toString());
  res = res.replace(
    /%DATE%/g,
    date
      .toLocaleDateString('ja', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
  );
  res = res.replace(
    /%TIME%/g,
    date
      .toLocaleTimeString('ja', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      .replace(/:/g, '-')
  );

  return res;
}
