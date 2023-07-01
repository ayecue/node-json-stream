import { TokenResult, TokenType } from "../tokenizer/tokenizer-base";
import { ArrayConsumer } from "./array-consumer";
import { Consumer, ConsumerState, PendingResolveResult, ResolveResult } from "./consumer";

export enum ObjectConsumerState {
  Initial = 0,
  WaitingForKey = 1,
  WaitingForDelimiter = 2,
  WaitingForValue = 3,
  WaitingForComma = 4,
}

export class ObjectConsumer extends Consumer {
  protected _data: Record<string, any> = {};
  private _lastKey: string | null = null;
  private _objectState: ObjectConsumerState = ObjectConsumerState.Initial;

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
        this._data[this._lastKey] = this._pending.data;
        this._objectState = ObjectConsumerState.WaitingForComma;
        this._pending = null;
      }
    } else {
      switch (this._objectState) {
        case ObjectConsumerState.Initial:
          if (item.type === TokenType.Punctuator && item.value === '}') {
            this._state = ConsumerState.Done;
            break;
          }
        case ObjectConsumerState.WaitingForKey:
          if (item.type !== TokenType.StringLiteral) {
            throw new Error('Object key has to be string.');
          }
          this._lastKey = item.value.slice(1, -1);
          this._objectState = ObjectConsumerState.WaitingForDelimiter;
          break;
        case ObjectConsumerState.WaitingForDelimiter:
          if (item.value !== ':') {
            throw new Error('Expected delimiter in object.');
          }
          this._objectState = ObjectConsumerState.WaitingForValue;
          break;
        case ObjectConsumerState.WaitingForValue:
          const result = this.resolve(item);
          if (result instanceof PendingResolveResult) {
            this._pending = result;
            break;
          }
          this._data[this._lastKey] = result.data;
          this._objectState = ObjectConsumerState.WaitingForComma;
          break;
        case ObjectConsumerState.WaitingForComma:
          if (item.type === TokenType.Punctuator && item.value === '}') {
            this._state = ConsumerState.Done;
            break;
          }
          if (item.value !== ',') {
            throw new Error('Expected comma in object.');
          }
          this._objectState = ObjectConsumerState.WaitingForKey;
          break;
      }
    }

    return this._state === ConsumerState.Done;
  }

  get data(): Record<string, any> {
    return this._data;
  }
}