import { MethodInterface } from '../games/draw/method-interface';

/*
 * Faulty implementation of the client for the Draw game
 * It throws a runtime exception
 */
const implementation: MethodInterface = {
  draw: () => {
    throw new Error('Just testing');
  },
};

__non_webpack_module__.exports = implementation;
