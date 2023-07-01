const Benchmarkify = require("benchmarkify");
import { Parser as JsonStreamParser, Tokenizer } from '../src/index';
import { chain } from 'stream-chain';
import Parser from 'stream-json/Parser';
import StreamValues from 'stream-json/streamers/StreamValues';
import JSONStream from 'JSONStream';

const myJsonStreamPerf = (count: number = 1) => {
  const testStream = chain([
    new Tokenizer(),
    new JsonStreamParser()
  ]);

  testStream.on('data', (payload) => {
    if (payload.data.index === count) {

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

const jsonStreamPerf = (count: number = 1) => {
  const testStream = chain([
    new Parser({
      jsonStreaming: true
    }),
    new StreamValues()
  ]);
  
  testStream.on('data', (data) => {
    if (data.value.data.index === count) {
      
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

const jsonStream2Perf = (count: number = 1) => {
  const testStream = chain([
    JSONStream.parse()
  ]);
  
  testStream.on('data', (payload) => {
    if (payload.data.index === count) {
      
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

// Create a test suite
const bench1 = benchmark.createSuite("Increment integer");

bench1.add("my-json-stream", () => myJsonStreamPerf());
bench1.ref("json-stream", () => jsonStreamPerf());
bench1.ref("JSONStream", () => jsonStream2Perf());

bench1.run();