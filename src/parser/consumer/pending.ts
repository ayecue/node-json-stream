import { BaseConsumer } from './base';

export class PendingConsumer extends BaseConsumer {
  protected _pending: BaseConsumer | null = null;
  protected _pendingSize: number = 0;

  get size(): number {
    return this._size + this._pendingSize;
  }
}
