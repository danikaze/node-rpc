import { MethodInterface } from '../games/draw/method-interface';

/*
 * Faulty implementation of the client for the Draw game
 * It returns the result after the timeout limit
 */
const implementation: MethodInterface = {
  draw: max => {
    const waitFor = 2000; // 5 s
    const until = new Date(new Date().getTime() + waitFor);
    while (new Date() < until) {}

    return Math.round(Math.random() * max);
  },
};

__non_webpack_module__.exports = implementation;
