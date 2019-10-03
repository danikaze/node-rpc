// tslint:disable: no-console
import { createServer, Socket, Server as NetServer } from 'net';
import { JsonTx } from './json-tx';
import {
  HandShakeMsg,
  HandShakeAckMsg,
  EndMsg,
  MethodRequestMsg,
  MethodResponseMsg,
  ErrorNotImplementedMsg,
  MethodCollection,
} from './msgs';

export interface ServerOptions {
  /** Port where to listen */
  port: number;
  /** Host where to listen (`'localhost'` by default) */
  host?: string;
  /** Maximum length of the queue of pending connections */
  backlog?: number;
  /** Ms. to wait before a RPC method timeouts (`1000` by default) */
  rpcTimeout?: number;
}

export interface ClientData {
  id: string;
  tx: JsonTx;
  socket: Socket;
}

export abstract class Server<M extends MethodCollection> {
  /* server creation data */
  protected readonly port: number;
  protected readonly host: string;
  protected readonly backlog: number;
  protected readonly rpcTimeout: number;
  protected server: NetServer;

  /* client connections data */
  protected connectionNumber: number = 0;
  protected readonly connections: { [id: string]: ClientData } = {};

  constructor(options: ServerOptions) {
    this.port = options.port;
    this.host = options.host || 'localhost';
    this.backlog = options.backlog;
    this.rpcTimeout = options.rpcTimeout || 1000;
  }

  /**
   * Start the server and listen in the specified host:port
   */
  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = createServer();

      this.server.on('connection', this.handleConnection.bind(this));
      this.server.once('error', reject);

      this.server.listen(this.port, this.host, this.backlog, () => {
        this.server.on('error', this.handleError.bind(this));
        this.server.on('close', this.handleClose);
        console.log(`Server listening in port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  public async stop(): Promise<void> {
    this.server.close(error => {
      if (error) {
        console.log('Error stopping server', error);
      } else {
        console.log('Server stopped');
      }
    });
  }

  protected abstract async logic(client: ClientData): Promise<void>;

  protected async handleConnection(socket: Socket): Promise<void> {
    ++this.connectionNumber;

    console.log(
      `[${this.connectionNumber}] Connection received from ${socket.remoteAddress}:${socket.remotePort}`
    );

    const clientId = this.generateClientId();
    const clientData = {
      socket,
      id: clientId,
      tx: new JsonTx(socket),
    };
    this.connections[clientId] = clientData;
    this.server.on('close', this.handleConnectionClose.bind(this, clientData));

    await this.handshake(clientData);
    await this.logic(clientData);
    await clientData.tx.send<EndMsg>({ type: 'END' });
  }

  protected async handleConnectionClose(client: ClientData, error?: Error) {
    console.log(`[${client.id}] Connection closed (error: ${error})`);
  }

  protected handleError(error: Error): void {
    console.error('Error', error);
  }

  protected handleClose(): void {
    console.log('Server closed');
  }

  protected generateClientId(): string {
    return `${this.connectionNumber}:${String(Math.random()).substr(2)}`;
  }

  protected async handshake(client: ClientData): Promise<void> {
    await client.tx.send<HandShakeMsg>({
      type: 'HANDSHAKE',
      id: client.id,
    });
    const ack = await client.tx.waitData<HandShakeAckMsg>();
    if (ack.type !== 'HANDSHAKE_ACK' || ack.id !== client.id) {
      client.socket.end(() => {
        console.log(`[${client.id}] Wrong ACK`);
      });
      return;
    }
    console.log(`[${client.id}] ACK OK!`);
  }

  protected callRpcMethod<R>(client: ClientData, method: keyof M, params?: unknown[]): Promise<R> {
    return new Promise<R>(async (resolve, reject) => {
      // request
      await client.tx.send<MethodRequestMsg<M>>({
        method,
        params,
        type: 'METHOD_REQUEST',
      });
      console.log(`Request: ${method}(${(params || []).join(',')})`);

      // response
      let hasTimeout = false;
      const rpcTimeoutHandler = setTimeout(() => {
        hasTimeout = true;
        reject('ERROR_RPC_TIMEOUT');
      }, this.rpcTimeout);

      const msg = await client.tx.waitData<MethodResponseMsg | ErrorNotImplementedMsg<M>>();
      clearTimeout(rpcTimeoutHandler);

      if (msg.type === 'ERROR_METHOD_NOT_IMPLEMENTED') {
        reject(msg.type);
        return;
      }

      if (!hasTimeout) {
        console.log(` Result:`, msg.result);
        resolve(msg.result as R);
      }
    });
  }
}
