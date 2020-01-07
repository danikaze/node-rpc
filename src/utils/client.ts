import { Socket } from 'net';
import { JsonTx } from './json-tx';
import {
  HandShakeMsg,
  HandShakeAckMsg,
  MethodRequestMsg,
  EndMsg,
  ErrorNotImplementedMsg,
  MethodResponseMsg,
  MethodCollection,
  ErrorExceptionMsg,
} from './msgs';
import { EventLogger, logger, EventLoggerInitOptions } from './event-logger';
import { ClientLogger } from './event-logger/client';

export interface ClientOptions<M extends MethodCollection> {
  /** Host the socket should connect to. (`'localhost'` by default) */
  host?: string;
  /** Port the socket should connect to */
  port: number;
  /** Methods implementation */
  module?: M;
  /** Path of the file to import (if `module` is not especified) */
  file?: string;
  /** Options to initializate the logging system */
  loggerInitOptions?: EventLoggerInitOptions;
}

export class Client<M extends MethodCollection> {
  protected readonly host: string;
  protected readonly port: number;
  protected readonly socket: Socket;
  protected readonly tx: JsonTx;
  protected readonly logger: ClientLogger;
  protected readonly rpcMethods: M;
  protected id: string;

  constructor(options: ClientOptions<M>) {
    EventLogger.init(options.loggerInitOptions);
    this.logger = logger.client;

    this.logger.start(APP_VERSION);

    this.port = options.port;
    this.host = options.host || 'localhost';
    this.socket = new Socket();
    this.tx = new JsonTx(this.socket);
    this.rpcMethods = this.loadCode(options.module || options.file);
  }

  /**
   * Open the connection to the specified server
   */
  public async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.socket.once('connect', async () => {
        await this.handshake();
        this.logger.connected(this.id, this.host, this.port);
        resolve();
      });

      this.socket.once('error', error => {
        this.logger.error(error);
        reject(error);
      });

      this.socket.connect(this.port, this.host);
    });
  }

  /**
   * Close the connection
   */
  public async close(): Promise<void> {
    return new Promise<void>(resolve => {
      this.logger.closed();
      this.socket.end(resolve);
    });
  }

  /**
   * Start the RPC method loop
   * It waits for messages and returns the result, until an `EndMsg` is received
   */
  public async rpc(): Promise<void> {
    for (;;) {
      const msg = await this.tx.waitData<MethodRequestMsg<M> | EndMsg>();

      if (msg.type === 'END') {
        return;
      }

      if (msg.type === 'METHOD_REQUEST') {
        this.logger.rpcRequest(msg.method as string, msg.params);
        const method = this.rpcMethods[msg.method];
        if (!method) {
          this.tx.send<ErrorNotImplementedMsg<M>>({
            method: msg.method,
            type: 'ERROR_METHOD_NOT_IMPLEMENTED',
          });
          continue;
        }

        try {
          const response = msg.params ? method(...msg.params) : method();
          await (async () => {
            const result = response instanceof Promise ? await response : response;
            this.logger.rpcResponse(msg.method as string, result);
            this.tx.send<MethodResponseMsg>({
              result,
              type: 'METHOD_RESULT',
            });
          })();
        } catch (error) {
          this.logger.rpcException(msg.method as string, error);
          this.tx.send<ErrorExceptionMsg<M>>({
            error: error.toString(),
            method: msg.method,
            type: 'ERROR_METHOD_EXCEPTION',
          });
        }
      }
    }
  }

  /**
   * Send JSON data to the server
   */
  public async sendData<T = unknown>(data: T): Promise<void> {
    await this.tx.send(data);
  }

  /**
   * Wait for data to come from the server
   */
  public async waitData<T = unknown>(): Promise<T> {
    return await this.tx.waitData<T>();
  }

  /**
   * Reset the received messages waiting to be read with `waitData`, if any
   */
  public reset(): void {
    this.tx.reset();
  }

  protected async handshake(): Promise<void> {
    const handshake = await this.tx.waitData<HandShakeMsg>();
    this.id = handshake.id;
    await this.tx.send<HandShakeAckMsg>({
      type: 'HANDSHAKE_ACK',
      id: this.id,
    });
  }

  protected loadCode(source: string | M): M {
    if (typeof source !== 'string') {
      this.logger.moduleLoaded();
      return source;
    }

    try {
      const mod = __non_webpack_require__(`${RPC_FOLDER}${source}`);
      this.logger.codeLoaded(source);
      return mod;
    } catch (error) {
      this.logger.codeLoaded(source, error);
    }
  }
}
