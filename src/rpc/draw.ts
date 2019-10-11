import { MethodInterface } from '../games/draw/method-interface';

/*
 * Standard implementation of the client for the Draw game
 * It works as expected
 */
const implementation: MethodInterface = {
  draw: max => Math.round(Math.random() * max),
};

__non_webpack_module__.exports = implementation;
