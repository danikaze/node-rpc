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
import { EventLogger, getBasicEventLogger } from './event-logger/';
import { Events } from './event-logger/events';

export interface ServerOptions<E extends Events> {
  /** Port where to listen */
  port: number;
  /** Host where to listen (`'localhost'` by default) */
  host?: string;
  /** Maximum length of the queue of pending connections */
  backlog?: number;
  /** Ms. to wait before a RPC method timeouts (`1000` by default) */
  rpcTimeout?: number;
  /** Event logger to use. If not specified, it will create its own */
  eventLogger?: EventLogger<E>;
}

export interface ClientData {
  id: string;
  tx: JsonTx;
  socket: Socket;
}

export abstract class Server<M extends MethodCollection, E extends Events = Events> {
  /* client connections data */
  protected connectionNumber: number = 0;
  protected readonly connections: { [id: string]: ClientData } = {};

  /* server creation data */
  protected readonly eventLogger: EventLogger<E>;
  private readonly port: number;
  private readonly host: string;
  private readonly backlog: number;
  private server: NetServer;
  private readonly rpcTimeout: number;

  constructor(options: ServerOptions<E>) {
    this.eventLogger = (options.eventLogger || getBasicEventLogger()) as EventLogger<E>;

    this.eventLogger.add('SERVER_START', { version: APP_VERSION });

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
        this.eventLogger.add('SERVER_READY', {
          host: this.host,
          port: this.port,
        } as Events['SERVER_READY']);
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
        this.eventLogger.add('SERVER_STOP_ERROR', { error });
      } else {
        this.eventLogger.add('SERVER_STOP', undefined);
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
      this.eventLogger.add('SERVER_RPC_REQUEST', {
        params,
        method: method as string,
        clientId: clientData.id,
      });

      // response
      let hasTimeout = false;
      const rpcTimeoutHandler = setTimeout(() => {
        hasTimeout = true;
        this.eventLogger.add('SERVER_RPC_TIMEOUT', {
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
        this.eventLogger.add('SERVER_RPC_NOT_IMPLEMENTED', {
          method: method as string,
          clientId: clientData.id,
        });
        reject(msg.type);
        return;
      }

      if (msg.type === 'ERROR_METHOD_EXCEPTION') {
        this.eventLogger.add('SERVER_RPC_EXCEPTION', {
          method: method as string,
          clientId: clientData.id,
          error: msg.error,
        });
        reject(msg.type);
        return;
      }

      if (!hasTimeout) {
        const time = new Date().getTime() - startTime;

        const valid = this.rpcDataValidation(method, msg.result);
        if (!valid) {
          this.eventLogger.add('SERVER_RPC_RUNTIME_VALIDATION_ERROR', {
            method: method as string,
            clientId: clientData.id,
            data: msg.result,
          });
          reject('SERVER_RPC_RUNTIME_VALIDATION_ERROR');
          return;
        }

        this.eventLogger.add('SERVER_RPC_RESPONSE', {
          time,
          method: method as string,
          clientId: clientData.id,
          result: msg.result,
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
   * This function will be called in each `callRpcMethod` with the data result to allow runtime validation.
   * If it returns `false`, it will trigger an error
   */
  protected rpcDataValidation(call: keyof M, response: unknown): boolean {
    return true;
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

    this.eventLogger.add('SERVER_CONNECTION_INCOMING', {
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
    this.eventLogger.add('SERVER_CONNECTION_CLOSED', { error, clientId: client.id });
    this.onClientDisconnection(client, error);
  }

  private handleError(error: Error): void {
    this.eventLogger.add('SERVER_ERROR', { error });
  }

  private handleClose(): void {
    this.eventLogger.add('SERVER_CLOSE', undefined);
  }

  private async handshake(client: ClientData): Promise<void> {
    await client.tx.send<HandShakeMsg>({
      type: 'HANDSHAKE',
      id: client.id,
    });
    const ack = await client.tx.waitData<HandShakeAckMsg>();
    if (ack.type !== 'HANDSHAKE_ACK' || ack.id !== client.id) {
      client.socket.end(() => {
        this.eventLogger.add('SERVER_HANDSHAKE_ACK_ERROR', { clientId: client.id });
      });
      return;
    }
    this.eventLogger.add('SERVER_HANDSHAKE_ACK_OK', { clientId: client.id });
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
