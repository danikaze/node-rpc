import { MethodCollection } from '../../utils/msgs';

export interface MethodInterface extends MethodCollection {
  draw: (max: number) => number;
}
