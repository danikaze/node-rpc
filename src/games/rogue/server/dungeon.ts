import {
  CreatureType,
  ObjectType,
  Position,
  TileType,
  Entity,
  ViewInfo,
} from '../method-interface';
import { Player } from './player';
import { generateEntityId } from './entity';
import { getRandomInt } from './random';

export interface DungeonObjectsOptions {
  list: {
    // object: [min, max]
    [key in ObjectType]?: [number, number];
  };
  hPartitions: number;
  vPartitions: number;
}

export interface DungeonOptions {
  lineOfSight: boolean;
  objects?: Partial<DungeonObjectsOptions>;
}

interface MapRange {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface TileInfo {
  type: TileType;
  object?: Entity<ObjectType>;
  entity?: Entity<CreatureType>;
}

export const CHAR_SPAWN_POSITION = '@';
export const CHAR_WALL = '#';
export const CHAR_EMPTY = ' ';
export const CHAR_CLOSED_DOOR = '+';
export const CHAR_OPEN_DOOR = '.';
export const CHAR_LOCKED_DOOR = '*';

export class Dungeon {
  /** Current map status */
  private readonly map: TileInfo[][] = []; // [y][x]
  /** List of spawn positions */
  private readonly spawnPositions: Position[] = [];
  /** If using LoS or not to provide the map to the players */
  private readonly lineOfSight: boolean;
  /** Options to use in the map generation */
  private readonly generation: {
    source: string[];
    objects: DungeonObjectsOptions;
  };

  constructor(charMap: string[], options: DungeonOptions) {
    this.lineOfSight = !!options.lineOfSight;

    // tslint:disable: no-magic-numbers
    this.generation = {
      source: charMap,
      objects: {
        list: {
          TRAP: [4, 8],
          KEY: [2, 4],
          ANTIDOTE: [1, 3],
          SMALL_HEALTH_PACK: [4, 4],
          BIG_HEALTH_PACK: [2, 2],
          MAGIC_WAND: [1, 2],
          KNIFE: [4, 6],
          SWORD: [2, 3],
          TREASURE: [8, 15],
          LIGHT: [4, 7],
          ...(options.objects && options.objects.list),
        },
        vPartitions: Math.max((options.objects && options.objects.hPartitions) || 1, 1),
        hPartitions: Math.max((options.objects && options.objects.vPartitions) || 1, 1),
      },
    };
    this.reset(charMap);
  }

  /**
   * Reset the map, with an new source if specified
   */
  public reset(newSource?: string[]): void {
    if (newSource) {
      this.generation.source = newSource;
    }

    this.generateMap();
    this.generateObjects();
    this.generateEntities();
  }

  public isPasable(x: number, y: number): boolean {
    const tile = this.map[y][x];
    return (
      tile &&
      tile.type === 'EMPTY' &&
      (!tile.object ||
        (tile.object.type !== 'LOCKED_DOOR' && tile.object.type !== 'CLOSED_DOOR')) &&
      !tile.entity
    );
  }

  public isVisible(x0: number, y0: number, x1: number, y1: number): boolean;

  public isVisible(origin: Position, target: Position): boolean;

  // TODO: Make the Line Of Sight work ^^;
  public isVisible(a: number | Position, b: number | Position, c?: number, d?: number): boolean {
    // number of times we check inside a tile if the line was perfectly horizontal/vertical
    // the higher, the more precise but the slower
    const PRECISION = 2;

    // support both function signatures
    let x: number; // origin
    let y: number;
    let x1: number; // target
    let y1: number;
    if (typeof a === 'object' && typeof b === 'object') {
      x = a.x;
      y = a.y;
      x1 = b.x;
      y1 = b.y;
    } else {
      x = a as number;
      y = b as number;
      x1 = c;
      y1 = d;
    }

    if (x === x1 && y === y1) return true;

    // ray-tracing between origin and target
    // if any of the tiles it's a wall, then
    // the target is not visible from the origin
    const xx = Math.abs(x1 - x);
    const yy = Math.abs(y1 - y);
    const length = PRECISION * Math.max(xx, yy);
    const dx = (x1 - x) / length;
    const dy = (y1 - y) / length;
    let rx: number;
    let ry: number;

    for (;;) {
      x += dx;
      y += dy;
      rx = Math.round(x);
      ry = Math.round(y);

      if (rx === x1 && ry === y1) return true;
      if (this.map[ry][rx].type === 'WALL') return false;
    }
  }

