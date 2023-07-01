const Benchmarkify = require("benchmarkify");
import { chain } from 'stream-chain';
import Parser from 'stream-json/Parser';
import StreamValues from 'stream-json/streamers/StreamValues';

const testStream = chain([
  new Parser({
    jsonStreaming: true
  }),
  new StreamValues()
]);

testStream.on('data', (data) => {
  console.log(data);
});

for (let i = 0; i <= 10; i++) {
  testStream.write(JSON.stringify({
    method: 'test',
    data: {
      message: 'Hello, " server! Love, Client.',
      index: i
    }
  }));
}