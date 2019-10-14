export interface Events {
  // server events
  SERVER_START: {
    version: string;
  };
  SERVER_READY: {
    host: string;
    port: number;
  };
  SERVER_STOP: undefined;
  SERVER_STOP_ERROR: {
    error: Error;
  };
  SERVER_CONNECTION_INCOMING: {
    clientId: string;
    address: string;
    port: number;
  };
  SERVER_CONNECTION_CLOSED: {
    clientId: string;
    error?: Error;
  };
  SERVER_CONNECTION_ERROR: {
    clientId: string;
    error: Error;
  };
  SERVER_ERROR: {
    error: Error;
  };
  SERVER_CLOSE: undefined;
  SERVER_HANDSHAKE_ACK_OK: {
    clientId: string;
  };
  SERVER_HANDSHAKE_ACK_ERROR: {
    clientId: string;
  };
  SERVER_RPC_REQUEST: {
    clientId: string;
    method: string;
    params?: unknown[];
  };
  SERVER_RPC_RESPONSE: {
    clientId: string;
    method: string;
    time: number;
    result: unknown;
  };
  SERVER_RPC_TIMEOUT: {
    clientId: string;
    method: string;
    time: number;
  };
  SERVER_RPC_NOT_IMPLEMENTED: {
    clientId: string;
    method: string;
  };
  SERVER_RPC_EXCEPTION: {
    clientId: string;
    method: string;
    error: string;
  };
  SERVER_RPC_RUNTIME_VALIDATION_ERROR: {
    clientId: string;
    method: string;
    data: unknown;
  };
  SERVER_CLIENT_END: {
    clientId: string;
  };

  // client events
  CLIENT_START: {
    version: string;
  };
  CLIENT_CONNECTED: {
    clientId: string;
    host: string;
    port: number;
  };
  CLIENT_ERROR: {
    error: Error;
  };
  CLIENT_CODE_LOAD: {
    path: string;
  };
  CLIENT_CODE_LOAD_ERROR: {
    path: string;
    error: Error;
  };
  CLIENT_RPC_REQUEST: {
    method: string;
    params?: unknown[];
  };
  CLIENT_RPC_RESPONSE: {
    method: string;
    result: unknown;
  };
  CLIENT_RPC_EXCEPTION: {
    method: string;
    error: Error;
  };
  CLIENT_CLOSE: undefined;
}
