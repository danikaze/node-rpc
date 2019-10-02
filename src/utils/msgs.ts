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