  /**
   * Get a specific spawn location
   * @param i index of the spawn location
   */
  public getSpawn(i: number): Position;

  /**
   * Get a random spawn location not included in the passed list
   */
  public getSpawn(usedPositions: Position[]): Position;

  // implementation
  public getSpawn(i: number | Position[]): Position {
    // return the specified position
    if (typeof i === 'number') {
      return this.spawnPositions[i];
    }
    // return a random, not used position
    const random = getRandomInt(0, this.spawnPositions.length - 1);
    let p = random;
    do {
      const pos = this.spawnPositions[p];
      if (!i.find(sp => sp.x === pos.x && sp.y === pos.y)) {
        return pos;
      }
      p++;
    } while (p !== random);
  }

  public getViewInfo(player: Player): ViewInfo {
    const { x, y } = player;
    const radius = player.getViewRadius();

    return {
      map: this.getTileInfo({ x, y, radius, info: 'type' }),
      objects: this.getTileInfo({ x, y, radius, info: 'object' }),
      entities: this.getTileInfo({ x, y, radius, info: 'entity' }),
    };
  }

  public find<ObjectType>(id: number): Position<ObjectType>;

  public find<EntityType>(id: number): Position<EntityType>;

  public find(id: number): Position<Entity<ObjectType | CreatureType>> {
    const found = this.findInMap(tile => tile.object && tile.object.id === id);
    if (found) {
      return {
        x: found.x,
        y: found.y,
        data: {
          id:
            (found.data.object && found.data.object.id) ||
            (found.data.entity && found.data.entity.id),
          type:
            ((found.data.object && found.data.object.type) as ObjectType) ||
            ((found.data.entity && found.data.entity.type) as CreatureType),
        },
      };
    }
  }

  public getObject(x: number, y: number): Entity<ObjectType> {
    const tile = this.map[y][x];
    return tile && tile.object;
  }

  public removeObject(id: number): void {
    const found = this.findInMap(tile => tile.object && tile.object.id === id);
    if (found) {
      this.map[found.y][found.x].object = undefined;
    }
  }

  public openDoor(id: number): void {
    const found = this.findInMap(
      tile => tile.object && tile.object.id === id && tile.object.type.indexOf('DOOR') !== -1
    );
    if (found) {
      found.data.object.type = 'OPEN_DOOR';
    }
  }

  public closeDoor(id: number): void {
    const found = this.findInMap(
      tile => tile.object && tile.object.id === id && tile.object.type.indexOf('DOOR') !== -1
    );
    if (found) {
      found.data.object.type = 'CLOSED_DOOR';
    }
  }

