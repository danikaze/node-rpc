import * as blessed from 'blessed';
import { Widget, ResizeData } from '../widget';
import { LayoutRules, WidgetRule, rules, LayoutRuleType } from './rules';

export interface LayoutOptions {
  /** Screen to use */
  screen: blessed.Widgets.Screen;
  /** Number of columns to divide the total width */
  cols: number;
  /** Number of rows to divide the total height */
  rows: number;
}

/**
 * Control the layout of the game based on a Grid-like system and a set of rules
 */
export class Layout {
  /** Screen to use */
  protected readonly screen: blessed.Widgets.Screen;
  /** Tile where each column start */
  protected readonly colStarts: number[] = [];
  /** Tile where each row start */
  protected readonly rowStarts: number[] = [];
  /** List of registered widgets as per rule */
  protected readonly widgets: Partial<{ [key in LayoutRuleType]: Widget }> = {};
  /** List of rule definitions */
  protected rules: LayoutRules = rules;

  constructor(options: LayoutOptions) {
    this.screen = options.screen;
    this.calculateGridSpace(options.cols, options.rows);

    this.screen.on('resize', () => {
      this.calculateGridSpace(this.colStarts.length - 1, this.rowStarts.length - 1);
      this.resizeWidgets();
    });
  }

  /**
   * Register a widget to be managed by the Layout system
   *
   * @param key type of the widget
   * @param widget widget to manage
   */
  public addWidget(key: LayoutRuleType, widget: Widget): void {
    const rule = this.rules[key];
    this.widgets[key] = widget;

    if (!rule) {
      throw new Error(`Rule ${key} not found`);
    }

    widget.onResize(this.applyRule(rule), true);
  }

  /**
   * Desregister a widget so it won't be resized anymore by this layout manager
   */
  public removeWidget(key: LayoutRuleType): void {
    delete this.widgets[key];
  }

  /**
   * Calculate the size of each column and row based
   */
  protected calculateGridSpace(cols: number, rows: number): void {
    this.calculateCellStarts(this.colStarts, this.screen.width as number, cols);
    this.calculateCellStarts(this.rowStarts, this.screen.height as number, rows);
  }

  /**
   * Calculates the space of each cell of the grid the most equitative way.
   * Some cells can be bigger than others in no specific order, but with only 1 unit of difference as most.
   */
  protected calculateCellStarts(container: number[], available: number, nCells: number): void {
    if (nCells === 0) return;

    const tilesPerCell = available / nCells;
    for (let i = 0; i < nCells; i++) {
      container[i] = Math.round(tilesPerCell * i);
    }
    container[nCells] = available;
  }

  /**
   * Given a rule, get its numeric absolute values
   */
  protected applyRule(rule: WidgetRule): ResizeData {
    const x = this.colStarts[rule.x];
    const y = this.rowStarts[rule.y];
    const width = this.colStarts[rule.x + rule.width] - x;
    const height = this.rowStarts[rule.y + rule.height] - y;

    return {
      x,
      y,
      width,
      height,
    };
  }

  /**
   * Apply the new aspect to all registered widgets
   */
  protected resizeWidgets(): void {
    Object.entries(this.widgets).forEach(([key, widget]) => {
      const rule = this.rules[key as LayoutRuleType];
      if (!rule) {
        return;
      }
      widget!.onResize(this.applyRule(rule), true);
    });

    this.screen.render();
  }
}
