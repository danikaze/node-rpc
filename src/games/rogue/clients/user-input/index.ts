import * as blessed from 'blessed';
import { Layout } from './layout';
import { N_COLS, N_ROWS } from './layout/rules';
import { Map } from './widget/map';
import {
  TurnInfo,
  PlayerAction,
  TileType,
  Entity,
  ObjectType,
  CreatureType,
  ViewInfo,
  PlayerInfo,
  ActionOpenDoor,
  ActionTakeObject,
  ActionAttack,
  ActionUseObject,
} from '../../method-interface';
import { PlayerData } from './widget/player-data';
import { ActionList, Action } from './widget/action-list';
import { Info } from './widget/info';
import { MapInfo } from './widget/map-info';
import { formatConstString } from './widget/format-const-string';

export interface MatrixMap {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  tiles: TileInfo[][];
}

export interface TileInfo {
  type: TileType;
  rx: number;
  ry: number;
  object?: Entity<ObjectType>;
  entity?: Entity<CreatureType> | { type: 'PJ' };
}

export class Ui {
  protected readonly screen: blessed.Widgets.Screen;
  protected readonly layout: Layout;
  protected readonly map: Map;
  protected readonly mapInfo: MapInfo;
  protected readonly playerData: PlayerData;
  protected readonly actionList: ActionList;
  protected readonly info: Info;

  protected matrix: MatrixMap;
  protected playerInfo: PlayerInfo;

  constructor() {
    this.screen = blessed.screen({ smartCSR: true });
    this.layout = new Layout({
      screen: this.screen,
      cols: N_COLS,
      rows: N_ROWS,
    });
    this.map = new Map({ screen: this.screen });
    this.mapInfo = new MapInfo({ screen: this.screen });
    this.playerData = new PlayerData({ screen: this.screen });
    this.actionList = new ActionList({ screen: this.screen });
    this.info = new Info({ screen: this.screen });

    this.layout.addWidget('map', this.map);
    this.layout.addWidget('mapInfo', this.mapInfo);
    this.layout.addWidget('playerData', this.playerData);
    this.layout.addWidget('actions', this.actionList);
    this.layout.addWidget('text', this.info);

    this.screen.key(['C-c'], () => process.exit(0));
  }

  /**
   * Update the UI with the latest information from the server
   */
  public update(info: TurnInfo): void {
    this.playerInfo = info.player;
    this.matrix = this.mapInfoToMatrix(info.view);
    this.map.update(this.matrix);
    this.mapInfo.update(this.matrix);
    this.actionList.setEnabledActions(this.getPossibleActions(info.player));
    this.playerData.update(info.player);

    this.screen.render();
  }

  /**
   * Wait for the user input to get the next action to send to the server
   */
  public async getAction(): Promise<PlayerAction> {
    const action = await this.actionList.getAction();
    // how to remove the focus of one element without giving it to another?
    this.map.focus();

    // add parameters to the action if needed
    if (action.type.includes('DOOR')) {
      const tiles = this.getNearByObjects(type =>
        (action.type === 'OPEN_DOOR' ? /(CLOSED|LOCKED)_DOOR/ : /OPEN_DOOR/).test(type)
      );
      const data = tiles.map(tile => ({
        text: `Door at (${tile.rx}, ${tile.ry})`,
        value: tile.object.id,
      }));
      (action as ActionOpenDoor).doorId =
        data.length === 1 ? data[0].value : await this.actionList.getSubAction(data);
    }
    if (action.type === 'TAKE') {
      const tiles = this.getNearByObjects(type => !/(TRAP)|(DOOR)/.test(type));
      const data = tiles.map(tile => ({
        text: `${formatConstString(tile.object.type)} at (${tile.rx}, ${tile.ry})`,
        value: tile.object.id,
      }));
      (action as ActionTakeObject).objectId =
        data.length === 1 ? data[0].value : await this.actionList.getSubAction(data);
    }
    if (action.type === 'ATTACK') {
      const tiles = this.getAttackableEntities();
      const data = tiles.map(tile => ({
        text: `${formatConstString(tile.object.type)} at (${tile.rx}, ${tile.ry})`,
        value: tile.object.id,
      }));
      (action as ActionAttack).targetId =
        data.length === 1 ? data[0].value : await this.actionList.getSubAction(data);
    }
    if (action.type === 'USE') {
      const data = this.playerInfo.inventory.map(item => ({
        text: formatConstString(item.type),
        value: item.id,
      }));
      (action as ActionUseObject).objectId = await this.actionList.getSubAction(data);
    }

    this.addText(` ${JSON.stringify(action)}`);
    return action as PlayerAction;
  }

  /**
   * Add text to the info widget
   */
  public addText(text: string): void {
    if (!text) {
      return;
    }
    this.info.add(text);
    this.screen.render();
  }