  protected findInMap(cb: (tile: TileInfo) => boolean): Position<TileInfo> {
    const map = this.map;
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[0].length; x++) {
        const tile = map[y][x];
        if (cb(tile)) {
          return {
            x,
            y,
            data: tile,
          };
        }
      }
    }
  }

  protected getRange(x: number, y: number, radius: number): MapRange {
    return {
      x0: Math.max(0, x - radius),
      x1: Math.min(x + radius, this.map[0].length - 1),
      y0: Math.max(0, y - radius),
      y1: Math.min(y + radius, this.map.length - 1),
    };
  }

  protected getTileInfo(opt: {
    info: 'type';
    x: number;
    y: number;
    radius: number;
  }): Position<TileType>[];

  protected getTileInfo(opt: {
    info: 'object';
    x: number;
    y: number;
    radius: number;
  }): Position<Entity<ObjectType>>[];

  protected getTileInfo(opt: {
    info: 'entity';
    x: number;
    y: number;
    radius: number;
  }): Position<Entity<CreatureType>>[];

  protected getTileInfo<R>(opt: {
    info: string;
    x: number;
    y: number;
    radius: number;
  }): Position<R>[] {
    const { info, x, y, radius } = opt;
    const res: Position<R>[] = [];
    const { x0, x1, y0, y1 } = this.getRange(x, y, radius);

    for (let i = x0; i <= x1; i++) {
      for (let j = y0; j <= y1; j++) {
        if (!this.lineOfSight || this.isVisible(x, y, i, j)) {
          const data = this.map[j][i][info];
          if (data) {
            res.push({
              data,
              x: i - x,
              y: j - y,
            });
          }
        }
      }
    }

    return res;
  }

  protected generateMap(): void {
    this.generation.source.forEach((line, y) => {
      this.map[y] = [];
      for (let x = 0; x < line.length; x++) {
        const char = line[x];
        const tile: TileInfo = { type: char === CHAR_WALL ? 'WALL' : 'EMPTY' };
        this.map[y][x] = tile;
        switch (char) {
          case CHAR_SPAWN_POSITION:
            this.spawnPositions.push({ x, y });
            break;
          case CHAR_CLOSED_DOOR:
            tile.object = {
              id: generateEntityId(),
              type: 'CLOSED_DOOR',
            };
            break;
          case CHAR_OPEN_DOOR:
            tile.object = {
              id: generateEntityId(),
              type: 'OPEN_DOOR',
            };
            break;
          case CHAR_LOCKED_DOOR:
            tile.object = {
              id: generateEntityId(),
              type: 'LOCKED_DOOR',
            };
            break;
          case CHAR_WALL:
          case CHAR_EMPTY:
            break;
          default:
            throw new Error(`Error reading map. Unkown char "${char}" at (${x}, ${y})`);
        }
      }
    });
  }

  protected generateObjects(): void {
    const options = this.generation.objects;
    const partitions = this.getMapPartitions(options.hPartitions, options.vPartitions);

    Object.entries(options.list).forEach(([type, [min, max]]) => {
      partitions.sort(() => getRandomInt(-1, 1));
      let n = getRandomInt(min, max);
      let p = -1;
      while (n > 0) {
        // choose a partition
        p = (p + 1) % partitions.length;
        const partition = partitions[p];
        // get an empty randome tile of the partition
        let tile: TileInfo;
        do {
          const x = getRandomInt(partition.y0, partition.x1);
          const y = getRandomInt(partition.y0, partition.y1);
          tile = this.map[y][x];
        } while (!tile || tile.type !== 'EMPTY' || tile.object);
        // add the object
        tile.object = {
          type: type as ObjectType,
          id: generateEntityId(),
        };
        n--;
      }
    });
  }

  protected generateEntities(): void {}

  protected getMapPartitions(hPartitions: number, vPartitions: number): MapRange[] {
    function getStarts(available: number, nCells: number): number[] {
      const starts = [];

      const tilesPerCell = available / nCells;
      for (let i = 0; i < nCells; i++) {
        starts[i] = Math.round(tilesPerCell * i);
      }
      starts[nCells] = available;

      return starts;
    }

    const partitions: MapRange[] = [];
    const hStarts = getStarts(this.map[0].length, vPartitions);
    const vStarts = getStarts(this.map.length, hPartitions);

    for (let i = 0; i < hStarts.length - 1; i++) {
      for (let j = 0; j < vStarts.length - 1; j++) {
        partitions.push({
          x0: hStarts[i],
          x1: hStarts[i + 1] - 1,
          y0: vStarts[j],
          y1: vStarts[j + 1] - 1,
        });
      }
    }

    return partitions;
  }
}
