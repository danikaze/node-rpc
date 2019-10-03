export interface ClientServerMsg {
  type: string;
}

export type Method = (...args: unknown[]) => unknown;
export type MethodCollection = { [key: string]: Method };

export interface HandShakeMsg extends ClientServerMsg {
  type: 'HANDSHAKE';
  id: string;
}

export interface HandShakeAckMsg extends ClientServerMsg {
  type: 'HANDSHAKE_ACK';
  id: string;
}

export interface EndMsg extends ClientServerMsg {
  type: 'END';
}

export interface MethodRequestMsg<M extends MethodCollection> extends ClientServerMsg {
  type: 'METHOD_REQUEST';
  method: keyof M;
  params?: unknown[];
}

export interface MethodResponseMsg extends ClientServerMsg {
  type: 'METHOD_RESULT';
  result: unknown;
}

export interface ErrorNotImplementedMsg<M extends MethodCollection> extends ClientServerMsg {
  type: 'ERROR_METHOD_NOT_IMPLEMENTED';
  method: keyof M;
}
