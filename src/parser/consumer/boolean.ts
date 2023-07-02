import { TokenResult } from '../../tokenizer/tokenizer-base';
import { BaseConsumer, ConsumerState, ConsumerType } from './base';

export class BooleanConsumer extends BaseConsumer {
  protected _data: boolean;
  protected _size: number = 1;
  protected _type: ConsumerType = ConsumerType.Boolean;

  consume(item: TokenResult): boolean {
    this._data = item.value === 'true';
    this._state = ConsumerState.Done;
    this._resolveCallback?.(this._data);
    return true;
  }
}
