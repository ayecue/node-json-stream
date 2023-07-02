import { TokenResult } from '../../tokenizer/tokenizer-base';
import { BaseConsumer, ConsumerState, ConsumerType } from './base';

export class StringConsumer extends BaseConsumer {
  protected _data: string;
  protected _type: ConsumerType = ConsumerType.String;

  consume(item: TokenResult): boolean {
    this._data = item.value;
    this._size = Buffer.byteLength(item.value);
    this._state = ConsumerState.Done;
    this._resolveCallback?.(this._data);
    return true;
  }
}
