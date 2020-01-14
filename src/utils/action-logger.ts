import { writeFile } from 'fs';
import { isFunction } from 'vanilla-type-check/isFunction';

export class ActionLogger {
  protected meta: unknown;
  protected msgs: unknown[];

  constructor() {
    this.reset();
  }

  public log(msg: unknown): void {
    this.msgs.push(msg);
  }

  public reset(): void {
    this.msgs = [];
  }

  public addMetadata(data: unknown | ((data: unknown) => unknown)): void {
    this.meta = isFunction(data) ? data(this.meta) : data;
  }

  public export(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const data = JSON.stringify({
        start: this.meta,
        msgs: this.msgs,
      });

      writeFile(path, data, error => {
        if (error) {
          reject();
          return;
        }
        resolve();
      });
    });
  }
}
