import { TokenResult, TokenType } from '../tokenizer/tokenizer-base';
import { ArrayConsumer } from './consumer/array';
import { BaseConsumer } from './consumer/base';
import { BooleanConsumer } from './consumer/boolean';
import { NilConsumer } from './consumer/nil';
import { NumberConsumer } from './consumer/number';
import { ObjectConsumer } from './consumer/object';
import { PendingConsumer } from './consumer/pending';
import { StringConsumer } from './consumer/string';

export const parse = (
  item: TokenResult
): BaseConsumer | PendingConsumer | null => {
  switch (item.type) {
    case TokenType.StringLiteral:
      return new StringConsumer();
    case TokenType.NumericLiteral:
      return new NumberConsumer();
    case TokenType.BooleanLiteral:
      return new BooleanConsumer();
    case TokenType.NilLiteral:
      return new NilConsumer();
    case TokenType.Punctuator:
      if (item.value === '[') {
        return new ArrayConsumer();
      } else if (item.value === '{') {
        return new ObjectConsumer();
      }
    default:
      return null;
  }
};
