import { Consumer } from './consumer';
import { TokenCode, TokenizerBase } from './tokenizer-base';

export enum StringConsumerState {
  Pending = 0,
  Completed = 1,
  Failed = -1
}

const STRING_CONSUMER_ESCAPE_CHARACTER = String.fromCharCode(
  TokenCode.Backslash
);
const STRING_CONSUMER_ESCAPE_QUOTE = String.fromCharCode(TokenCode.Quote);

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

  private findNextEscape(): number | null {
    const escapeIndex = this.tokenizer.findNextIndex(
      STRING_CONSUMER_ESCAPE_CHARACTER,
      this._index
    );
    const quoteIndex = this.tokenizer.findNextIndex(
      STRING_CONSUMER_ESCAPE_QUOTE,
      this._index
    );

    if (escapeIndex === -1) {
      return null;
    }

    if (quoteIndex === -1 || escapeIndex < quoteIndex) {
      return escapeIndex;
    }

    return null;
  }

  private digest(): void {
    let index = this.findNextEscape();

    while (index !== null && this._index <= this.maxLength) {
      const nextCode = this.tokenizer.getItemAt(index + 1);

      if (nextCode === TokenCode.Backslash) {
        this._state = StringConsumerState.Completed;
        this._buffer +=
          this.tokenizer.getRange(this._index, index) +
          STRING_CONSUMER_ESCAPE_CHARACTER;
        this._index = index + 2;
      } else if (nextCode === TokenCode.Quote) {
        this._buffer +=
          this.tokenizer.getRange(this._index, index) +
          STRING_CONSUMER_ESCAPE_QUOTE;
        this._index = index + 2;
      } else {
        this._buffer += this.tokenizer.getRange(this._index, index + 1);
        this._index = index + 1;
      }

      index = this.findNextEscape();
    }

    index = this.tokenizer.findNextIndex(
      STRING_CONSUMER_ESCAPE_QUOTE,
      this._index
    );

    if (index !== null) {
      const previousCode = this.tokenizer.getItemAt(index - 1);
      const code = this.tokenizer.getItemAt(index);

      if (previousCode !== TokenCode.Backslash && code === TokenCode.Quote) {
        this._state = StringConsumerState.Completed;
        this._buffer += this.tokenizer.getRange(this._index, index);
        this._index = index + 1;
      }
    }

    if (this._state !== StringConsumerState.Completed) {
      const nextIndex = this.tokenizer.getRemainingSize();
      this._buffer += this.tokenizer.getRange(this._index, nextIndex) ?? '';
      this._index = nextIndex;
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
