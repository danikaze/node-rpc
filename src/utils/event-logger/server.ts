import { default as logSystem, NsLogger } from '../logger';
import { stringify, stringifyFunction } from './stringify';

export class ServerLogger {
  protected readonly logger: NsLogger = logSystem.getLogger('server');

  public start(version: string): void {
    this.logger.info(`Starting server v${version}`);
  }

  public ready(host: string, port: number): void {
    this.logger.info(`Server ready on ${host}:${port}`);
  }

  public stop(error?: Error) {
    if (error) {
      this.logger.error(`Server stopped with error ${stringify(error)}`);
    } else {
      this.logger.info(`Server stopped`);
    }
  }

  public connectionIncoming(clientId: string, address: string, port: number) {
    this.logger.info(`Client ${clientId} connecting from ${address}:${port}`);
  }

  public connectionClosed(clientId: string, error?: Error): void {
    this.logger.info(
      `Client ${clientId} disconnected ${error ? `(Error: ${stringify(error)})` : ''}`
    );
  }

  public connectionError(clientId: string, error?: Error): void {
    this.logger.info(`Client ${clientId} connection error: ${stringify(error)}`);
  }

  public error(error: Error): void {
    this.logger.error(`Server error: ${stringify(error)}`);
  }

  public close(): void {
    this.logger.info('Server closed');
  }

  public handshakeAckOk(clientId: string): void {
    this.logger.info(`Client ${clientId} handshake OK`);
  }

  public handshakeAckError(clientId: string): void {
    this.logger.warn(`Client ${clientId} handshake Error`);
  }

  public rpcRequest(clientId: string, method: string, params?: unknown[]): void {
    this.logger.info(`RPC request to ${clientId}: ${stringifyFunction(method, params)}`);
  }

  public rpcResponse(clientId: string, method: string, time: number, result?: unknown): void {
    this.logger.info(
      `RPC response from ${clientId}: ${method}(). Result (${time}ms.): ${stringify(result)}`
    );
  }

  public rpcTimeout(clientId: string, method: string, time: number): void {
    this.logger.warn(`RPC request to ${clientId}: ${method}() timed out after ${time}ms.`);
  }

  public rpcNotImplemented(clientId: string, method: string): void {
    this.logger.warn(`RPC method ${method} not implemented by client ${clientId}`);
  }

  public rpcException(clientId: string, method: string, error: string): void {
    this.logger.warn(
      `RPC method ${method} implementation thrown an exception by ${clientId}: ${error}}`
    );
  }

  public rpcRuntimeValidationError(clientId: string, method: string, data: unknown): void {
    this.logger.warn(
      `RPC response to the method ${method} from ${clientId} didn't validate. Data: ${stringify(
        data
      )}`
    );
  }

  public clientEnd(clientId: string): void {
    this.logger.info(`Client ${clientId} ended`);
  }
}
