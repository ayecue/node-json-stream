import { Consumer } from './consumer';
import { TokenCode, TokenizerBase } from './tokenizer-base';

export enum StringConsumerState {
  Pending = 0,
  Completed = 1,
  Failed = -1
}

export class StringConsumer extends Consumer {
  private tokenizer: TokenizerBase;
  private _index: number;
  private _buffer: string = '';
  private _state: StringConsumerState = StringConsumerState.Pending;
  private maxLength: number;

  constructor(tokenizer: TokenizerBase, maxLength: number, offset: number = 1) {
    super();
    this.tokenizer = tokenizer;
    this.maxLength = maxLength;
    this._index = offset;
  }

  private digest(): void {
    let item = this.tokenizer.getRawItemAt(this._index);

    while (item !== null && this._index <= this.maxLength) {
      const code = item.charCodeAt(0);
      const next = this.tokenizer.getRawItemAt(this._index + 1);
      const nextCode = next.charCodeAt(0);

      if (code === TokenCode.Quote) {
        this._state = StringConsumerState.Completed;
        this._index++;
        break;
      } else if (code !== TokenCode.Backslash && nextCode === TokenCode.Quote) {
        this._state = StringConsumerState.Completed;
        this._buffer += item;
        this._index += 2;
        break;
      } else if (code === TokenCode.Backslash && nextCode === TokenCode.Quote) {
        this._buffer += '"';
        this._index++;
      } else if (
        code === TokenCode.Backslash &&
        nextCode === TokenCode.Backslash
      ) {
        this._buffer += '\\';
        this._index++;
      } else {
        this._buffer += item;
      }

      this._index++;
      item = this.tokenizer.getRawItemAt(this._index);
    }
  }

  consume(): boolean {
    this.digest();

    if (this._index > this.maxLength) {
      this._state = StringConsumerState.Failed;
    }

    return this._state === StringConsumerState.Completed;
  }

  get index(): number {
    return this._index;
  }

  get value(): string {
    return this._buffer;
  }

  get state(): StringConsumerState {
    return this._state;
  }
}
