import * as blessed from 'blessed';
import { Widget, WidgetOptions, ResizeData } from '..';
import { MatrixMap } from '../..';
import { charTiles } from '../char-tiles';
import { formatConstString } from '../format-const-string';

export class MapInfo implements Widget {
  protected readonly screen: blessed.Widgets.Screen;
  protected readonly box: blessed.Widgets.BoxElement;

  constructor(options: WidgetOptions) {
    this.screen = options.screen;
    this.box = blessed.box({
      border: 'line',
      tags: true,
    });

    this.screen.append(this.box);
  }

  public onResize({ x, y, width, height }: ResizeData, delayedRender?: boolean): void {
    const { box } = this;

    if (!this.box.parent) {
      this.screen.append(this.box);
    }

    box.left = x;
    box.top = y;
    box.width = width;
    box.height = height;

    if (!delayedRender) {
      this.screen.render();
    }
  }

  public update(info: MatrixMap): void {
    const objects = [];
    const entities = [];

    for (const row of info.tiles) {
      for (const tile of row) {
        if (!tile) continue;
        const objectType = tile.object && tile.object.type;
        if (objectType && !objects.includes(objectType)) {
          objects.push(objectType);
        }
        const entityType = tile.entity && tile.entity.type;
        if (entityType && entityType !== 'PJ' && !entities.includes(entityType)) {
          entities.push(entityType);
        }
      }
    }

    const contents = [];

    if (entities.length > 0) {
      contents.push('Entities:');
      for (const entity of entities) {
        contents.push(` ${charTiles[entity]} ${formatConstString(entity)}`);
      }
    }
    if (objects.length > 0) {
      contents.push('Objects:');
      for (const object of objects) {
        contents.push(` ${charTiles[object]} ${formatConstString(object)}`);
      }
    }

    this.box.setContent(contents.join('\n'));
  }
}
