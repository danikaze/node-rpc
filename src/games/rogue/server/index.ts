import { ClientData } from '../../../utils/server';
import { TurnBasedGameServer, TurnBasedGameServerOptions } from '../../turn-based-server';
import {
  MethodInterface,
  PlayerAction,
  ActionResultError,
  ObjectType,
  Entity,
  Position,
  TurnInfo,
  ClientInfo,
} from '../method-interface';
import { Dungeon } from './dungeon';
import { charMap } from './maps/map-1';
import { Player } from './player';
import { attackDamage } from './weapons';
import { distance } from './distance';
import { isValidId, removeId } from './entity';

export interface RogueGameServerOptions extends TurnBasedGameServerOptions {
  maxTurns?: number;
  applyLineOfSight?: boolean;
}

const directionMap: { [direction: string]: { x: number; y: number } } = {
  N: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
  E: { x: 1, y: 0 },
};

const SMALL_HEALTH_PACK_HP = 25;
const BIG_HEALTH_PACK_HP = 75;

export class RogueGameServer extends TurnBasedGameServer<MethodInterface> {
  private readonly map: Dungeon;
  private readonly players: { [clientId: string]: Player } = {};
  private readonly maxTurns: number;
  private currentTurn: number = 0;

  constructor(options: RogueGameServerOptions) {
    super(options);

    this.maxTurns = options.maxTurns;
    this.map = new Dungeon(charMap, {
      lineOfSight: options.applyLineOfSight,
      objects: {
        hPartitions: 2,
      },
    });
  }

  protected async startGame(): Promise<void> {
    const usedSpawnPositions = [];
    const promises = this.playerIds.map((playerId, i) =>
      this.callRpcMethod<ClientInfo>(playerId, 'info').then(info => {
        const spawnPosition = this.map.getSpawn(usedSpawnPositions);
        usedSpawnPositions.push(spawnPosition);
        this.players[playerId] = new Player(spawnPosition, info.name || playerId);
      })
    );

    await Promise.all(promises);
  }

  protected async endGame(): Promise<void> {
    this.currentTurn = 0;
    this.map.reset();
  }

  protected hasGameEnded(): boolean {
    return (
      (this.maxTurns && this.currentTurn * this.playerIds.length > this.maxTurns) ||
      this.playerIds.filter(id => this.players[id].isAlive()).length <= 0 ||
      this.playerIds.length === 0
    );
  }

  protected async playerAction(client: ClientData): Promise<void> {
    this.currentTurn++;
    const player = this.players[client.id];
    player.updateStates();
    if (!player.isAlive()) {
      await this.playerFeedback(client.id, 'You died');
      return;
    }
    const action = await this.callRpcMethod<PlayerAction>(client.id, 'turn', [
      this.getTurnData(player),
    ]);
    const error = this.validatePlayerAction(player, action);
    if (error) {
      // TODO: Make this work without await (like, a RPC without response)
      await this.playerFeedback(client.id, '', error);
      return;
    }
    await this.applyAction(player, action, this.playerFeedback.bind(this, client.id));
  }

  protected playerFeedback(
    clientId: string,
    msg: string,
    error?: ActionResultError
  ): Promise<void> {
    return this.callRpcMethod<void>(clientId, 'msg', error ? [msg, error] : [msg]);
  }

  protected validatePlayerAction(player: Player, action: PlayerAction): ActionResultError {
    let object: Position<Entity<ObjectType>>;

    switch (action.type) {
      case 'PASS':
        break;
      case 'MOVE':
        const movement = directionMap[action.direction];
        if (!this.map.isPasable(player.x + movement.x, player.y + movement.y)) {
          return 'INVALID_MOVEMENT';
        }
        break;
      case 'ATTACK':
        object = this.map.find(action.targetId);
        if (!object) {
          return 'INVALID_TARGET_ID';
        }
        if (!player.canAttack(object as Position)) {
          return 'OUT_OF_RANGE';
        }
        if (!this.map.isVisible(player, object as Position)) {
          return 'NOT_VISIBLE';
        }
        attackDamage(player.selectBestWeapon(object as Position));
        break;
      case 'OPEN_DOOR':
      case 'CLOSE_DOOR':
        object = this.map.find(action.doorId);
        if (!object || !object.data.type.includes('DOOR')) {
          return 'INVALID_DOOR_ID';
        }
        if (distance(player, object) > 1) {
          return 'OUT_OF_RANGE';
        }
        if (
          action.type === 'OPEN_DOOR' &&
          object.data.type === 'LOCKED_DOOR' &&
          !player.findObject('KEY')
        ) {
          return 'DOOR_LOCKED';
        }
        break;
      case 'TAKE':
        object = this.map.find(action.objectId);
        if (!object || object.data.type.includes('DOOR') || object.data.type === 'TRAP') {
          return 'INVALID_OBJECT_ID';
        }
        if (distance(player, object) > 1) {
          return 'OUT_OF_RANGE';
        }
        break;
      case 'USE':
        if (!isValidId(action.objectId) || !player.findObject(action.objectId)) {
          return 'INVALID_OBJECT_ID';
        }
        break;
      default:
        return 'INVALID_ACTION';
    }
    return null;
  }

  protected async applyAction(
    player: Player,
    action: PlayerAction,
    feedback: (msg: string) => Promise<void>
  ): Promise<void> {
    let object: Entity<ObjectType> | Position<Entity<ObjectType>>;

    switch (action.type) {
      case 'PASS':
        break;
      case 'MOVE':
        const movement = directionMap[action.direction];
        player.x += movement.x;
        player.y += movement.y;
        const tileObject = this.map.getObject(player.x, player.y);
        if (tileObject && tileObject.type === 'TRAP') {
          this.map.removeObject(tileObject.id);
          player.addPoison();
          await feedback('You just stepped into a trap. You are poisoned!');
        }
        break;
      case 'ATTACK':
        break;
      case 'OPEN_DOOR':
        object = this.map.find<Entity<ObjectType>>(action.doorId);
        if (object.data.type === 'LOCKED_DOOR') {
          const key = player.findObject('KEY');
          if (!key) {
            return;
          }
          player.removeObject(key.id);
        }
        this.map.openDoor(action.doorId);
        await feedback('You open the door');
        break;
      case 'CLOSE_DOOR':
        this.map.closeDoor(action.doorId);
        await feedback('You close the door');
        break;
      case 'TAKE':
        object = this.map.find<Entity<ObjectType>>(action.objectId);
        player.addObject(object.data);
        this.map.removeObject(action.objectId);
        await feedback(`You pick: ${object.data.type}`);
        break;
      case 'USE':
        object = player.findObject(action.objectId);
        player.removeObject(action.objectId);
        removeId(action.objectId);
        switch (object.type) {
          case 'ANTIDOTE':
            player.removePoison();
            await feedback(`You remove any traces of poison from your body`);
            break;
          case 'SMALL_HEALTH_PACK':
            player.addHp(SMALL_HEALTH_PACK_HP);
            await feedback(`You feel slighty better`);
            break;
          case 'BIG_HEALTH_PACK':
            player.addHp(BIG_HEALTH_PACK_HP);
            await feedback(`You feel much better`);
            break;
        }
        break;
    }
  }

  protected getTurnData(player: Player): TurnInfo {
    return {
      player: player.getInfo(),
      view: this.map.getViewInfo(player),
    };
  }
}
