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
import { logEvent } from './event-logger';

export interface ClientOptions {
  /** Host the socket should connect to. (`'localhost'` by default) */
  host?: string;
  /** Port the socket should connect to */
  port: number;
  /** Path of the file to import */
  file: string;
}

export class Client<M extends MethodCollection> {
  protected readonly host: string;
  protected readonly port: number;
  protected readonly socket: Socket;
  protected readonly tx: JsonTx;
  protected id: string;
  protected rpcMethods: M;

  constructor(options: ClientOptions) {
    this.port = options.port;
    this.host = options.host || 'localhost';
    this.socket = new Socket();
    this.tx = new JsonTx(this.socket);
    this.rpcMethods = this.loadCode(options.file);
  }

  /**
   * Open the connection to the specified server
   */
  public async connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.socket.once('connect', async () => {
        await this.handshake();
        logEvent('CLIENT_CONNECTED', { clientId: this.id, host: this.host, port: this.port });
        resolve();
      });

      this.socket.once('error', error => {
        logEvent('CLIENT_ERROR', { error });
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
      logEvent('CLIENT_CLOSE');
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
        logEvent('CLIENT_RPC_REQUEST', { method: msg.method as string, params: msg.params });
        const method = this.rpcMethods[msg.method];
        if (!method) {
          this.tx.send<ErrorNotImplementedMsg<M>>({
            method: msg.method,
            type: 'ERROR_METHOD_NOT_IMPLEMENTED',
          });
          continue;
        }

        try {
          const result = msg.params ? method(...msg.params) : method();
          logEvent('CLIENT_RPC_RESPONSE', { result, method: msg.method as string });
          this.tx.send<MethodResponseMsg>({
            result,
            type: 'METHOD_RESULT',
          });
        } catch (error) {
          logEvent('CLIENT_RPC_EXCEPTION', { error, method: msg.method as string });
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

  protected loadCode(filePath: string): M {
    try {
      const module = __non_webpack_require__(`${RPC_FOLDER}${filePath}`);
      logEvent('CLIENT_CODE_LOAD', { path: filePath });
      return module;
    } catch (error) {
      logEvent('CLIENT_CODE_LOAD_ERROR', { error, path: filePath });
    }
  }
}
