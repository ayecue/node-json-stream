import { TokenResult, TokenType } from '../tokenizer/tokenizer-base';
import {
  Consumer,
  ConsumerState,
  PendingResolveResult,
  ResolveResult
} from './consumer';
import { ObjectConsumer } from './object-consumer';

export enum ArrayConsumerState {
  Initial = 0,
  WaitingForValue = 1,
  WaitingForComma = 2
}

export class ArrayConsumer extends Consumer {
  protected _data: any[] = [];
  private _arrayState: ArrayConsumerState = ArrayConsumerState.Initial;

  protected resolve(item: TokenResult): ResolveResult | PendingResolveResult {
    switch (item.type) {
      case TokenType.Punctuator:
        if (item.value === '[') {
          return new PendingResolveResult(new ArrayConsumer());
        } else if (item.value === '{') {
          return new PendingResolveResult(new ObjectConsumer());
        }
      default:
        return super.resolve(item);
    }
  }

  consume(item: TokenResult): boolean {
    if (this._pending !== null) {
      if (this._pending.consume(item)) {
        this._data.push(this._pending.data);
        this._arrayState = ArrayConsumerState.WaitingForComma;
        this._pending = null;
      } else if (this._pending.state === ConsumerState.Failed) {
        this._state = ConsumerState.Failed;
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
