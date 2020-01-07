export type WidgetRule = {
  /** Starting column */
  x: number;
  /** Starting row */
  y: number;
  /** Number of colums to use */
  width: number;
  /** Number of rows to use */
  height: number;
};

export type LayoutRuleType = 'map' | 'mapInfo' | 'text' | 'actions' | 'playerData';
export type LayoutRules = { [key in LayoutRuleType]: WidgetRule };

export const N_COLS = 3;
export const N_ROWS = 3;

// **************
// *        * P *  // P is playerData
// *  MAP   *****
// *        * I *  // I is mapInfo
// **************
// *  TEXT  * K *  // K is keysInfo
// **************
export const rules: LayoutRules = {
  map: {
    x: 0,
    y: 0,
    width: 2,
    height: 2,
  },
  mapInfo: {
    x: 2,
    y: 1,
    width: 1,
    height: 1,
  },
  text: {
    x: 0,
    y: 2,
    width: 2,
    height: 1,
  },
  playerData: {
    x: 2,
    y: 0,
    width: 1,
    height: 1,
  },
  actions: {
    x: 2,
    y: 2,
    width: 1,
    height: 1,
  },
};
