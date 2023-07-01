import { Transform, TransformCallback, TransformOptions } from 'stream';

import { ConsumerState } from './parser/consumer';
import { RootConsumer } from './parser/root-consumer';
import { TokenResult, TokenType } from './tokenizer/tokenizer-base';

export class Parser extends Transform {
  private _buffer: string = '';
  private _root: RootConsumer | null = null;

  constructor(options: TransformOptions = {}) {
    super({
      ...options,
      objectMode: true,
      encoding: 'utf-8'
    });
  }

  _transform(chunk: Buffer, encoding: string, callback: TransformCallback) {
    this._buffer += chunk.toString(encoding);
    const item = TokenResult.parse(this._buffer);

    if (item.type === TokenType.Invalid) {
      console.error('Invalid token');
      this._buffer = '';
      callback(null);
      return;
    }

    if (!this._root) {
      this._root = new RootConsumer();
    }

    if (this._root.consume(item)) {
      this.push(this._root.data);
      this._root = null;
    } else if (this._root.state === ConsumerState.Failed) {
      console.error('Invalid JSON');
      this._root = null;
    }

    this._buffer = '';
    callback(null);
  }
}
