import { Transform, TransformCallback, TransformOptions } from 'stream';

import { DigitConsumer, DigitConsumerState } from './tokenizer/digit-consumer';
import {
  StringConsumer,
  StringConsumerState
} from './tokenizer/string-consumer';
import {
  PendingTokenResult,
  TokenCode,
  TokenizerBase,
  TokenResult,
  TokenType
} from './tokenizer/tokenizer-base';

export interface TokenizerOptions extends TransformOptions {
  maxNumberLength?: number;
  maxStringLength?: number;
  separatorCharacter?: string;
}

export const DEFAULT_TOKENIZER_MAX_NUMBER_LENGTH = 20;
export const DEFAULT_TOKENIZER_MAX_STRING_LENGTH = 1000;
export const DEFAULT_TOKENIZER_SEPARATOR_CHARACTER = String.fromCharCode(10);

export class Tokenizer extends Transform implements TokenizerBase {
  private _buffer: string = '';
  private _pending: PendingTokenResult | null = null;

  public maxNumberLength: number;
  public maxStringLength: number;
  public separatorCharacter: string;

  constructor(options: TokenizerOptions = {}) {
    super({
      writableObjectMode: true,
      readableObjectMode: true,
      encoding: 'utf-8',
      ...options
    });
    this.maxNumberLength =
      options.maxNumberLength ?? DEFAULT_TOKENIZER_MAX_NUMBER_LENGTH;
    this.maxStringLength =
      options.maxStringLength ?? DEFAULT_TOKENIZER_MAX_STRING_LENGTH;
    this.separatorCharacter =
      options.separatorCharacter ?? DEFAULT_TOKENIZER_SEPARATOR_CHARACTER;
  }

  isEOF(): boolean {
    return this._buffer.length === 0;
  }

  getItemAt(offset: number = 0): number | null {
    if (this._buffer.length <= offset) {
      return null;
    }

    return this._buffer.charCodeAt(offset);
  }

  getRawItemAt(offset: number = 0): string | null {
    if (this._buffer.length <= offset) {
      return null;
    }

    return this._buffer.charAt(offset);
  }

  findNextIndex(item: string, startFrom: number = 0): number | null {
    const index = this._buffer.indexOf(item, startFrom);

    if (index === -1) {
      return null;
    }

    return index;
  }

  getRemainingSize(): number {
    return this._buffer.length;
  }

  getRange(from: number, to: number): string | null {
    if (this._buffer.length < from) return null;
    if (this._buffer.length < to) return null;
    return this._buffer.slice(from, to);
  }

  getText(): string {
    return this._buffer;
  }

  private scanNumericLiteral() {
    const numericScanner = new DigitConsumer(this, this.maxNumberLength, 1);
    const consume = (): TokenResult => {
      if (numericScanner.consume()) {
        const value = this._buffer.slice(0, numericScanner.index);
        this._buffer = this._buffer.slice(numericScanner.index);
        return new TokenResult(TokenType.NumericLiteral, value);
      } else if (numericScanner.state === DigitConsumerState.Failed) {
        this._buffer = this._buffer.slice(numericScanner.index);
        return new TokenResult(
          TokenType.Invalid,
          `Number exceeds maximal length of ${this.maxNumberLength}.`
        );
      }

      return new PendingTokenResult(TokenType.Incomplete, consume);
    };

    return consume();
  }

  private scanStringLiteral() {
    const stringScanner = new StringConsumer(this, this.maxStringLength, 1);
    const consume = (): TokenResult => {
      if (stringScanner.consume()) {
        const value = stringScanner.value;
        this._buffer = this._buffer.slice(stringScanner.index);
        return new TokenResult(TokenType.StringLiteral, value);
      } else if (stringScanner.state === StringConsumerState.Failed) {
        this._buffer = this._buffer.slice(stringScanner.index);
        return new TokenResult(
          TokenType.Invalid,
          `String exceeds maximal length of ${this.maxStringLength}.`
        );
      }

      return new PendingTokenResult(TokenType.Incomplete, consume);
    };

    return consume();
  }

  private scanPunctuator(item: number): TokenResult {
    this._buffer = this._buffer.slice(1);
    return new TokenResult(TokenType.Punctuator, String.fromCharCode(item));
  }

  private scan(item: number): TokenResult | null {
    switch (item) {
      case TokenCode.Quote:
        return this.scanStringLiteral();
      case TokenCode.SquareBracketsLeft:
      case TokenCode.SquareBracketsRight:
      case TokenCode.CurlyBracketsLeft:
      case TokenCode.CurlyBracketsRight:
      case TokenCode.Colon:
      case TokenCode.Comma:
        return this.scanPunctuator(item);
      case TokenCode.Plus:
      case TokenCode.Minus:
        return this.scanNumericLiteral();
      default:
        if (TokenCode.Number0 <= item && TokenCode.Number9 >= item) {
          return this.scanNumericLiteral();
        }
        return null;
    }
  }

  private scanKeyword(): TokenResult | null {
    if (this._buffer.startsWith('true')) {
      this._buffer = this._buffer.slice(4);
      return new TokenResult(TokenType.BooleanLiteral, 'true');
    } else if (this._buffer.startsWith('false')) {
      this._buffer = this._buffer.slice(5);
      return new TokenResult(TokenType.BooleanLiteral, 'false');
    } else if (this._buffer.startsWith('null')) {
      this._buffer = this._buffer.slice(4);
      return new TokenResult(TokenType.NilLiteral);
    }

    return null;
  }

  private skipWhiteSpace() {
    let skip = 0;
    while (!this.isEOF()) {
      const item = this.getItemAt(skip);
      if (item !== TokenCode.Whitespace) break;
      skip++;
    }
    this._buffer = this._buffer.slice(skip);
  }

  private next(): TokenResult {
    this.skipWhiteSpace();

    if (this.isEOF()) {
      return new TokenResult(TokenType.EOF);
    }

    const keywordResult = this.scanKeyword();

    if (keywordResult !== null) {
      return keywordResult;
    }

    if (this._buffer.startsWith(this.separatorCharacter)) {
      this._buffer = this._buffer.slice(this.separatorCharacter.length);
      return new TokenResult(TokenType.Seperator, this.separatorCharacter);
    }

    const item = this.getItemAt();
    const scanResult = this.scan(item);

    if (scanResult !== null) {
      return scanResult;
    }

    return new TokenResult(
      TokenType.Invalid,
      'Unknown token in relation to JSON specification.'
    );
  }

  _transform(chunk: Buffer, encoding: string, callback: TransformCallback) {
    this._buffer += chunk.toString(encoding);

    let current;

    if (this._pending !== null) {
      current = this._pending.resume();
      this._pending = null;
    } else {
      current = this.next();
    }

    while (current.type !== TokenType.EOF) {
      if (current.type === TokenType.Invalid) {
        this._buffer = this._buffer.slice(1);
        this.emit('data', current);
      } else if (current.type === TokenType.Incomplete) {
        this._pending = current;
        break;
      } else {
        this.emit('data', current);
      }

      current = this.next();
    }

    callback(null);
  }
}
