import { EventLogger } from './event-logger';
import { Events } from './events';
import { eventDefinitions } from './event-definitions';

const instance = new EventLogger<Events>({
  level: IS_PRODUCTION ? 'error' : 'verbose',
  events: eventDefinitions,
});

/*
 * Just multiple definitions to provide correct typing of the `data` parameter depending on the type
 */
export function logEvent(type: 'SERVER_START', data: Events['SERVER_START']): void;
export function logEvent(type: 'SERVER_READY', data: Events['SERVER_READY']): void;
export function logEvent(type: 'SERVER_STOP'): void;
export function logEvent(type: 'SERVER_STOP_ERROR', data: Events['SERVER_STOP_ERROR']): void;
export function logEvent(
  type: 'SERVER_CONNECTION_INCOMING',
  data: Events['SERVER_CONNECTION_INCOMING']
): void;
export function logEvent(
  type: 'SERVER_CONNECTION_CLOSED',
  data: Events['SERVER_CONNECTION_CLOSED']
): void;
export function logEvent(
  type: 'SERVER_CONNECTION_ERROR',
  data: Events['SERVER_CONNECTION_ERROR']
): void;
export function logEvent(type: 'SERVER_ERROR', data: Events['SERVER_ERROR']): void;
export function logEvent(type: 'SERVER_CLOSE'): void;
export function logEvent(
  type: 'SERVER_HANDSHAKE_ACK_OK',
  data: Events['SERVER_HANDSHAKE_ACK_OK']
): void;
export function logEvent(
  type: 'SERVER_HANDSHAKE_ACK_ERROR',
  data: Events['SERVER_HANDSHAKE_ACK_ERROR']
): void;
export function logEvent(type: 'SERVER_RPC_REQUEST', data: Events['SERVER_RPC_REQUEST']): void;
export function logEvent(type: 'SERVER_RPC_RESPONSE', data: Events['SERVER_RPC_RESPONSE']): void;
export function logEvent(type: 'SERVER_RPC_TIMEOUT', data: Events['SERVER_RPC_TIMEOUT']): void;
export function logEvent(
  type: 'SERVER_RPC_NOT_IMPLEMENTED',
  data: Events['SERVER_RPC_NOT_IMPLEMENTED']
): void;
export function logEvent(type: 'SERVER_RPC_EXCEPTION', data: Events['SERVER_RPC_EXCEPTION']): void;
export function logEvent(
  type: 'SERVER_RPC_RUNTIME_VALIDATION_ERROR',
  data: Events['SERVER_RPC_RUNTIME_VALIDATION_ERROR']
): void;
export function logEvent(type: 'CLIENT_START', data: Events['CLIENT_START']): void;
export function logEvent(type: 'CLIENT_CONNECTED', data: Events['CLIENT_CONNECTED']): void;
export function logEvent(type: 'CLIENT_ERROR', data: Events['CLIENT_ERROR']): void;
export function logEvent(type: 'CLIENT_CODE_LOAD', data: Events['CLIENT_CODE_LOAD']): void;
export function logEvent(
  type: 'CLIENT_CODE_LOAD_ERROR',
  data: Events['CLIENT_CODE_LOAD_ERROR']
): void;
export function logEvent(type: 'CLIENT_RPC_REQUEST', data: Events['CLIENT_RPC_REQUEST']): void;
export function logEvent(type: 'CLIENT_RPC_RESPONSE', data: Events['CLIENT_RPC_RESPONSE']): void;
export function logEvent(type: 'CLIENT_RPC_EXCEPTION', data: Events['CLIENT_RPC_EXCEPTION']): void;
export function logEvent(type: 'CLIENT_CLOSE'): void;
export function logEvent(type: keyof Events, data?: Events[keyof Events]): void {
  instance.add(type, data);
}
