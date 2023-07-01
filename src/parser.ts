import { Transform, TransformCallback, TransformOptions } from 'stream';

import { ConsumerState } from './parser/consumer';
import { RootConsumer } from './parser/root-consumer';
import { TokenResult, TokenType } from './tokenizer/tokenizer-base';

export class Parser extends Transform {
  private _root: RootConsumer | null = null;

  constructor(options: TransformOptions = {}) {
    super({
      ...options,
      writableObjectMode: true,
      readableObjectMode: true,
      encoding: 'utf-8'
    });
  }

  _transform(chunk: Buffer, encoding: string, callback: TransformCallback) {
    const item = TokenResult.parse(chunk.toString(encoding));

    if (item.type === TokenType.Invalid) {
      console.error('Invalid token');
      callback(null);
      return;
    }

    if (!this._root) {
      this._root = new RootConsumer();
    }

    if (this._root.consume(item)) {
      this.emit('data', this._root.data);
      this._root = null;
    } else if (this._root.state === ConsumerState.Failed) {
      console.error('Invalid JSON');
      this._root = null;
    }

    callback(null);
  }
}
