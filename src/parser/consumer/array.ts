import { TokenResult, TokenType } from '../../tokenizer/tokenizer-base';
import { parse } from '../parse';
import { BaseConsumer, ConsumerState, ConsumerType } from './base';
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

  consume(item: TokenResult): boolean {
    if (this._pending !== null) {
      if (this._pending.consume(item)) {
        this._arrayState = ArrayConsumerState.WaitingForComma;
        this._pendingSize = 0;
        this._pending = null;
      } else {
        this._pendingSize = this._pending.size;
      }
    } else {
      switch (this._arrayState) {
        case ArrayConsumerState.Initial: {
          if (item.type !== TokenType.Punctuator || item.value !== '[') {
            this._state = ConsumerState.Failed;
            this.emit(
              'error',
              new Error('Object requires opening square brackets.')
            );
            break;
          }
          this._arrayState = ArrayConsumerState.AfterInitial;
          break;
        }
        case ArrayConsumerState.AfterInitial: {
          if (item.type === TokenType.Punctuator && item.value === ']') {
            this._state = ConsumerState.Done;
            this.emit('resolve', this);
            break;
          }
        }
        case ArrayConsumerState.WaitingForValue: {
          const result = parse(item);

          if (result === null) {
            this._state = ConsumerState.Failed;
            this.emit('error', new Error('Invalid value in array.'));
            break;
          }

          if (result.consume(item)) {
            this._data.push(result.data);
            this._size += result.size;
            this._arrayState = ArrayConsumerState.WaitingForComma;
          } else if (result.state === ConsumerState.Failed) {
            this._state = ConsumerState.Failed;
            this.emit('error', new Error('Failed to parse value in array.'));
          } else {
            this._pending = result;

            result.on('resolve', (consumer: BaseConsumer) => {
              this._data.push(consumer.data);
              this._size += consumer.size;
            });

            result.on('error', (err: Error) => {
              this._state = ConsumerState.Failed;
              this.emit('error', err);
            });
          }
          break;
        }
        case ArrayConsumerState.WaitingForComma: {
          if (item.type === TokenType.Punctuator && item.value === ']') {
            this._state = ConsumerState.Done;
            this.emit('resolve', this);
            break;
          }
          if (item.value !== ',') {
            this._state = ConsumerState.Failed;
            this.emit('error', new Error('Expected comma in array.'));
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
