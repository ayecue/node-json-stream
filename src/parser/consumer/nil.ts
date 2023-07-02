import { TokenResult } from '../../tokenizer/tokenizer-base';
import { BaseConsumer, ConsumerState, ConsumerType } from './base';

export class NilConsumer extends BaseConsumer {
  protected _data: null = null;
  protected _size: number = 3;
  protected _type: ConsumerType = ConsumerType.Nil;

  consume(_item: TokenResult): boolean {
    this._state = ConsumerState.Done;
    this._resolveCallback?.(null);
    return true;
  }
}
