import { TokenResult, TokenType } from '../tokenizer/tokenizer-base';
import { ArrayConsumer } from './array-consumer';
import {
  Consumer,
  ConsumerState,
  PendingResolveResult,
  ResolveResult,
  ResultType
} from './consumer';

export enum ObjectConsumerState {
  Initial = 0,
  WaitingForKey = 1,
  WaitingForDelimiter = 2,
  WaitingForValue = 3,
  WaitingForComma = 4
}

export class ObjectConsumer extends Consumer {
  protected _data: Record<string, any> = {};
  protected _size: number = 5;
  private _objectState: ObjectConsumerState = ObjectConsumerState.Initial;

  private _lastKey: string;

  protected resolve(item: TokenResult): ResolveResult | PendingResolveResult {
    switch (item.type) {
      case TokenType.Punctuator:
        if (item.value === '[') {
          return new PendingResolveResult(
            ResultType.Array,
            new ArrayConsumer()
          );
        } else if (item.value === '{') {
          return new PendingResolveResult(
            ResultType.Object,
            new ObjectConsumer()
          );
        }
      default:
        return super.resolve(item);
    }
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
      } else {
        this._pendingSize = this._pending.size;
      }
    } else {
      switch (this._objectState) {
        case ObjectConsumerState.Initial: {
          if (item.type === TokenType.Punctuator && item.value === '}') {
            this._state = ConsumerState.Done;
            break;
          }
        }
        case ObjectConsumerState.WaitingForKey: {
          if (item.type !== TokenType.StringLiteral) {
            this._state = ConsumerState.Failed;
            this._errors.push('Object key has to be string.');
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
            this._errors.push('Expected delimiter in object.');
            break;
          }
          this._objectState = ObjectConsumerState.WaitingForValue;
          break;
        }
        case ObjectConsumerState.WaitingForValue: {
          const result = this.resolve(item);
          if (result instanceof PendingResolveResult) {
            this._pending = result;
            break;
          }
          this._data[this._lastKey] = result.data;
          this._size += result.size;
          this._objectState = ObjectConsumerState.WaitingForComma;
          break;
        }
        case ObjectConsumerState.WaitingForComma: {
          if (item.type === TokenType.Punctuator && item.value === '}') {
            this._state = ConsumerState.Done;
            break;
          }
          if (item.value !== ',') {
            this._state = ConsumerState.Failed;
            this._errors.push('Expected comma in object.');
            break;
          }
          this._objectState = ObjectConsumerState.WaitingForKey;
          break;
        }
      }
    }

    return this._state === ConsumerState.Done;
  }

  get data(): Record<string, any> {
    return this._data;
  }
}