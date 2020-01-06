import { Entity, ObjectType, Position, PlayerInfo, AbnormalState } from '../method-interface';
import { distance as calculateDistance } from './distance';
import { weapons } from './weapons';
import { generateEntityId } from './entity';
import { getRandomInt } from './random';

const POISON_MIN_DURATION = 3;
const POISON_MAX_DURATION = 19;
const POISON_DAMAGE = 5;
const PLAYER_NORMAL_VIEW_RADIUS = 3;
const PLAYER_LIGHT_VIEW_RADIUS = 6;
const WAND_RANGE = weapons.MAGIC_WAND.range;

export class Player {
  public name: string;
  public x: number;
  public y: number;

  private readonly maxHp: number = 100;
  private readonly inventory: Entity<ObjectType>[] = [];
  private readonly abnormalStates: { type: AbnormalState; turnsLeft: number }[] = [];
  private hp: number;

  constructor(initialPosition: Position, name: string) {
    this.name = name;
    this.x = initialPosition.x;
    this.y = initialPosition.y;
    this.hp = this.maxHp;
    this.inventory.push({
      type: 'SMALL_HEALTH_PACK',
      id: generateEntityId(),
    });
  }

  public isAlive(): boolean {
    return this.hp > 0;
  }

  public updateStates(): void {
    for (let i = this.abnormalStates.length - 1; i >= 0; i--) {
      const state = this.abnormalStates[i];

      switch (state.type) {
        case 'POISON':
          this.addHp(-POISON_DAMAGE);
          break;
      }

      state.turnsLeft--;
      if (state.turnsLeft === 0) {
        this.abnormalStates.splice(i, 1);
      }
    }
  }

  public findObject(idOrType: number | ObjectType): Entity<ObjectType> {
    const index =
      typeof idOrType === 'string'
        ? this.inventory.findIndex(obj => obj.type === idOrType)
        : this.inventory.findIndex(obj => obj.id === idOrType);
    return this.inventory[index];
  }

  public addObject(object: Entity<ObjectType>): void {
    this.inventory.push(object);
  }

  public removeObject(objectId: number): void {
    const index = this.inventory.findIndex(obj => obj.id === objectId);
    if (index !== -1) {
      this.inventory.splice(index, 1);
    }
  }

  public move(delta: Position): void {
    this.x += delta.x;
    this.y += delta.y;
  }

  public addHp(qty: number): void {
    this.hp = Math.max(0, Math.min(this.hp + qty, this.maxHp));
  }

  public getViewRadius(): number {
    const light = this.inventory.find(item => item.type === 'LIGHT');
    return light ? PLAYER_LIGHT_VIEW_RADIUS : PLAYER_NORMAL_VIEW_RADIUS;
  }

  public getInfo(): PlayerInfo {
    return {
      maxHp: this.maxHp,
      hp: this.hp,
      viewRadius: this.getViewRadius(),
      abnormalState: this.abnormalStates.map(state => state.type),
      inventory: this.inventory,
    };
  }

  public addPoison(): void {
    this.abnormalStates.push({
      type: 'POISON',
      turnsLeft: getRandomInt(POISON_MIN_DURATION, POISON_MAX_DURATION),
    });
  }

  public removePoison(): void {
    let index = this.abnormalStates.findIndex(state => state.type === 'POISON');
    while (index !== -1) {
      this.abnormalStates.splice(index, 1);
      index = this.abnormalStates.findIndex(state => state.type === 'POISON');
    }
  }

  public canAttack(point: Position): boolean {
    const range = this.findObject('MAGIC_WAND') ? WAND_RANGE : 1;
    return calculateDistance(this, point) <= range;
  }

  public selectBestWeapon(to: Position): keyof typeof weapons {
    const distance = calculateDistance(this, to);

    // long-range
    if (distance > 1) {
      return this.findObject('MAGIC_WAND') ? 'MAGIC_WAND' : null;
    }

    // melee
    for (const weapon of ['KNIFE', 'MAGIC_WAND', 'SWORD']) {
      if (this.findObject(weapon as 'KNIFE' | 'MAGIC_WAND' | 'SWORD')) {
        return weapon as 'KNIFE' | 'MAGIC_WAND' | 'SWORD';
      }
    }

    // no weapon
    return 'HANDS';
  }
}
