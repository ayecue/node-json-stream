const Benchmarkify = require("benchmarkify");
import { Parser as JsonStreamParser, Tokenizer } from '../src/index';
import { chain } from 'stream-chain';
import Parser from 'stream-json/Parser';
import StreamValues from 'stream-json/streamers/StreamValues';

const myJsonStreamPerf = (count: number = 1) => {
  const testStream = chain([
    new Tokenizer(),
    new JsonStreamParser()
  ]);

  testStream.on('data', (data) => {
    const payload = JSON.parse(data);

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

const benchmark = new Benchmarkify("Json Perf").printHeader();

// Create a test suite
const bench1 = benchmark.createSuite("Increment integer");

// Add first func
bench1.add("MyJsonStream", () => myJsonStreamPerf());

// Add second func. This result will be the reference
bench1.ref("JsonStream", () => jsonStreamPerf());

bench1.run();