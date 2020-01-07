import * as blessed from 'blessed';
import { Widget, WidgetOptions, ResizeData } from '..';
import { PlayerAction, ActionMove } from '../../../../method-interface';

export type Action =
  | 'PASS'
  | 'MOVE_N'
  | 'MOVE_S'
  | 'MOVE_W'
  | 'MOVE_E'
  | 'ATTACK'
  | 'USE'
  | 'OPEN_DOOR'
  | 'CLOSE_DOOR'
  | 'TAKE';

export class ActionList implements Widget {
  protected readonly screen: blessed.Widgets.Screen;
  protected readonly box: blessed.Widgets.BoxElement;
  protected readonly list: blessed.Widgets.ListElement;
  protected enabledActions: Action[];

  constructor(options: WidgetOptions) {
    this.enabledActions = [];
    this.screen = options.screen;
    this.box = blessed.box({
      tags: true,
      border: 'line',
    });
    this.list = blessed.list({
      tags: true,
      border: 'line',
      interactive: true,
      keys: true,
      style: {
        selected: {
          fg: 'green',
        },
      },
    });

    this.setEnabledActions([]);
    this.screen.append(this.box);
  }

  public onResize({ x, y, width, height }: ResizeData, delayedRender?: boolean): void {
    const { box, list, screen } = this;
    const tempElem = box.parent ? list : box;

    screen.append(tempElem);

    box.left = x;
    box.top = y;
    box.width = width;
    box.height = height;

    list.left = x;
    list.top = y;
    list.width = width;
    list.height = height;

    screen.remove(tempElem);

    if (!delayedRender) {
      this.screen.render();
    }
  }

  /**
   * Wait for user input to select an action
   */
  public async getAction(): Promise<Partial<PlayerAction>> {
    return new Promise<Partial<PlayerAction>>(resolve => {
      const keyHandler = (char: string, key: blessed.Widgets.Events.IKeyEventArg) => {
        const action = this.actionKeyHandler(char, key);
        if (!action) return;
        this.box.off('keypress', keyHandler);
        resolve(action);
      };

      this.box.on('keypress', keyHandler);
      this.box.focus();
    });
  }

  public async getSubAction<T>(options: { text: string; value: T }[]): Promise<T> {
    return new Promise<T>(resolve => {
      const keyHandler = (item, index) => {
        this.list.off('select', keyHandler);
        this.screen.remove(this.list);
        this.screen.append(this.box);
        this.box.focus();
        this.screen.render();
        resolve(options[index].value);
      };

      this.screen.remove(this.box);
      this.screen.append(this.list);
      this.list.focus();
      this.list.setItems(
        // cast needed due to @types/blessed bug, not accepting strings
        options.map(option => (option.text as unknown) as blessed.Widgets.BlessedElement)
      );
      this.screen.render();

      this.list.on('select', keyHandler);
    });
  }

  /**
   * Set the list of enabled actions disabling the others
   */
  public setEnabledActions(enabledActions: Action[]): void {
    this.enabledActions = enabledActions;
    this.box.setContent(this.getActionsKeys());
  }

  protected getActionsKeys(): string {
    const formatKey = (str: string, action?: Action): string => {
      const color = !action || this.enabledActions.includes(action) ? 'yellow' : 'red';
      return `[{${color}-fg}${str}{/${color}-fg}]`;
    };

    const movementKeys = [
      formatKey('⬆︎', 'MOVE_N'),
      formatKey('⬇︎', 'MOVE_S'),
      formatKey('⬅︎', 'MOVE_W'),
      formatKey('➡︎', 'MOVE_E'),
    ];

    const text = [
      `${formatKey('Space', 'PASS')} Pass turn`,
      `${movementKeys.join('')} Move`,
      `${formatKey('a', 'ATTACK')} Attack`,
      `${formatKey('u', 'USE')} Use object`,
      `${formatKey('o', 'OPEN_DOOR')} Open door`,
      `${formatKey('c', 'CLOSE_DOOR')} Close door`,
      `${formatKey('p', 'TAKE')} Pick object`,
      `${formatKey('C-c')} Quit app`,
    ];

    return text.join('\n');
  }

  protected actionKeyHandler(
    char: string,
    key: blessed.Widgets.Events.IKeyEventArg
  ): Partial<PlayerAction> {
    const actionMap: { [key: string]: Partial<PlayerAction> } = {
      space: { type: 'PASS' },
      up: { type: 'MOVE', direction: 'N' },
      down: { type: 'MOVE', direction: 'S' },
      left: { type: 'MOVE', direction: 'W' },
      right: { type: 'MOVE', direction: 'E' },
      a: { type: 'ATTACK' },
      u: { type: 'USE' },
      o: { type: 'OPEN_DOOR' },
      c: { type: 'CLOSE_DOOR' },
      p: { type: 'TAKE' },
    };

    const action = actionMap[key.name];
    if (!action) return;

    const direction = (action as ActionMove).direction;
    const actionName = `${action.type}${direction ? `_${direction}` : ''}`;
    if (!this.enabledActions.includes(actionName as Action)) return;

    return action;
  }
}
