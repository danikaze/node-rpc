// tslint:disable: no-console
import { Socket } from 'net';
import { JsonTx } from './json-tx';
import {
  HandShakeMsg,
  HandShakeAckMsg,
  MethodRequestMsg,
  EndMsg,
  ErrorNotImplementedMsg,
  MethodResponseMsg,
} from './msgs';

export interface ClientOptions {
  /** Host the socket should connect to. (`'localhost'` by default) */
  host: string;
  /** Port the socket should connect to */
  port: number;
  /** Path of the file to import */
  file: string;
}

interface RpcMethods {
  getTime: () => string;
}

export class Client {
  protected readonly host: string;
  protected readonly port: number;
  protected readonly socket: Socket;
  protected readonly tx: JsonTx;
  protected id: string;
  protected rpcMethods: RpcMethods;

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
        console.log(`Connected! (ID: ${this.id})`);
        resolve();
      });

      this.socket.once('error', error => {
        console.log('Error', JSON.stringify(error));
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
      this.socket.end(resolve);
    });
  }

  /**
   * Start the RPC method loop
   * It waits for messages and returns the result, until an `EndMsg` is received
   */
  public async rpc(): Promise<void> {
    for (;;) {
      const msg = await this.tx.waitData<MethodRequestMsg | EndMsg>();

      if (msg.type === 'END') {
        return;
      }

      if (msg.type === 'METHOD_REQUEST') {
        const method = this.rpcMethods[msg.method];
        if (!method) {
          this.tx.send<ErrorNotImplementedMsg>({
            method,
            type: 'ERROR_METHOD_NOT_IMPLEMENTED',
          });
          continue;
        }

        const result = 123; // method(...msg.params);
        this.tx.send<MethodResponseMsg>({
          result,
          type: 'METHOD_RESULT',
        });
      }
    }
  }

  /**
   * Send JSON data to the server
   */
  public async sendData<T = unknown>(data: T): Promise<void> {
    console.log(`Sending: ${JSON.stringify(data)}`);
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

  protected loadCode(filePath: string): RpcMethods {
    try {
      return require('../rpc/client1.js');
    } catch (e) {
      console.error(e);
    }
  }
}
