import * as blessed from 'blessed';
import { Widget, WidgetOptions, ResizeData } from '..';
import { charTiles } from '../char-tiles';
import { MatrixMap, TileInfo } from '../..';

/**
 * Shows a progress bar that gets completed in the specified time
 */
export class Map implements Widget {
  protected static readonly UNKNOWN_TYPE = '?';

  protected readonly screen: blessed.Widgets.Screen;
  protected box: blessed.Widgets.BoxElement;
  protected map: blessed.Widgets.TextElement;

  constructor(options: WidgetOptions) {
    this.screen = options.screen;
    this.box = blessed.box({
      border: 'line',
      style: {
        bg: 'grey',
      },
    });
    this.map = blessed.text({
      tags: true,
    });
    this.box.append(this.map);
  }

  public focus(): void {
    this.box.focus();
  }

  /**
   * Method called when the widget needs to be resized
   */
  public onResize({ x, y, width, height }: ResizeData, delayedRender?: boolean): void {
    const { box } = this;

    if (!this.box.parent) {
      this.screen.append(this.box);
    }

    box.left = x;
    box.top = y;
    box.width = width;
    box.height = height;

    this.centerMap();

    if (!delayedRender) {
      this.screen.render();
    }
  }

  /**
   * Update the content of the widget with map information
   */
  public update(matrix: MatrixMap): void {
    const newContents = this.mapToContents(matrix.tiles);
    this.map.setContent(newContents.join('\n'));
    // +1 here is a hack to avoid a bug
    // (https://github.com/embark-framework/neo-blessed/issues/42):
    this.map.width = matrix.width + 1;
    this.map.height = matrix.height + 1;

    this.centerMap();
  }

  /**
   * Re-center the map in the box
   */
  protected centerMap(): void {
    const { box, map } = this;

    map.top = Math.floor(((box.height as number) - (map.height as number)) / 2);
    map.left = Math.floor(((box.width as number) - (map.width as number)) / 2);
  }

  /**
   * Transform map information to displayable characters
   */
  protected mapToContents(tiles: TileInfo[][]): string[] {
    const contents = [];

    tiles.forEach(row => {
      let line = '';
      row.forEach(tile => {
        const type =
          (tile.entity && tile.entity.type) || (tile.object && tile.object.type) || tile.type;
        line += charTiles[type] || Map.UNKNOWN_TYPE;
      });
      contents.push(line);
    });

    return contents;
  }
}
