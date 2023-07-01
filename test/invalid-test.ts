import { Parser as JsonStreamParser, Tokenizer } from '../src/index';
import { chain } from 'stream-chain';

const testStream = chain([
  new Tokenizer(),
  new JsonStreamParser()
]);

testStream.on('data', (data) => {
  const payload = JSON.parse(data);

  console.log(payload);
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