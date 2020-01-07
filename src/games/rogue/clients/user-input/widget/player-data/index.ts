import * as blessed from 'blessed';
import { PlayerInfo } from '../../../../method-interface';
import { formatConstString } from '../format-const-string';
import { Widget, WidgetOptions, ResizeData } from '..';

export class PlayerData implements Widget {
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

  public update(info: PlayerInfo): void {
    const contents = [
      this.getHpInfo(info),
      this.getAbnormalStateInfo(info),
      this.getInventoryInfo(info),
    ];

    this.box.setContent(contents.join('\n'));
  }

  protected getHpInfo(info: PlayerInfo): string {
    return `HP: ${info.hp}/${info.maxHp}`;
  }

  protected getAbnormalStateInfo(info: PlayerInfo): string {
    return info.abnormalState.length > 0 ? `[${info.abnormalState.join(', ')}]` : '';
  }

  protected getInventoryInfo(info: PlayerInfo): string {
    // group by type to display quantities
    const groups = info.inventory.reduce((grp, item) => {
      if (!grp[item.type]) {
        grp[item.type] = 1;
      } else {
        grp[item.type]++;
      }
      return grp;
    }, {});

    // build the string
    return Object.entries(groups)
      .map(([type, qty]) => `- ${qty} x ${formatConstString(type)}`)
      .join('\n');
  }
}
