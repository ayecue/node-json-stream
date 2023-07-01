import { Consumer } from './consumer';
import { TokenCode, TokenizerBase } from './tokenizer-base';

export enum DigitConsumerState {
  Unary = 0,
  WholeNumber = 1,
  Dot = 2,
  FloatingDigit = 3,
  ENotation = 4,
  EOperation = 5,
  ENotationDigits = 6,
  Completed = 7
}

export class DigitConsumer extends Consumer {
  private tokenizer: TokenizerBase;
  private _index: number;
  private state: DigitConsumerState = DigitConsumerState.WholeNumber;

  constructor(tokenizer: TokenizerBase, offset: number = 1) {
    super();
    this.tokenizer = tokenizer;
    this._index = offset;
  }

  private digestUnary() {
    const item = this.tokenizer.getItemAt(this._index);

    if (item === TokenCode.Minus || item === TokenCode.Plus) {
      this._index++;
    }
    this.state++;
  }

  private digestDigits(callback = () => {}) {
    let item = this.tokenizer.getItemAt(this._index);

    while (item !== null) {
      if (item < TokenCode.Number0 || item > TokenCode.Number9) {
        break;
      }

      item = this.tokenizer.getItemAt(++this._index);
    }

    callback();
  }

  private digestDot() {
    const item = this.tokenizer.getItemAt(this._index);

    if (item === TokenCode.Dot) {
      this._index++;
      this.state++;
    } else {
      this.state = DigitConsumerState.ENotation;
    }
  }

  private digestENotation() {
    const item = this.tokenizer.getItemAt(this._index);

    if (item === TokenCode.E || item === TokenCode.e) {
      this._index++;
      this.state++;
    } else {
      this.state = DigitConsumerState.Completed;
    }
  }

  private digestEOperator() {
    const item = this.tokenizer.getItemAt(this._index);

    if (item === TokenCode.Minus || item === TokenCode.Plus) {
      this._index++;
    }
    this.state++;
  }

  private digest(): void {
    switch (this.state) {
      case DigitConsumerState.Unary:
        this.digestUnary();
        break;
      case DigitConsumerState.WholeNumber:
      case DigitConsumerState.FloatingDigit:
      case DigitConsumerState.ENotationDigits:
        this.digestDigits(() => this.state++);
        break;
      case DigitConsumerState.Dot:
        this.digestDot();
        break;
      case DigitConsumerState.ENotation:
        this.digestENotation();
        break;
      case DigitConsumerState.EOperation:
        this.digestEOperator();
        break;
    }
  }

  consume(): boolean {
    while (
      !this.tokenizer.isEOF() &&
      this.state !== DigitConsumerState.Completed
    )
      this.digest();
    return this.state === DigitConsumerState.Completed;
  }

  get index(): number {
    return this._index;
  }
}
