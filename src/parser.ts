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
  usesSeparator?: boolean;
  resolvePath?: string[];
}

export const DEFAULT_PARSER_MAX_PAYLOAD_BYTE_SIZE = 1024 * 4;
export const DEFAULT_PARSER_ALLOWED_ROOT_ELEMENTS: ConsumerType[] = [
  ConsumerType.Array,
  ConsumerType.Object,
  ConsumerType.String,
  ConsumerType.Number,
  ConsumerType.Boolean
];
export const DEFAULT_PARSER_USES_SEPERATOR = false;

export { ConsumerType };

export class Parser extends Transform {
  private _root: BaseConsumer | PendingConsumer | null = null;
  private _waitingForSeperator: boolean = false;

  public maxPayloadByteSize: number;
  public allowedRootElements: ConsumerType[];
  public usesSeparator: boolean;
  public resolvePath: string[];

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
    this.usesSeparator = options.usesSeparator ?? DEFAULT_PARSER_USES_SEPERATOR;
    this.resolvePath = options.resolvePath ?? [];
  }

  _parsingError(message: string, callback: TransformCallback) {
    this.emit('parsing-error', new Error(message));
    this._complete(callback);
  }

  _complete(callback: TransformCallback) {
    this._root = null;

    if (this.usesSeparator) {
      this._waitingForSeperator = true;
    }

    callback(null);
  }

  _transform(
    item: TokenResult,
    _encoding: string,
    callback: TransformCallback
  ) {
    if (this._waitingForSeperator) {
      if (item.type === TokenType.Seperator) {
        this._waitingForSeperator = false;
      }
      return callback(null);
    }

    if (item.type === TokenType.Seperator) {
      return this._complete(callback);
    } else if (item.type === TokenType.Invalid) {
      return this._parsingError(
        `Invalid token with "${item.value}" as value.`,
        callback
      );
    }

    if (!this._root) {
      this._root = parse(item, {
        resolvePath: this.resolvePath,
        onResolve: (data) => this.emit('data', data)
      });

      if (this._root === null) {
        return this._parsingError(
          `Invalid starter token with "${item.value}" as value.`,
          callback
        );
      } else if (!this.allowedRootElements.includes(this._root.type)) {
        return this._parsingError(
          `Forbidden root type "${this._root.type}".`,
          callback
        );
      }
    }

    if (this._root.consume(item)) {
      return this._complete(callback);
    } else if (this._root.state === ConsumerState.Failed) {
      return this._parsingError(
        `Invalid JSON caused by "${this._root.lastError.message}".`,
        callback
      );
    } else if (this._root.size > this.maxPayloadByteSize) {
      return this._parsingError(
        `JSON payload exceeds ${this.maxPayloadByteSize} bytes.`,
        callback
      );
    }

    callback(null);
  }
}
