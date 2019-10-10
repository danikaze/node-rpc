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
  ErrorExceptionMsg,
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
  /* client connections data */
  protected connectionNumber: number = 0;
  protected readonly connections: { [id: string]: ClientData } = {};

  /* server creation data */
  private readonly port: number;
  private readonly host: string;
  private readonly backlog: number;
  private server: NetServer;
  private readonly rpcTimeout: number;

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

  /**
   * Make a request for a method to one of the connected clients, and wait for its response
   * It can fail on:
   * - wrong specified client
   * - rpc call timeout
   * - if the method is not implemented in the client
   * - if there's a runtime exception in the client implementation
   */
  protected callRpcMethod<R>(
    client: string | ClientData,
    method: keyof M,
    params?: unknown[]
  ): Promise<R> {
    const clientData = this.getClient(client);
    if (!clientData) {
      return Promise.reject();
    }

    return new Promise<R>(async (resolve, reject) => {
      // request
      await clientData.tx.send<MethodRequestMsg<M>>({
        method,
        params,
        type: 'METHOD_REQUEST',
        timeout: this.rpcTimeout,
      });
      const startTime = new Date().getTime();
      logEvent('SERVER_RPC_REQUEST', { params, method: method as string, clientId: clientData.id });

      // response
      let hasTimeout = false;
      const rpcTimeoutHandler = setTimeout(() => {
        hasTimeout = true;
        logEvent('SERVER_RPC_TIMEOUT', {
          method: method as string,
          clientId: clientData.id,
          time: this.rpcTimeout,
        });
        reject('ERROR_RPC_TIMEOUT');
      }, this.rpcTimeout);

      type ExpectedMsg = MethodResponseMsg | ErrorNotImplementedMsg<M> | ErrorExceptionMsg<M>;
      const msg = await clientData.tx.waitData<ExpectedMsg>();
      clearTimeout(rpcTimeoutHandler);

      if (msg.type === 'ERROR_METHOD_NOT_IMPLEMENTED') {
        logEvent('SERVER_RPC_NOT_IMPLEMENTED', {
          method: method as string,
          clientId: clientData.id,
        });
        reject(msg.type);
        return;
      }

      if (msg.type === 'ERROR_METHOD_EXCEPTION') {
        logEvent('SERVER_RPC_EXCEPTION', {
          method: method as string,
          clientId: clientData.id,
          error: msg.error,
        });
        reject(msg.type);
        return;
      }

      if (!hasTimeout) {
        const time = new Date().getTime() - startTime;
        logEvent('SERVER_RPC_RESPONSE', {
          time,
          method: method as string,
          clientId: clientData.id,
          result: msg.result,
          timeout: hasTimeout,
        });
        resolve(msg.result as R);
      }
    });
  }

  /**
   * Close the connection with a client
   * If the specified client is not correct, the promise will be rejected
   */
  protected async closeClient(client: string | ClientData): Promise<void> {
    const clientData = this.getClient(client);
    if (!clientData) {
      return Promise.reject();
    }

    return new Promise<void>(async resolve => {
      await clientData.tx.send<EndMsg>({ type: 'END' });
      clientData.socket.end(() => {
        delete this.connections[clientData.id];
        resolve();
      });
    });
  }

  /**
   * Method called when a new client connects to the server
   * (to be overriden)
   */
  protected async onClientConnection(client: ClientData): Promise<void> {}

  /**
   * Method called when a client disconnects from the server
   * (to be overriden)
   */
  protected async onClientDisconnection(client: ClientData, error?: Error): Promise<void> {}

  private async handleConnection(socket: Socket): Promise<void> {
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
    socket.on('close', this.handleConnectionClose.bind(this, clientData));

    await this.handshake(clientData);
    await this.onClientConnection(clientData);
  }

  private async handleConnectionClose(client: ClientData, error?: Error) {
    logEvent('SERVER_CONNECTION_CLOSED', { error, clientId: client.id });
    this.onClientDisconnection(client, error);
  }

  private handleError(error: Error): void {
    logEvent('SERVER_ERROR', { error });
  }

  private handleClose(): void {
    logEvent('SERVER_CLOSE');
  }

  private async handshake(client: ClientData): Promise<void> {
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

  private generateClientId(): string {
    return `${this.connectionNumber}:${String(Math.random()).substr(2)}`;
  }

  private getClient(client: ClientData | string): ClientData {
    if (typeof client === 'string') {
      return this.connections[client];
    }
    return this.connections[client.id];
  }
}
