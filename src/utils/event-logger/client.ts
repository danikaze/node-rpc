import { default as logSystem, NsLogger } from '../logger';
import { stringify, stringifyFunction } from './stringify';

export class ClientLogger {
  private readonly logger: NsLogger;

  constructor() {
    this.logger = logSystem.getLogger('client');
  }

  public start(version: string): void {
    this.logger.info(`Starting client v${version}`);
  }

  public connected(clientId: string, host: string, port: number): void {
    this.logger.info(`Connected to ${host}:${port} with ID ${clientId}`);
  }

  public error(error: Error): void {
    this.logger.error(`Error: ${stringify(error)}`);
  }

  public moduleLoaded(): void {
    this.logger.info(`Code loaded programatically`);
  }

  public codeLoaded(path: string, error?: Error): void {
    if (error) {
      this.logger.error(`Error loading code from "${path}": ${stringify(error)}`);
    } else {
      this.logger.info(`Code loaded from "${path}"`);
    }
  }

  public rpcRequest(method: string, params?: unknown[]): void {
    this.logger.info(`RPC request: ${stringifyFunction(method, params)}`);
  }

  public rpcResponse(method: string, result: unknown): void {
    this.logger.info(`RPC response to ${method}: ${stringify(result)}`);
  }

  public rpcException(method: string, error: Error): void {
    this.logger.error(`Runtime exception while executing ${method}: ${error}`);
  }

  public closed(): void {
    this.logger.info(`Client closed`);
  }
}
