import { TokenResult, TokenType } from "../tokenizer/tokenizer-base";
import { ArrayConsumer } from "./array-consumer";
import { Consumer, ConsumerState, PendingResolveResult, ResolveResult } from "./consumer";
import { ObjectConsumer } from "./object-consumer";

export class RootConsumer extends Consumer {
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
        this._data = this._pending.data;
        this._state = ConsumerState.Done;
        this._pending = null;
      }
    } else {
      const result = this.resolve(item);

      if (result instanceof PendingResolveResult) {
        this._pending = result;
      } else if (result instanceof PendingResolveResult) {
        this._data = result.data;
        this._state = ConsumerState.Done;
      }
    }

    return this._state === ConsumerState.Done;
  }

  get data(): any {
    return this._data;
  }
}