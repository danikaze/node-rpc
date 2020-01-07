/** Definition of how to display each tile */
export const charTiles = {
  PJ: '@',
  // tile types
  EMPTY: ' ',
  WALL: '{white-bg} {/white-bg}',
  // map objects
  OPEN_DOOR: '.',
  CLOSED_DOOR: '+',
  LOCKED_DOOR: '*',
  TRAP: '{red-fg}X{/red-fg}',
  // consumible objects
  KEY: '{blue-fg}k{/blue-fg}',
  ANTIDOTE: '{blue-fg}a{/blue-fg}',
  SMALL_HEALTH_PACK: '{blue-fg}h{/blue-fg}',
  BIG_HEALTH_PACK: '{blue-fg}H{/blue-fg}',
  // weapons
  MAGIC_WAND: '{magenta-fg}w{/magenta-fg}',
  KNIFE: '{magenta-fg}s{/magenta-fg}',
  SWORD: '{magenta-fg}S{/magenta-fg}',
  // others
  TREASURE: '{green-fg}!{/green-fg}',
  LIGHT: '{yellow-fg}L{/yellow-fg}',
  // creatures
  PLAYER: '{yellow-fg}P{/yellow-fg}',
  ENEMY: '{red-fg}E{/red-fg}',
};
