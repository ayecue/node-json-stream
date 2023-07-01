import { Parser as JsonStreamParser, Tokenizer } from '../src/index';
import { chain } from 'stream-chain';

const tokenizer = new Tokenizer();
const parser = new JsonStreamParser();

const testStream = chain([
  tokenizer,
  parser
]);

testStream.on('data', (data) => {
  console.log(data);
});

parser.on('invalid-json', (err) => {
  console.log('InvalidJSON', err);
});

parser.on('invalid-token', (err) => {
  console.log('InvalidToken', err);
});

testStream.write("{ was: aw}");

for (let i = 0; i <= 10; i++) {
  testStream.write(JSON.stringify({
    method: 'test',
    data: {
      message: 'Hello, " server! Love, Client.',
      index: i
    }
  }));
}