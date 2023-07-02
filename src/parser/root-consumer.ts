import { TokenResult, TokenType } from '../tokenizer/tokenizer-base';
import { ArrayConsumer } from './array-consumer';
import {
  Consumer,
  ConsumerState,
  PendingResolveResult,
  ResolveResult,
  ResultType
} from './consumer';
import { ObjectConsumer } from './object-consumer';

export interface RootConsumerOptions {
  allowedElements?: ResultType[];
}

export class RootConsumer extends Consumer {
  readonly allowedElements: ResultType[];

  constructor(options: RootConsumerOptions = {}) {
    super();
    this.allowedElements = options.allowedElements ?? [];
  }

  protected resolve(item: TokenResult): ResolveResult | PendingResolveResult {
    switch (item.type) {
      case TokenType.Punctuator: {
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
      }
      default:
        return super.resolve(item);
    }
  }

  consume(item: TokenResult): boolean {
    if (this._pending !== null) {
      if (this._pending.consume(item)) {
        this._data = this._pending.data;
        this._size += this._pending.size;
        this._state = ConsumerState.Done;
        this._pendingSize = 0;
        this._pending = null;
      } else if (this._pending.state === ConsumerState.Failed) {
        this._state = ConsumerState.Failed;
      } else {
        this._pendingSize = this._pending.size;
      }
    } else {
      const result = this.resolve(item);

      if (result instanceof PendingResolveResult) {
        this._pending = result;
      } else if (result instanceof ResolveResult) {
        this._data = result.data;
        this._size += result.size;
        this._state = ConsumerState.Done;
      }

      if (!this.allowedElements.includes(result.type)) {
        this._state = ConsumerState.Failed;
      }
    }

    return this._state === ConsumerState.Done;
  }

  get data(): any {
    return this._data;
  }
}
