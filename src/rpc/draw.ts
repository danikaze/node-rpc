import { MethodInterface } from '../games/draw/method-interface';

const implementation: MethodInterface = {
  draw: max => Math.round(Math.random() * max),
};

__non_webpack_module__.exports = implementation;
