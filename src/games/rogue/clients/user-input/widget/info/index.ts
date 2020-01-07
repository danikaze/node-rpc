import * as blessed from 'blessed';
import { Widget, WidgetOptions, ResizeData } from '..';

export class Info implements Widget {
  protected readonly screen: blessed.Widgets.Screen;
  protected readonly text: blessed.Widgets.ScrollableTextElement;

  constructor(options: WidgetOptions) {
    this.screen = options.screen;
    this.text = blessed.scrollabletext({
      border: 'line',
      scrollable: true,
      tags: true,
    });

    this.screen.append(this.text);
  }

  public onResize({ x, y, width, height }: ResizeData, delayedRender?: boolean): void {
    const { text } = this;

    text.left = x;
    text.top = y;
    text.width = width;
    text.height = height;

    if (!delayedRender) {
      this.screen.render();
    }
  }

  public add(line: string): void {
    const SCROLL_END = 100;
    this.text.setContent(`${this.text.getContent()}\n${line}`);
    this.text.setScrollPerc(SCROLL_END);
  }
}
