import { Client } from '../utils/client';

async function run(): Promise<void> {
  const client = new Client({
    file: getClientFilename(),
    host: SERVER_HOST,
    port: SERVER_PORT,
  });
  await client.connect();
  await client.rpc();
}

function getClientFilename(): string {
  const paramName = 'file';
  const findStr = `--${paramName}=`;
  const param = process.argv.filter(arg => arg.indexOf(findStr) !== -1)[0];
  if (!param) {
    // tslint:disable-next-line: no-console
    console.error(
      ` [!] RPC method implementation for the client needs to be specified with ${findStr}filename`
    );
    process.exit(-1);
  }
  return param.substr(findStr.length);
}

run();
