import { TokenResult } from '../../tokenizer/tokenizer-base';
import { BaseConsumer, ConsumerState, ConsumerType } from './base';

export class NilConsumer extends BaseConsumer {
  protected _data: null = null;
  protected _size: number = 0;
  protected _type: ConsumerType = ConsumerType.Nil;

  consume(_item: TokenResult): boolean {
    this._state = ConsumerState.Done;
    return true;
  }
}
