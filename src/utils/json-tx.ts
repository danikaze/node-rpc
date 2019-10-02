import { Socket } from 'net';
import { EventEmitter } from 'events';

export interface JsonSocketOptions {
  delimiter: string;
}

/**
 * JsonTx stands for JSON Transceiver
 *
 * Simple wrapper over net.Socket to allow sending and receiving JSON over Sockets
 */
export class JsonTx {
  public static readonly defaultOptions: JsonSocketOptions = {
    delimiter: '#',
  };

  protected readonly delimiter: string;
  protected readonly socket: Socket;
  protected readonly data: unknown[] = [];
  protected readonly events: EventEmitter = new EventEmitter();
  protected waitingForData = 0;
  protected buffer: string = '';

  constructor(socket: Socket, options?: JsonSocketOptions) {
    const opt = { ...JsonTx.defaultOptions, ...options };
    this.socket = socket;
    this.delimiter = opt.delimiter;
    socket.on('data', this.dataHandler.bind(this));
  }

  /**
   * Sends JSON data over a socket
   *
   * @param data Data to send. Needs to be JSON.serializable
   */
  public async send<T>(data: T): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.socket.write(this.formatMessage(data), err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Returns `true` if there's received data waiting to be used
   */
  public dataAvailable(): boolean {
    return this.data.length > 0;
  }

  /**
   * Waits for the next JSON data to come through the socket.
   * Returns a promise resolved to it.
   * If there's waiting data, it resolves instantly
   */
  public async waitData<T = unknown>(): Promise<T> {
    if (this.dataAvailable()) {
      return this.data.shift() as T;
    }

    return new Promise<T>(resolve => {
      let slot = ++this.waitingForData;

      const eventHandler = () => {
        slot--;
        if (slot === 0) {
          --this.waitingForData;
          this.events.off('data', eventHandler);
          resolve(this.data.shift() as T);
        }
      };

      this.events.once('data', eventHandler);
    });
  }

  /**
   * Reset the received messages waiting to be read with `waitData`, if any
   */
  public reset(): void {
    while (this.data.length) {
      this.data.pop();
    }
  }

  protected formatMessage<T>(data: T): string {
    const txt = JSON.stringify(data);
    const length = txt.length;

    return `${length}${this.delimiter}${txt}`;
  }

  protected dataHandler(data: Buffer): void {
    this.buffer += data.toString();

    let delimiterIndex = this.buffer.indexOf(this.delimiter);
    while (delimiterIndex !== -1) {
      const dataSize = Number(this.buffer.substring(0, delimiterIndex));
      if (isNaN(dataSize)) return;

      const dataStart = delimiterIndex + this.delimiter.length;
      const msgEndIndex = dataStart + dataSize;
      if (this.buffer.length < msgEndIndex) return;

      const strData = this.buffer.substr(dataStart, dataSize);
      try {
        this.data.push(JSON.parse(strData));
        this.buffer = this.buffer.substr(msgEndIndex);
        this.events.emit('data');
      } catch (e) {}

      delimiterIndex = this.buffer.indexOf(this.delimiter);
    }
  }
}
