import { ClientInterface } from '../client-interface';

const MAX_DRAW = 100;

const implementation: ClientInterface = {
  getDate: () => new Date().toISOString(),
  add: (a, b) => a + b,
  box: text => `<{[${text}]}>`,
  draw: () => Math.round(Math.random() * MAX_DRAW),
};

__non_webpack_module__.exports = implementation;
