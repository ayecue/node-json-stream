import { Consumer } from './consumer';
import { TokenCode, TokenizerBase } from './tokenizer-base';

export enum StringConsumerState {
  Pending = 0,
  Completed = 1
}

export class StringConsumer extends Consumer {
  private tokenizer: TokenizerBase;
  private _index: number;
  private _buffer: string = '';
  private _previousCode: number | null = null;
  private state: StringConsumerState = StringConsumerState.Pending;

  constructor(tokenizer: TokenizerBase, offset: number = 1) {
    super();
    this.tokenizer = tokenizer;
    this._index = offset;
  }

  private digest(): void {
    let item = this.tokenizer.getRawItemAt(this._index);

    while (item !== null) {
      const code = item.charCodeAt(0);
      const next = this.tokenizer.getRawItemAt(this._index + 1);
      const nextCode = next.charCodeAt(0);

      if (code === TokenCode.Quote) {
        this.state = StringConsumerState.Completed;
        this._index++;
        break;
      } else if (code !== TokenCode.Backslash && nextCode === TokenCode.Quote) {
        this.state = StringConsumerState.Completed;
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

      this._previousCode = code;
      this._index++;
      item = this.tokenizer.getRawItemAt(this._index);
    }
  }

  consume(): boolean {
    this.digest();
    return this.state === StringConsumerState.Completed;
  }

  get index(): number {
    return this._index;
  }

  get value(): string {
    return this._buffer;
  }
}
