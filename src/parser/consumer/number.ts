import { TokenResult } from '../../tokenizer/tokenizer-base';
import { BaseConsumer, ConsumerState, ConsumerType } from './base';

export class NumberConsumer extends BaseConsumer {
  protected _data: number;
  protected _type: ConsumerType = ConsumerType.Number;

  consume(item: TokenResult): boolean {
    this._data = Number(item.value);
    this._size = Buffer.byteLength(item.value);
    this._state = ConsumerState.Done;
    this.emit('resolve', this);
    return true;
  }
}
