import {
  MethodInterface,
  TurnInfo,
  PlayerAction,
  ActionResultError,
  ViewInfo,
  ClientInfo,
  TileType,
  Entity,
  CreatureType,
  ObjectType,
} from '../method-interface';

export const implementation: MethodInterface = {
  info,
  turn,
  msg,
};

interface TileInfo {
  type: TileType;
  object?: Entity<ObjectType>;
  entity?: Entity<CreatureType>;
}

const directions: { direction: 'N' | 'S' | 'W' | 'E'; coords: { x: number; y: number } }[] = [
  { direction: 'N', coords: { x: 0, y: -1 } },
  { direction: 'S', coords: { x: 0, y: 1 } },
  { direction: 'W', coords: { x: -1, y: 0 } },
  { direction: 'E', coords: { x: 1, y: 0 } },
];

/**
 * Return Client information requested by the server before starting the game
 */
function info(): ClientInfo {
  return {
    // moves randomly and doesn't attack :P
    name: 'Wanderer Pacifist',
  };
}

/*
 * This player just moves randomly over the map,
 * opening doors if needed and picking up treasures
 */
function turn(info: TurnInfo): PlayerAction {
  // tslint:disable-next-line: no-magic-numbers
  const firstOption = ((Math.random() * 123456789) | 0) % directions.length;
  let i = firstOption;

  do {
    const tile = getTile(info.view, directions[i].coords);

    if (tile && (!tile.object || tile.object.type !== 'TRAP') && !tile.entity) {
      if (tile.object && tile.object.type === 'CLOSED_DOOR') {
        return { type: 'OPEN_DOOR', doorId: tile.object.id };
      }

      if (tile.object && tile.object.type === 'TREASURE') {
        return { type: 'TAKE', objectId: tile.object.id };
      }

      if (tile.type === 'EMPTY') {
        return { type: 'MOVE', direction: directions[i].direction };
      }
    }

    i = (i + 1) % directions.length;
  } while (i !== firstOption);

  return { type: 'PASS' };
}

function msg(text: string, error?: ActionResultError): null {
  // tslint:disable-next-line: no-console
  console.log(error || 'OK');
  return null;
}

function getTile(view: ViewInfo, { x, y }: { x: number; y: number }): TileInfo {
  const compareCoords = tile => tile.x === x && tile.y === y;
  const map = view.map.filter(compareCoords)[0];

  if (!map) {
    return;
  }

  const object = view.objects.filter(compareCoords)[0];
  const entity = view.entities.filter(compareCoords)[0];

  return {
    type: map.data,
    object: object && object.data,
    entity: entity && entity.data,
  };
}
