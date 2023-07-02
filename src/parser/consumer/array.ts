import { TokenResult, TokenType } from '../../tokenizer/tokenizer-base';
import { parse } from '../parse';
import { BaseConsumerOptions, ConsumerState, ConsumerType, ResolveContext } from './base';
import { PendingConsumer } from './pending';

export enum ArrayConsumerState {
  Initial = 0,
  AfterInitial = 1,
  WaitingForValue = 1,
  WaitingForComma = 2
}

export class ArrayConsumer extends PendingConsumer {
  protected _data: any[] = [];
  protected _size: number = 5;
  protected _type: ConsumerType = ConsumerType.Array;

  private _arrayState: ArrayConsumerState = ArrayConsumerState.Initial;
  private _resolveContext: ResolveContext;

  constructor(options: BaseConsumerOptions) {
    super(options);
    this._resolveContext = options.resolveContext;
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
        this._lastError = this._pending.lastError;
      } else {
        this._pendingSize = this._pending.size;
      }
    } else {
      switch (this._arrayState) {
        case ArrayConsumerState.Initial: {
          if (item.type !== TokenType.Punctuator || item.value !== '[') {
            this._state = ConsumerState.Failed;
            this._lastError = new Error(
              'Object requires opening square brackets.'
            );
            break;
          }
          this._arrayState = ArrayConsumerState.AfterInitial;
          break;
        }
        case ArrayConsumerState.AfterInitial: {
          if (item.type === TokenType.Punctuator && item.value === ']') {
            this._state = ConsumerState.Done;
            this._resolveCallback?.(this._data);
            break;
          }
        }
        case ArrayConsumerState.WaitingForValue: {
          const result = parse(item, this._resolveContext, [...this._currentPath, this._data.length.toString()]);

          if (result === null) {
            this._state = ConsumerState.Failed;
            this._lastError = new Error('Invalid value in array.');
            break;
          }

          if (result.consume(item)) {
            this._data.push(result.data);
            this._size += result.size;
            this._arrayState = ArrayConsumerState.WaitingForComma;
          } else if (result.state === ConsumerState.Failed) {
            this._state = ConsumerState.Failed;
            this._lastError = new Error('Failed to parse value in array.');
          } else {
            this._pending = result;
          }
          break;
        }
        case ArrayConsumerState.WaitingForComma: {
          if (item.type === TokenType.Punctuator && item.value === ']') {
            this._state = ConsumerState.Done;
            this._resolveCallback?.(this._data);
            break;
          }
          if (item.value !== ',') {
            this._state = ConsumerState.Failed;
            this._lastError = new Error('Expected comma in array.');
            break;
          }
          this._arrayState = ArrayConsumerState.WaitingForValue;
          break;
        }
      }
    }

    return this._state === ConsumerState.Done;
  }
}
