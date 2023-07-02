import { TokenResult, TokenType } from '../tokenizer/tokenizer-base';
import {
  Consumer,
  ConsumerState,
  PendingResolveResult,
  ResolveResult,
  ResultType
} from './consumer';
import { ObjectConsumer } from './object-consumer';

export enum ArrayConsumerState {
  Initial = 0,
  WaitingForValue = 1,
  WaitingForComma = 2
}

export class ArrayConsumer extends Consumer {
  protected _data: any[] = [];
  protected _size: number = 7;
  private _arrayState: ArrayConsumerState = ArrayConsumerState.Initial;

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
        this._data.push(this._pending.data);
        this._size += this._pending.size;
        this._arrayState = ArrayConsumerState.WaitingForComma;
        this._pendingSize = 0;
        this._pending = null;
      } else if (this._pending.state === ConsumerState.Failed) {
        this._state = ConsumerState.Failed;
      } else {
        this._pendingSize = this._pending.size;
      }
    } else {
      switch (this._arrayState) {
        case ArrayConsumerState.Initial: {
          if (item.type === TokenType.Punctuator && item.value === ']') {
            this._state = ConsumerState.Done;
            break;
          }
        }
        case ArrayConsumerState.WaitingForValue: {
          const result = this.resolve(item);
          if (result instanceof PendingResolveResult) {
            this._pending = result;
            break;
          }
          this._data.push(result.data);
          this._size += result.data.size;
          this._arrayState = ArrayConsumerState.WaitingForComma;
          break;
        }
        case ArrayConsumerState.WaitingForComma: {
          if (item.type === TokenType.Punctuator && item.value === ']') {
            this._state = ConsumerState.Done;
            break;
          }
          if (item.value !== ',') {
            this._state = ConsumerState.Failed;
            this._errors.push('Expected comma in array.');
            break;
          }
          this._arrayState = ArrayConsumerState.WaitingForValue;
          break;
        }
      }
    }

    return this._state === ConsumerState.Done;
  }

  get data(): any[] {
    return this._data;
  }
}
