import { TokenResult, TokenType } from '../tokenizer/tokenizer-base';

export enum ConsumerState {
  Pending = 0,
  Done = 1,
  Failed = -1
}

export class ResolveResult {
  private _data?: string;

  constructor(data: string = '') {
    this._data = data;
  }

  get data(): any {
    return this._data;
  }
}

export class PendingResolveResult extends ResolveResult {
  private pending: Consumer;

  constructor(pending: Consumer) {
    super();
    this.pending = pending;
  }

  consume(item: TokenResult) {
    return this.pending.consume(item);
  }

  get data(): any {
    return this.pending.data;
  }

  get state(): any {
    return this.pending.state;
  }
}

export class Consumer {
  protected _pending: PendingResolveResult | null = null;
  protected _data: string = '';
  protected _errors: string[] = [];
  protected _state: ConsumerState = ConsumerState.Pending;

  protected resolve(item: TokenResult): ResolveResult {
    switch (item.type) {
      case TokenType.StringLiteral:
        return new ResolveResult(item.value);
      case TokenType.NumericLiteral:
        return new ResolveResult(item.value);
      case TokenType.BooleanLiteral:
        return new ResolveResult(item.value);
      default:
        this._state = ConsumerState.Failed;
        this._errors.push('Unexpected type.');
        break;
    }
  }

  consume(_item: TokenResult): boolean {
    return false;
  }

  get data(): string {
    return this._data;
  }

  get state(): ConsumerState {
    return this._state;
  }
}
