import * as Transport from 'winston-transport';

// this require (instead of import) is to avoid including server side files in the client build
const implementation = IS_SERVER ? require('./server') : require('./client');

export type LoggerLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

export interface LoggerOptions {
  /**
   * Maximum severity level to log
   */
  level: LoggerLevel;
  /**
   * If `true`, nothing will be logged
   */
  silent?: boolean;
  /**
   * Enables logging to the console (client + server side)
   */
  console?: boolean;
  /**
   * If specified, enables logging to a file (server side only)
   */
  outputFile?: string;
  /**
   * Extra transports to use (server side only)
   */
  transports?: Transport[];
}

export type LogFunction = (message: string) => void;

/**
 * Namespaced logger object, returned by `getLogger`
 *
 * It contains all the functions to log a message based on its severity
 */
export interface NsLogger {
  /**
   * Logs errors affecting the operation/service
   */
  error: LogFunction;
  /**
   * Logs recuperable errors involving unexpected things
   */
  warn: LogFunction;
  /**
   * Log processes taking place (start, stop, etc.). Useful to follow the app workflow
   */
  info: LogFunction;
  /**
   * Log detailed info, not important messages
   */
  verbose: LogFunction;
  /**
   * Log debug messages
   */
  debug: LogFunction;
}

export const defaultOptions: LoggerOptions = {
  level: 'debug',
  silent: false,
  console: true,
  outputFile: 'logs/%DATE%.log',
};

/**
 * Initializes the logging system with the provided options.
 * Then, an instance per namespace can be get using `getLogger`.
 */
export declare function init(options?: Partial<LoggerOptions>): void;

/**
 * Get a namespaced logger. This binds the provided namespace to all logging functions
 * `init` needs to be called before calling this function.
 *
 * Which method to use when logging?
 *
 * | method  | priority | usage |
 * |---------+----------+-------|
 * | error   | 0        | errors affecting the operation/service |
 * | warn    | 1        | recuperable error or unexpected things |
 * | info    | 2        | processes taking place (start, stop, etc.) to follow the app workflow |
 * | verbose | 3        | detailed info, not important |
 * | debug   | 4        | debug messages |
 */
export declare function getLogger(namespace: string): NsLogger;

// tslint:disable:no-default-export
export default implementation;
