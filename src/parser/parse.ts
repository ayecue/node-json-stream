import { TokenResult, TokenType } from '../tokenizer/tokenizer-base';
import { ArrayConsumer } from './consumer/array';
import {
  BaseConsumer,
  ResolveContext,
  shouldPassResolveContext
} from './consumer/base';
import { BooleanConsumer } from './consumer/boolean';
import { NilConsumer } from './consumer/nil';
import { NumberConsumer } from './consumer/number';
import { ObjectConsumer } from './consumer/object';
import { PendingConsumer } from './consumer/pending';
import { StringConsumer } from './consumer/string';

export const parse = (
  item: TokenResult,
  resolveContext?: ResolveContext,
  currentPath: string = ''
): BaseConsumer | PendingConsumer | null => {
  switch (item.type) {
    case TokenType.StringLiteral:
      return new StringConsumer({
        resolveContext: shouldPassResolveContext(currentPath, resolveContext)
          ? resolveContext
          : null,
        currentPath
      });
    case TokenType.NumericLiteral:
      return new NumberConsumer({
        resolveContext: shouldPassResolveContext(currentPath, resolveContext)
          ? resolveContext
          : null,
        currentPath
      });
    case TokenType.BooleanLiteral:
      return new BooleanConsumer({
        resolveContext: shouldPassResolveContext(currentPath, resolveContext)
          ? resolveContext
          : null,
        currentPath
      });
    case TokenType.NilLiteral:
      return new NilConsumer({
        resolveContext: shouldPassResolveContext(currentPath, resolveContext)
          ? resolveContext
          : null,
        currentPath
      });
    case TokenType.Punctuator:
      if (item.value === '[') {
        return new ArrayConsumer({
          resolveContext: shouldPassResolveContext(currentPath, resolveContext)
            ? resolveContext
            : null,
          currentPath
        });
      } else if (item.value === '{') {
        return new ObjectConsumer({
          resolveContext: shouldPassResolveContext(currentPath, resolveContext)
            ? resolveContext
            : null,
          currentPath
        });
      }
    default:
      return null;
  }
};
