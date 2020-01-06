import { MethodCollection } from '../../utils/msgs';

export interface MethodInterface extends MethodCollection {
  /** Initial information requested by the server */
  info: () => ClientInfo;
  /** Method called each turn */
  turn: (info: TurnInfo) => PlayerAction;
  /** Information (ACK) from the server when the turn response is received */
  msg: (text: string, error?: ActionResultError) => null;
}

export interface ClientInfo {
  name: string;
}

export interface Position<T = never> {
  /** horizontal position to the player (< 0 is left, > 0 is right) */
  x: number;
  /** vertical position to the player (< 0 is up, > 0 is down) */
  y: number;
  /** whatever is in that position */
  data?: T;
}

export type TileType = 'EMPTY' | 'WALL';
export type PlayerAction =
  | ActionPass
  | ActionMove
  | ActionAttack
  | ActionUseObject
  | ActionOpenDoor
  | ActionCloseDoor
  | ActionTakeObject;
export type ObjectType =
  // map objects
  | 'OPEN_DOOR'
  | 'CLOSED_DOOR'
  | 'LOCKED_DOOR'
  | 'TRAP'
  // consumible objects
  | 'KEY'
  | 'ANTIDOTE'
  | 'SMALL_HEALTH_PACK'
  | 'BIG_HEALTH_PACK'
  // weapons
  | 'MAGIC_WAND'
  | 'KNIFE'
  | 'SWORD'
  // others
  | 'TREASURE'
  | 'LIGHT';
export type CreatureType = 'PLAYER' | 'ENEMY';
export type AbnormalState = 'POISON';

export interface Entity<T> {
  id: number;
  type: T;
}

export type ActionPass = { type: 'PASS' };
export type ActionMove =
  | { type: 'MOVE'; direction: 'N' } // up
  | { type: 'MOVE'; direction: 'S' } // down
  | { type: 'MOVE'; direction: 'W' } // left
  | { type: 'MOVE'; direction: 'E' }; // right
export type ActionAttack = { type: 'ATTACK'; targetId: number };
export type ActionUseObject = { type: 'USE'; objectId: number };
export type ActionOpenDoor = { type: 'OPEN_DOOR'; doorId: number };
export type ActionCloseDoor = { type: 'CLOSE_DOOR'; doorId: number };
export type ActionTakeObject = { type: 'TAKE'; objectId: number };

export interface ViewInfo {
  map: Position<TileType>[];
  objects: Position<Entity<ObjectType>>[];
  entities: Position<Entity<CreatureType>>[];
}

export interface TurnInfo {
  /** Information about the player */
  player: PlayerInfo;
  /** All positions are relative to the player's */
  view: ViewInfo;
}

export interface PlayerInfo {
  /** Max HP */
  maxHp: number;
  /** Health Points */
  hp: number;
  /** Vision radius */
  viewRadius: number;
  /** List of current abnormal states */
  abnormalState: AbnormalState[];
  /** List of items */
  inventory: Entity<ObjectType>[];
}

export type ActionResultError =
  | 'INVALID_ACTION'
  | 'INVALID_MOVEMENT'
  | 'INVALID_DOOR_ID'
  | 'INVALID_OBJECT_ID'
  | 'INVALID_TARGET_ID'
  | 'OUT_OF_RANGE'
  | 'NOT_VISIBLE'
  | 'DOOR_LOCKED';

/**
 * Interface that clients need to implement
 */
