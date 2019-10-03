export interface ClientServerMsg {
  type: string;
}

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

export interface MethodRequestMsg extends ClientServerMsg {
  type: 'METHOD_REQUEST';
  method: string;
  params?: unknown[];
}

export interface MethodResponseMsg extends ClientServerMsg {
  type: 'METHOD_RESULT';
  result: unknown;
}

export interface ErrorNotImplementedMsg extends ClientServerMsg {
  type: 'ERROR_METHOD_NOT_IMPLEMENTED';
  method: string;
}
