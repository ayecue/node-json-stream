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

  _transform(item: TokenResult, encoding: string, callback: TransformCallback) {
    if (item.type === TokenType.Invalid) {
      this.emit('invalid-token', item);
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
      this.emit('invalid-json', item);
      this._root = null;
    }

    callback(null);
  }
}
