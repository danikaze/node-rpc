import { Ui } from './user-input';
import {
  ClientInfo,
  TurnInfo,
  PlayerAction,
  ActionResultError,
  MethodInterface,
} from '../method-interface';

const ui = new Ui();
let turnNumber = 0;

export const implementation: MethodInterface = {
  info,
  turn,
  msg,
};

/**
 * Return Client information requested by the server before starting the game
 */
function info(): ClientInfo {
  return {
    name: 'Interactive UI',
  };
}

/*
 * This player just moves randomly over the map,
 * opening doors if needed and picking up treasures
 */
async function turn(info: TurnInfo): Promise<PlayerAction> {
  ui.addText(`Turn ${++turnNumber}`);
  ui.update(info);
  const action = await ui.getAction();
  return action;
}

/**
 * Format and show the incoming message from the server
 */
function msg(text: string, error?: ActionResultError): null {
  const message = error
    ? `{red-fg}Error: ${error}${text ? `: ${text}` : ''}{/red-fg}`
    : `{green-fg}${text}{/green-fg}`;
  ui.addText(message);
  return null;
}
