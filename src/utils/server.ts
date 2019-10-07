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
import { logEvent } from './event-logger';

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
        logEvent('SERVER_READY', { host: this.host, port: this.port });
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
        logEvent('SERVER_STOP_ERROR', { error });
      } else {
        logEvent('SERVER_STOP');
      }
    });
  }

  protected abstract async logic(client: ClientData): Promise<void>;

  protected async handleConnection(socket: Socket): Promise<void> {
    ++this.connectionNumber;
    const clientId = this.generateClientId();

    logEvent('SERVER_CONNECTION_INCOMING', {
      clientId,
      address: socket.remoteAddress,
      port: socket.remotePort,
    });

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
    logEvent('SERVER_CONNECTION_CLOSED', { error, clientId: client.id });
  }

  protected handleError(error: Error): void {
    logEvent('SERVER_ERROR', { error });
  }

  protected handleClose(): void {
    logEvent('SERVER_CLOSE');
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
        logEvent('SERVER_HANDSHAKE_ACK_ERROR', { clientId: client.id });
      });
      return;
    }
    logEvent('SERVER_HANDSHAKE_ACK_OK', { clientId: client.id });
  }

  protected callRpcMethod<R>(client: ClientData, method: keyof M, params?: unknown[]): Promise<R> {
    return new Promise<R>(async (resolve, reject) => {
      // request
      await client.tx.send<MethodRequestMsg<M>>({
        method,
        params,
        type: 'METHOD_REQUEST',
      });
      logEvent('SERVER_RPC_REQUEST', { params, method: method as string, clientId: client.id });

      // response
      let hasTimeout = false;
      const rpcTimeoutHandler = setTimeout(() => {
        hasTimeout = true;
        logEvent('SERVER_RPC_TIMEOUT', {
          method: method as string,
          clientId: client.id,
          time: this.rpcTimeout,
        });
        reject('ERROR_RPC_TIMEOUT');
      }, this.rpcTimeout);

      const msg = await client.tx.waitData<MethodResponseMsg | ErrorNotImplementedMsg<M>>();
      clearTimeout(rpcTimeoutHandler);

      if (msg.type === 'ERROR_METHOD_NOT_IMPLEMENTED') {
        logEvent('SERVER_RPC_NOT_IMPLEMENTED', { method: method as string, clientId: client.id });
        reject(msg.type);
        return;
      }

      if (!hasTimeout) {
        logEvent('SERVER_RPC_RESPONSE', {
          method: method as string,
          clientId: client.id,
          result: msg.result,
        });
        resolve(msg.result as R);
      }
    });
  }
}
