import { Transform, TransformCallback, TransformOptions } from 'stream';

import {
  BaseConsumer,
  ConsumerState,
  ConsumerType
} from './parser/consumer/base';
import { PendingConsumer } from './parser/consumer/pending';
import { parse } from './parser/parse';
import { TokenResult, TokenType } from './tokenizer/tokenizer-base';

export interface ParserOptions extends TransformOptions {
  maxPayloadByteSize?: number;
  allowedRootElements?: ConsumerType[];
}

export const DEFAULT_PARSER_MAX_PAYLOAD_BYTE_SIZE = 1024;
export const DEFAULT_PARSER_ALLOWED_ROOT_ELEMENTS: ConsumerType[] = [
  ConsumerType.Array,
  ConsumerType.Object,
  ConsumerType.String,
  ConsumerType.Number,
  ConsumerType.Boolean
];

export { ConsumerType };

export class Parser extends Transform {
  private _root: BaseConsumer | PendingConsumer | null = null;

  public maxPayloadByteSize: number;
  public allowedRootElements: ConsumerType[];

  constructor(options: ParserOptions = {}) {
    super({
      writableObjectMode: true,
      readableObjectMode: true,
      encoding: 'utf-8',
      ...options
    });
    this.maxPayloadByteSize =
      options.maxPayloadByteSize ?? DEFAULT_PARSER_MAX_PAYLOAD_BYTE_SIZE;
    this.allowedRootElements = options.allowedRootElements ?? [
      ...DEFAULT_PARSER_ALLOWED_ROOT_ELEMENTS
    ];
  }

  _transform(item: TokenResult, encoding: string, callback: TransformCallback) {
    if (item.type === TokenType.Invalid) {
      this.emit(
        'parsing-error',
        new Error(`Invalid token with "${item.value}" as value.`)
      );
      callback(null);
      return;
    }

    if (!this._root) {
      this._root = parse(item);

      if (this._root === null) {
        this.emit(
          'parsing-error',
          new Error(`Invalid starter token with "${item.value}" as value.`)
        );
        callback(null);
        return;
      }
    }

    if (this._root.consume(item)) {
      if (!this.allowedRootElements.includes(this._root.type)) {
        this.emit(
          'parsing-error',
          new Error(`Forbidden root type "${this._root.type}".`)
        );
        callback(null);
        return;
      }
      this.emit('data', this._root.data);
      this._root = null;
    } else if (this._root.state === ConsumerState.Failed) {
      this.emit(
        'parsing-error',
        new Error(`Invalid JSON caused by "${this._root.lastError.message}".`)
      );
      this._root = null;
    } else if (this._root.size > this.maxPayloadByteSize) {
      this.emit(
        'parsing-error',
        new Error(`JSON payload exceeds ${this.maxPayloadByteSize} bytes.`)
      );
      this._root = null;
    }

    callback(null);
  }
}
