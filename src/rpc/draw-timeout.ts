import { MethodInterface } from '../games/draw/method-interface';

const implementation: MethodInterface = {
  draw: max => {
    const waitFor = 2000; // 5 s
    const until = new Date(new Date().getTime() + waitFor);
    while (new Date() < until) {}

    return Math.round(Math.random() * max);
  },
};

__non_webpack_module__.exports = implementation;
