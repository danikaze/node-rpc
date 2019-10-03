import { MethodCollection } from './utils/msgs';

export interface ClientInterface extends MethodCollection {
  getDate: () => string;
  add: (a: number, b: number) => number;
  box: (txt: string) => string;
}
