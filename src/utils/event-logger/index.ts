import { EventLogger } from './event-logger';
import { EventType, EventData } from './event-types';

const instance = new EventLogger();

/*
 * Just multiple definitions to provide correct typing of the `data` parameter depending on the type
 */
export function logEvent(type: 'SERVER_START', data: EventData['SERVER_START']): void;
export function logEvent(type: 'SERVER_READY', data: EventData['SERVER_READY']): void;
export function logEvent(type: 'SERVER_STOP'): void;
export function logEvent(type: 'SERVER_STOP_ERROR', data: EventData['SERVER_STOP_ERROR']): void;
export function logEvent(
  type: 'SERVER_CONNECTION_INCOMING',
  data: EventData['SERVER_CONNECTION_INCOMING']
): void;
export function logEvent(
  type: 'SERVER_CONNECTION_CLOSED',
  data: EventData['SERVER_CONNECTION_CLOSED']
): void;
export function logEvent(
  type: 'SERVER_CONNECTION_ERROR',
  data: EventData['SERVER_CONNECTION_ERROR']
): void;
export function logEvent(type: 'SERVER_ERROR', data: EventData['SERVER_ERROR']): void;
export function logEvent(type: 'SERVER_CLOSE'): void;
export function logEvent(
  type: 'SERVER_HANDSHAKE_ACK_OK',
  data: EventData['SERVER_HANDSHAKE_ACK_OK']
): void;
export function logEvent(
  type: 'SERVER_HANDSHAKE_ACK_ERROR',
  data: EventData['SERVER_HANDSHAKE_ACK_ERROR']
): void;
export function logEvent(type: 'SERVER_RPC_REQUEST', data: EventData['SERVER_RPC_REQUEST']): void;
export function logEvent(type: 'SERVER_RPC_RESPONSE', data: EventData['SERVER_RPC_RESPONSE']): void;
export function logEvent(type: 'SERVER_RPC_TIMEOUT', data: EventData['SERVER_RPC_TIMEOUT']): void;
export function logEvent(
  type: 'SERVER_RPC_NOT_IMPLEMENTED',
  data: EventData['SERVER_RPC_NOT_IMPLEMENTED']
): void;
export function logEvent(type: 'CLIENT_START', data: EventData['CLIENT_START']): void;
export function logEvent(type: 'CLIENT_CONNECTED', data: EventData['CLIENT_CONNECTED']): void;
export function logEvent(type: 'CLIENT_ERROR', data: EventData['CLIENT_ERROR']): void;
export function logEvent(type: 'CLIENT_CODE_LOAD', data: EventData['CLIENT_CODE_LOAD']): void;
export function logEvent(
  type: 'CLIENT_CODE_LOAD_ERROR',
  data: EventData['CLIENT_CODE_LOAD_ERROR']
): void;
export function logEvent(type: EventType, data?: EventData[EventType]): void {
  instance.add(type, data);
}
