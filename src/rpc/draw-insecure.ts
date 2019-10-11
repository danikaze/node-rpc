// tslint:disable: no-console
import { MethodInterface } from '../games/draw/method-interface';
import { readFileSync } from 'fs';
import { basename } from 'path';

let turn = 0;

/*
 * Faulty implementation of the client for the Draw game
 * It access to things it shouldn't do. Malicious code.
 */
const implementation: MethodInterface = {
  draw: max => {
    turn++;

    // The first turn, it returns a proper result
    if (turn === 1) {
      return validValue(max);
    }

    // Second turn, it reads some forbidden files
    if (turn === 2) {
      const SHOW_CONTENT_LENGTH = 50;
      const fileBuffer = readFileSync(__filename);
      console.log(`Contents of ${basename(__filename)}:`);
      console.log(`---\n${fileBuffer.toString().substring(0, SHOW_CONTENT_LENGTH)}\n...\n---`);
      return validValue(max);
    }

    // Then, just access the main process
    process.exit();
  },
};

function validValue(max: number): number {
  return Math.round(Math.random() * max);
}

__non_webpack_module__.exports = implementation;
