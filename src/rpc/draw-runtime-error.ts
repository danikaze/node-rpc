import { MethodInterface } from '../games/draw/method-interface';

/*
 * Faulty implementation of the client for the Draw game
 * It follows the API but the data shouldn't be valid.
 * JS files (not TS) might not even follow the API.
 */
const implementation: MethodInterface = {
  draw: max => Math.round(Math.random() * max + max),
};

__non_webpack_module__.exports = implementation;
