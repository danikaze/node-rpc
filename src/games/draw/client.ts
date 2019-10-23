import { MethodInterface } from './method-interface';

export const implementation: MethodInterface = {
  draw: max => Math.round(Math.random() * max),
};
