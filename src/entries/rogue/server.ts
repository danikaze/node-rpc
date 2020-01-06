// tslint:disable: no-console
import { extendObjectsOnly } from 'extend-objects-only';
import { RogueGameServer, RogueGameServerOptions } from '../../games/rogue/server';
import { ServerOptions } from '../../utils/server';

const defaultOptions = {
  maxTurns: 5,
  nPlayersRequired: 1,
  rpcTimeout: 1000,
  port: SERVER_PORT,
  loggerInitOptions: {
    outputFile: 'logs/rogue/server/%DATE%_%TIME%.log',
  },
} as Partial<RogueGameServerOptions>;

async function run(): Promise<void> {
  if (process.argv.includes('--help')) {
    showHelp();
    return;
  }

  const commandOptions = readOptions() as Partial<ServerOptions>;
  if (Object.entries(commandOptions).filter(([key, value]) => value !== undefined).length > 0) {
    console.log(`Applying options: ${JSON.stringify(commandOptions, null, 2)}`);
  } else {
    console.log('Applying default options. Execute the server with --help to see other parameters');
  }

  const server = new RogueGameServer(extendObjectsOnly(
    defaultOptions,
    commandOptions
  ) as RogueGameServerOptions);

  server.start();
}

function readOptions(): Partial<RogueGameServerOptions> {
  const options: Partial<RogueGameServerOptions> = {
    nPlayersRequired: readParam('nPlayersRequired', Number),
    rpcTimeout: readParam('rpcTimeout', Number),
    maxTurns: readParam('maxTurns', Number),
    applyLineOfSight: readParam('los', Boolean),
  };

  return options;
}

function readParam(name: string): string;
function readParam<T>(name: string, fn: (value: string) => T): T;
function readParam<T>(name: string, fn?: (value: string) => T): string | T {
  const find = `--${name}=`;
  const param = process.argv.find(param => param.startsWith(find));

  if (param) {
    const value = param.substr(find.length);
    return fn ? fn(value) : value;
  }
}

function showHelp(): void {
  console.log(`
Server parameters
  --help                Display this help and exit
  --nPlayersRequired    Number of clients to wait before starting the game [${defaultOptions.nPlayersRequired}]
  --rpcTimeout          Milliseconds to wait before triggering a timeout if the client doesn't reply [${defaultOptions.rpcTimeout}]
  --maxTurns            Maximum number of turns to play before ending the game (0 to disable) [${defaultOptions.maxTurns}]
  --los                 Set to 1 to apply Line Of Sight calculation
`);
}

run();
