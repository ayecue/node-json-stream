import { TokenResult, TokenType } from '../tokenizer/tokenizer-base';
import { transformToBoolean, transformToNumber } from './utils';

export enum ConsumerState {
  Pending = 0,
  Done = 1,
  Failed = -1
}

export enum ResultType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Null = 'null',
  Array = 'array',
  Object = 'object'
}

export class ResolveResult {
  protected _data: any;
  protected _size: number;
  protected _type: ResultType;

  constructor(type: ResultType, data: any, size: number) {
    this._type = type;
    this._data = data;
    this._size = size;
  }

  get data(): any {
    return this._data;
  }

  get size(): number {
    return this._size;
  }

  get type(): ResultType {
    return this._type;
  }
}

export class PendingResolveResult extends ResolveResult {
  private pending: Consumer;

  constructor(type: ResultType, pending: Consumer) {
    super(type, null, 0);
    this.pending = pending;
  }

  consume(item: TokenResult) {
    const result = this.pending.consume(item);
    this._data = this.pending.data;
    this._size = this.pending.size;
    return result;
  }

  get state(): any {
    return this.pending.state;
  }
}

export class Consumer {
  protected _data: any = null;
  protected _size: number = 0;
  protected _state: ConsumerState = ConsumerState.Pending;

  protected _pending: PendingResolveResult | null = null;
  protected _pendingSize: number = 0;

  protected _errors: string[] = [];

  protected resolve(item: TokenResult): ResolveResult {
    switch (item.type) {
      case TokenType.StringLiteral: {
        return new ResolveResult(
          ResultType.String,
          item.value,
          Buffer.byteLength(item.value)
        );
      }
      case TokenType.NumericLiteral: {
        return new ResolveResult(
          ResultType.Number,
          transformToNumber(item.value),
          Buffer.byteLength(item.value)
        );
      }
      case TokenType.BooleanLiteral: {
        return new ResolveResult(
          ResultType.Boolean,
          transformToBoolean(item.value),
          1
        );
      }
      case TokenType.NilLiteral: {
        return new ResolveResult(ResultType.Null, null, 0);
      }
      default: {
        this._state = ConsumerState.Failed;
        this._errors.push('Unexpected type.');
        return new ResolveResult(ResultType.Null, null, 0);
      }
    }
  }

  consume(item: TokenResult): boolean {
    this._data = this.resolve(item);
    this._size += this._data.size;
    this._state = ConsumerState.Done;
    return true;
  }

  get data(): any {
    return this._data;
  }

  get state(): ConsumerState {
    return this._state;
  }

  get size(): number {
    return this._size + this._pendingSize;
  }
}
