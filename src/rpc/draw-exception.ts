import { MethodInterface } from '../games/draw/method-interface';

const implementation: MethodInterface = {
  draw: () => {
    throw new Error('Just testing');
  },
};

__non_webpack_module__.exports = implementation;
