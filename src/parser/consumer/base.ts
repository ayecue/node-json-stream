import { TokenResult } from '../../tokenizer/tokenizer-base';

export enum ConsumerState {
  Pending = 0,
  Done = 1,
  Failed = -1
}

export enum ConsumerType {
  Unknown = 'unknown',
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Nil = 'nil',
  Object = 'object',
  Array = 'array'
}

export type OnResolveCallback = (data: any) => void;
export class ResolveContext {
  resolvePath: string[];
  onResolve: OnResolveCallback;
}

export interface BaseConsumerOptions {
  currentPath?: string;
  resolveContext?: ResolveContext;
}

export const isMatchingPath = (
  path: string,
  resolveContext: ResolveContext
): boolean => {
  const segments = path.length === 0 ? [] : path.split('.');

  if (segments.length === resolveContext.resolvePath.length) {
    return resolveContext.resolvePath.every((item, index) => {
      if (item === '*') return true;
      return item === segments[index];
    });
  }

  return false;
};

export const shouldPassResolveContext = (
  path: string,
  resolveContext: ResolveContext = null
): boolean => {
  if (resolveContext === null) return false;
  const segments = path.length === 0 ? [] : path.split('.');
  if (segments.length <= resolveContext.resolvePath.length) {
    return segments.every((item, index) => {
      if (segments[index] === '*') return true;
      return item === segments[index];
    });
  }
  return false;
};

export class BaseConsumer {
  protected _data: any = null;
  protected _size: number = 0;
  protected _state: ConsumerState = ConsumerState.Pending;
  protected _type: ConsumerType = ConsumerType.Unknown;
  protected _lastError: Error | null;

  protected _currentPath: string | null;
  protected _resolveCallback: OnResolveCallback | null;

  constructor(options: BaseConsumerOptions) {
    this._currentPath = options.currentPath ?? null;
    this._resolveCallback = null;

    if (
      options.resolveContext &&
      isMatchingPath(this._currentPath, options.resolveContext)
    ) {
      this._resolveCallback = options.resolveContext.onResolve;
    }
  }

  consume(_item: TokenResult): boolean {
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
    return this._size;
  }

  get type(): ConsumerType {
    return this._type;
  }

  get lastError(): Error {
    return this._lastError;
  }
}
