export enum TokenCode {
  Quote = 34,
  CurlyBracketsLeft = 123,
  CurlyBracketsRight = 125,
  SquareBracketsLeft = 91,
  SquareBracketsRight = 93,
  ParenthesisLeft = 40,
  ParenthesisRight = 41,
  Whitespace = 32,
  NewLine = 0,
  Number0 = 48,
  Number1 = 49,
  Number2 = 50,
  Number3 = 51,
  Number4 = 52,
  Number5 = 53,
  Number6 = 54,
  Number7 = 55,
  Number8 = 56,
  Number9 = 57,
  Dot = 46,
  Comma = 44,
  Slash = 47,
  Backslash = 92,
  E = 69,
  e = 101,
  Minus = 45,
  Plus = 43,
  Colon = 58
}

export enum TokenType {
  Invalid = 'invalid',
  EOF = 'eof',
  StringLiteral = 'string',
  NumericLiteral = 'numeric',
  Punctuator = 'punc',
  BooleanLiteral = 'bool',
  NilLiteral = 'nil',
  Incomplete = 'incomplete'
}

export const TokenTypeValues: string[] = Object.values(TokenType);

export class TokenResult {
  readonly type: TokenType;
  readonly value: string;

  static Seperator: string = ':';

  static parse(data: string): TokenResult | null {
    const index = data.indexOf(TokenResult.Seperator);

    if (index === -1) {
      return null;
    }

    const type = data.slice(0, index);

    if (TokenTypeValues.includes(type)) {
      const value = data.slice(index + 1);
      return new TokenResult(type as TokenType, value);
    }

    return null;
  }

  constructor(type: TokenType, value: string = '') {
    this.type = type;
    this.value = value;
  }

  toString() {
    return `${this.type}${TokenResult.Seperator}${this.value}`;
  }
}

export type PendingTokenResultResumeCallback = () => TokenResult;

export class PendingTokenResult extends TokenResult {
  resume?: () => TokenResult;

  constructor(type: TokenType, resume?: PendingTokenResultResumeCallback) {
    super(type);
    this.resume = resume;
  }
}

export interface TokenizerBase {
  getItemAt(offset?: number): number | null;
  getRawItemAt(offset?: number): string | null;
  isEOF(): boolean;
}
