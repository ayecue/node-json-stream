import { TokenResult, TokenType } from '../../tokenizer/tokenizer-base';
import { parse } from '../parse';
import {
  BaseConsumerOptions,
  ConsumerState,
  ConsumerType,
  ResolveContext
} from './base';
import { PendingConsumer } from './pending';

export enum ObjectConsumerState {
  Initial = 0,
  AfterInitial = 1,
  WaitingForKey = 2,
  WaitingForDelimiter = 3,
  WaitingForValue = 4,
  WaitingForComma = 5
}

export class ObjectConsumer extends PendingConsumer {
  protected _data: Record<string, any> = {};
  protected _size: number = 5;
  protected _type: ConsumerType = ConsumerType.Object;

  private _objectState: ObjectConsumerState = ObjectConsumerState.Initial;
  private _lastKey: string;
  private _resolveContext: ResolveContext;

  constructor(options: BaseConsumerOptions) {
    super(options);
    this._resolveContext = options.resolveContext;
  }

  consume(item: TokenResult): boolean {
    if (this._pending !== null) {
      if (this._pending.consume(item)) {
        this._data[this._lastKey] = this._pending.data;
        this._size += this._pending.size;
        this._objectState = ObjectConsumerState.WaitingForComma;
        this._pendingSize = 0;
        this._pending = null;
      } else if (this._pending.state === ConsumerState.Failed) {
        this._state = ConsumerState.Failed;
        this._lastError = this._pending.lastError;
      } else {
        this._pendingSize = this._pending.size;
      }
    } else {
      switch (this._objectState) {
        case ObjectConsumerState.Initial: {
          if (item.type !== TokenType.Punctuator || item.value !== '{') {
            this._state = ConsumerState.Failed;
            this._lastError = new Error(
              'Object requires opening curly brackets.'
            );
            break;
          }
          this._objectState = ObjectConsumerState.AfterInitial;
          break;
        }
        case ObjectConsumerState.AfterInitial: {
          if (item.type === TokenType.Punctuator && item.value === '}') {
            this._state = ConsumerState.Done;
            this._resolveCallback?.(this._data);
            break;
          }
        }
        case ObjectConsumerState.WaitingForKey: {
          if (item.type !== TokenType.StringLiteral) {
            this._state = ConsumerState.Failed;
            this._lastError = new Error('Object key has to be string.');
            break;
          }
          this._lastKey = item.value;
          this._size += Buffer.byteLength(item.value);
          this._objectState = ObjectConsumerState.WaitingForDelimiter;
          break;
        }
        case ObjectConsumerState.WaitingForDelimiter: {
          if (item.value !== ':') {
            this._state = ConsumerState.Failed;
            this._lastError = new Error('Expected delimiter in object.');
            break;
          }
          this._objectState = ObjectConsumerState.WaitingForValue;
          break;
        }
        case ObjectConsumerState.WaitingForValue: {
          const result = parse(
            item,
            this._resolveContext,
            this._currentPath
              ? this._currentPath + '.' + this._lastKey
              : this._lastKey
          );

          if (result === null) {
            this._state = ConsumerState.Failed;
            this._lastError = new Error('Invalid value in object.');
            break;
          }

          if (result.consume(item)) {
            this._data[this._lastKey] = result.data;
            this._size += result.size;
            this._objectState = ObjectConsumerState.WaitingForComma;
          } else if (result.state === ConsumerState.Failed) {
            this._state = ConsumerState.Failed;
            this._lastError = new Error('Failed to parse value in object.');
          } else {
            this._pending = result;
          }

          break;
        }
        case ObjectConsumerState.WaitingForComma: {
          if (item.type === TokenType.Punctuator && item.value === '}') {
            this._state = ConsumerState.Done;
            this._resolveCallback?.(this._data);
            break;
          }
          if (item.value !== ',') {
            this._state = ConsumerState.Failed;
            this._lastError = new Error('Expected comma in object.');
            break;
          }
          this._objectState = ObjectConsumerState.WaitingForKey;
          break;
        }
      }
    }

    return this._state === ConsumerState.Done;
  }
}
