import { Events } from './events';
import { EventDefinition } from './event-logger';

function stringify(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export const eventDefinitions: Partial<EventDefinition<Events>> = {
  // server events
  SERVER_START: {
    level: 'info',
    msg: ({ version }: Events['SERVER_START']) => [`Starting server v${version}`],
  },
  SERVER_READY: {
    level: 'info',
    msg: ({ host, port }: Events['SERVER_READY']) => [`Server ready on ${host}:${port}`],
  },
  SERVER_STOP: {
    level: 'info',
    msg: () => ['Server stopped'],
  },
  SERVER_STOP_ERROR: {
    level: 'error',
    msg: ({ error }: Events['SERVER_STOP_ERROR']) => [
      `Server stopped with error ${stringify(error)}`,
    ],
  },
  SERVER_CONNECTION_INCOMING: {
    level: 'info',
    msg: ({ clientId, address, port }: Events['SERVER_CONNECTION_INCOMING']) => [
      `Client ${clientId} connecting from ${address}:${port}`,
    ],
  },
  SERVER_CONNECTION_CLOSED: {
    level: 'info',
    msg: ({ clientId, error }: Events['SERVER_CONNECTION_CLOSED']) => [
      `Client ${clientId} disconnected ${error ? `(Error: ${stringify(error)})` : ''}`,
    ],
  },
  SERVER_CONNECTION_ERROR: {
    level: 'info',
    msg: ({ clientId, error }: Events['SERVER_CONNECTION_ERROR']) => [
      `Client ${clientId} connection error: ${stringify(error)}`,
    ],
  },
  SERVER_ERROR: {
    level: 'info',
    msg: ({ error }: Events['SERVER_ERROR']) => [`Server error: ${stringify(error)}`],
  },
  SERVER_CLOSE: {
    level: 'info',
    msg: () => ['Server closed'],
  },
  SERVER_HANDSHAKE_ACK_OK: {
    level: 'info',
    msg: ({ clientId }: Events['SERVER_HANDSHAKE_ACK_OK']) => [`Client ${clientId} handshake OK`],
  },
  SERVER_HANDSHAKE_ACK_ERROR: {
    level: 'warn',
    msg: ({ clientId }: Events['SERVER_HANDSHAKE_ACK_ERROR']) => [
      `Client ${clientId} handshake Error`,
    ],
  },
  SERVER_RPC_REQUEST: {
    level: 'info',
    msg: ({ clientId, method, params }: Events['SERVER_RPC_REQUEST']) => [
      `RPC request to ${clientId}: ${method}(${(params && params.join(', ')) || ''})`,
    ],
  },
  SERVER_RPC_RESPONSE: {
    level: 'info',
    msg: ({ clientId, method, time, result }: Events['SERVER_RPC_RESPONSE']) => [
      `RPC response from ${clientId}: ${method}(). Result (${time}ms.): ${stringify(result)}`,
    ],
  },
  SERVER_RPC_TIMEOUT: {
    level: 'warn',
    msg: ({ clientId, method, time }: Events['SERVER_RPC_TIMEOUT']) => [
      `RPC request to ${clientId}: ${method}() timed out after ${time}ms.`,
    ],
  },
  SERVER_RPC_NOT_IMPLEMENTED: {
    level: 'warn',
    msg: ({ clientId, method }: Events['SERVER_RPC_NOT_IMPLEMENTED']) => [
      `RPC method ${method} not implemented by client ${clientId}`,
    ],
  },
  SERVER_RPC_EXCEPTION: {
    level: 'warn',
    msg: ({ clientId, method, error }: Events['SERVER_RPC_EXCEPTION']) => [
      `RPC method ${method} implementation thrown an exception by ${clientId}: ${error}}`,
    ],
  },
  SERVER_RPC_RUNTIME_VALIDATION_ERROR: {
    level: 'warn',
    msg: ({ clientId, method, data }: Events['SERVER_RPC_RUNTIME_VALIDATION_ERROR']) => [
      `RPC response to the method ${method} from ${clientId} didn't validate. Data: ${stringify(
        data
      )}`,
    ],
  },

  // client events
  CLIENT_START: {
    level: 'info',
    msg: ({ version }: Events['CLIENT_START']) => [`Starting client v${version}`],
  },
  CLIENT_CONNECTED: {
    level: 'info',
    msg: ({ clientId, host, port }: Events['CLIENT_CONNECTED']) => [
      `Connected to ${host}:${port} with ID ${clientId}`,
    ],
  },
  CLIENT_ERROR: {
    level: 'info',
    msg: ({ error }: Events['CLIENT_ERROR']) => [`Error: ${stringify(error)}`],
  },
  CLIENT_CODE_LOAD: {
    level: 'info',
    msg: ({ path }: Events['CLIENT_CODE_LOAD']) => [`Code loaded from "${path}"`],
  },
  CLIENT_CODE_LOAD_ERROR: {
    level: 'info',
    msg: ({ path, error }: Events['CLIENT_CODE_LOAD_ERROR']) => [
      `Error loading code from "${path}": ${stringify(error)}`,
    ],
  },
  CLIENT_RPC_REQUEST: {
    level: 'info',
    msg: ({ method, params }: Events['CLIENT_RPC_REQUEST']) => [
      `RPC request: ${method}(${(params && params.join(', ')) || ''})`,
    ],
  },
  CLIENT_RPC_RESPONSE: {
    level: 'info',
    msg: ({ method, result }: Events['CLIENT_RPC_RESPONSE']) => [
      `RPC response to ${method}: ${stringify(result)}`,
    ],
  },
  CLIENT_RPC_EXCEPTION: {
    level: 'info',
    msg: ({ method, error }: Events['CLIENT_RPC_EXCEPTION']) => [
      `Runtime exception while executing ${method}: ${error}`,
    ],
  },
  CLIENT_CLOSE: {
    level: 'info',
    msg: () => [`Client closed`],
  },
};
