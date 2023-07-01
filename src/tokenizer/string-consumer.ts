import { Consumer } from './consumer';
import { TokenCode, TokenizerBase } from './tokenizer-base';

export enum StringConsumerState {
  Pending = 0,
  Completed = 1
}

export class StringConsumer extends Consumer {
  private tokenizer: TokenizerBase;
  private _index: number = 1;
  private previous: number | null = null;
  private state: StringConsumerState = StringConsumerState.Pending;

  constructor(tokenizer: TokenizerBase, offset: number = 0) {
    super();
    this.tokenizer = tokenizer;
    this._index = offset;
  }

  private digest(): void {
    let item = this.tokenizer.getItemAt(this._index);

    while (item !== null) {
      if (item === TokenCode.Quote && this.previous !== TokenCode.Backslash) {
        this.state = StringConsumerState.Completed;
        this._index++;
        break;
      }

      this.previous = item;
      item = this.tokenizer.getItemAt(++this._index);
    }
  }

  consume(): boolean {
    this.digest();
    return this.state === StringConsumerState.Completed;
  }

  get index(): number {
    return this._index;
  }
}
