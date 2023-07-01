import { Consumer } from './consumer';
import { TokenCode, TokenizerBase } from './tokenizer-base';

export enum DigitConsumerState {
  WholeNumber = 0,
  Dot = 1,
  FloatingDigit = 2,
  ENotation = 3,
  EOperation = 4,
  ENotationDigits = 5,
  Completed = 6
}

export class DigitConsumer extends Consumer {
  private tokenizer: TokenizerBase;
  private _index: number;
  private state: DigitConsumerState = DigitConsumerState.WholeNumber;

  constructor(tokenizer: TokenizerBase, offset: number = 0) {
    super();
    this.tokenizer = tokenizer;
    this._index = offset;
  }

  private digestDigits(callback = () => {}) {
    let item = this.tokenizer.getItemAt(this._index);

    while (item !== null) {
      if (item < TokenCode.Number0 || item > TokenCode.Number9) {
        callback();
        break;
      }

      item = this.tokenizer.getItemAt(++this._index);
    }
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