  /**
   * Transform the array of information into a matrix
   */
  protected mapInfoToMatrix(info: ViewInfo): MatrixMap {
    const tiles: TileInfo[][] = [];
    let centerX = -Infinity;
    let centerY = -Infinity;
    let maxX = 0;
    let maxY = 0;

    // because the positions are relative, we need to offset the center
    info.map.forEach(tile => {
      centerX = Math.max(centerX, -tile.x);
      centerY = Math.max(centerY, -tile.y);
      maxX = Math.max(maxX, tile.x);
      maxY = Math.max(maxY, tile.y);
    });

    // then we can construct the matrix
    info.map.forEach(tile => {
      const x = tile.x + centerX;
      const y = tile.y + centerY;
      if (!tiles[y]) {
        tiles[y] = [];
      }
      tiles[y][x] = {
        type: tile.data,
        rx: tile.x,
        ry: tile.y,
      };
    });
    info.objects.forEach(tile => {
      const x = tile.x + centerX;
      const y = tile.y + centerY;
      if (!tiles[y][x]) return;
      tiles[y][x].object = tile.data;
    });
    info.entities.forEach(tile => {
      const x = tile.x + centerX;
      const y = tile.y + centerY;
      if (!tiles[y][x]) return;
      tiles[y][x].entity = tile.data;
    });

    // we know the PJ is always in the center
    tiles[centerY][centerX].entity = { type: 'PJ' };

    return {
      centerX,
      centerY,
      tiles,
      width: centerX + maxX + 1,
      height: centerY + maxY + 1,
    };
  }

  protected getTile(dx: number, dy: number): TileInfo {
    return this.matrix.tiles[this.matrix.centerY + dx][this.matrix.centerX + dy];
  }

  protected getNearByTiles(includeOrigin?: boolean): TileInfo[] {
    const tiles = [
      this.getTile(-1, 0),
      this.getTile(1, 0),
      this.getTile(0, -1),
      this.getTile(0, 1),
    ];

    if (includeOrigin) {
      tiles.push(this.getTile(0, 0));
    }

    return tiles.filter(t => !!t);
  }

  protected getAttackableEntities(): TileInfo[] {
    const range = this.playerInfo.inventory.find(item => item.type === 'MAGIC_WAND') ? 0 : 1;

    if (range) {
      return this.getNearByTiles().filter(tile => tile.entity && tile.entity.type !== 'PJ');
    }

    const res = [];
    for (const row of this.matrix.tiles) {
      for (const tile of row) {
        if (tile && tile.entity) {
          res.push(tile.entity);
        }
      }
    }
    return res;
  }

  protected getNearByObjects(filter?: (object: ObjectType) => boolean): TileInfo[] {
    return this.getNearByTiles(true).filter(
      tile => tile.object && (!filter || filter(tile.object.type))
    );
  }

  /**
   * Given the turn info, set the possible actions to do
   */
  protected getPossibleActions(player: PlayerInfo): Action[] {
    const isPassable = (dx: number, dy: number): boolean => {
      const tile = this.getTile(dx, dy);
      return (
        tile &&
        (tile.type === 'EMPTY' &&
          !tile.entity &&
          (!tile.object ||
            (tile.object.type !== 'CLOSED_DOOR' && tile.object.type !== 'LOCKED_DOOR')))
      );
    };

    const canOpenDoor = (): boolean => {
      const hasKey = player.inventory.find(obj => obj.type === 'KEY') !== undefined;
      const tiles = this.getNearByObjects(
        type => type === 'CLOSED_DOOR' || (type === 'LOCKED_DOOR' && hasKey)
      );

      return tiles.length > 0;
    };

    const canCloseDoor = (): boolean =>
      this.getNearByObjects(type => type === 'OPEN_DOOR').length > 0;

    const canTakeObject = (): boolean =>
      this.getNearByObjects(type => !/(TRAP)|(DOOR)/.test(type)).length > 0;

    const canUseObject = (): boolean => this.playerInfo.inventory.length > 0;

    const possibleActions: Action[] = ['PASS'];

    if (isPassable(-1, 0)) {
      possibleActions.push('MOVE_N');
    }

    if (isPassable(1, 0)) {
      possibleActions.push('MOVE_S');
    }

    if (isPassable(0, -1)) {
      possibleActions.push('MOVE_W');
    }

    if (isPassable(0, 1)) {
      possibleActions.push('MOVE_E');
    }

    if (canOpenDoor()) {
      possibleActions.push('OPEN_DOOR');
    }

    if (canCloseDoor()) {
      possibleActions.push('CLOSE_DOOR');
    }

    if (canTakeObject()) {
      possibleActions.push('TAKE');
    }

    if (canUseObject()) {
      possibleActions.push('USE');
    }

    if (this.getAttackableEntities().length > 0) {
      possibleActions.push('ATTACK');
    }

    return possibleActions;
  }
}
