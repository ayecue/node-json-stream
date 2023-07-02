import { Transform, TransformCallback, TransformOptions } from 'stream';

import { ConsumerState, ResultType } from './parser/consumer';
import { RootConsumer } from './parser/root-consumer';
import { TokenResult, TokenType } from './tokenizer/tokenizer-base';

export interface ParserOptions extends TransformOptions {
  maxPayloadByteSize?: number;
  allowedRootElements?: ResultType[];
}

export const DEFAULT_PARSER_MAX_PAYLOAD_BYTE_SIZE = 1024;
export const DEFAULT_PARSER_ALLOWED_ROOT_ELEMENTS = [
  ResultType.Array,
  ResultType.Boolean,
  ResultType.Number,
  ResultType.Object,
  ResultType.String
];

export { ResultType };

export class Parser extends Transform {
  private _root: RootConsumer | null = null;

  readonly maxPayloadByteSize: number;
  readonly allowedRootElements: ResultType[];

  constructor(options: ParserOptions = {}) {
    super({
      writableObjectMode: true,
      readableObjectMode: true,
      encoding: 'utf-8',
      ...options
    });
    this.maxPayloadByteSize =
      options.maxPayloadByteSize ?? DEFAULT_PARSER_MAX_PAYLOAD_BYTE_SIZE;
    this.allowedRootElements =
      options.allowedRootElements ?? DEFAULT_PARSER_ALLOWED_ROOT_ELEMENTS;
  }

  _transform(item: TokenResult, encoding: string, callback: TransformCallback) {
    if (item.type === TokenType.Invalid) {
      this.emit('invalid-token', item);
      callback(null);
      return;
    }

    if (!this._root) {
      this._root = new RootConsumer({
        allowedElements: this.allowedRootElements
      });
    }

    if (this._root.consume(item)) {
      this.emit('data', this._root.data);
      this._root = null;
    } else if (this._root.state === ConsumerState.Failed) {
      this.emit('invalid-json', item);
      this._root = null;
    } else if (this._root.size > this.maxPayloadByteSize) {
      this.emit('payload-exceeded');
      this._root = null;
    }

    callback(null);
  }
}
