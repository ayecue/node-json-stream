const Benchmarkify = require("benchmarkify");
import { Parser as JsonStreamParser, Tokenizer } from '../src/index';
import { chain } from 'stream-chain';
import Parser from 'stream-json/Parser';
import StreamValues from 'stream-json/streamers/StreamValues';

const myJsonStreamPerf = (done: () => void, count: number = 20) => {
  const testStream = chain([
    new Tokenizer(),
    new JsonStreamParser()
  ]);

  testStream.on('data', (payload) => {
    if (payload.data.index === count) {
      done();
    }
  });

  for (let i = 0; i <= count; i++) {
    testStream.write(JSON.stringify({
      method: 'test',
      data: {
        message: 'Hello, " server! Love, Client.',
        index: i
      }
    }));
  }
};

const jsonStreamPerf = (done: () => void, count: number = 20) => {
  const testStream = chain([
    new Parser({
      jsonStreaming: true
    }),
    new StreamValues()
  ]);
  
  testStream.on('data', (data) => {
    if (data.value.data.index === count) {
      done();
    }
  });
  
  for (let i = 0; i <= count; i++) {
    testStream.write(JSON.stringify({
      method: 'test',
      data: {
        message: 'Hello, " server! Love, Client.',
        index: i
      }
    }));
  }
};


const benchmark = new Benchmarkify("Json Perf").printHeader();
const bench1 = benchmark.createSuite("Increment integer");

bench1.add("my-json-stream", (done) => myJsonStreamPerf(done));
bench1.ref("json-stream", (done) => jsonStreamPerf(done));

bench1.run();