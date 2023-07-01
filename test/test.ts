import { Duplex, Writable } from 'stream';
import { Parser, Tokenizer } from '../src/index';

class TestStream extends Duplex {
  _read() {}

  _write(chunk, encoding, callback) {
    this.push(chunk);
    callback(null);
  }

  _final() {
    this.push(null);
  }
}

class FinalStream extends Writable {
  _read() {}

  _write(chunk, encoding, callback) {
    console.log('received', chunk.toString());
    callback(null);
  }

  _final() {
  }
}

const testStream = new TestStream();
const final = new FinalStream();
const parser = new Parser();
const tokenizer = new Tokenizer();

testStream.pipe(tokenizer).pipe(parser).pipe(final);

const message = JSON.stringify({
  method: 'test',
  data: {
    message: 'Hello, " server! Love, Client.'
  }
});

const offset = 20;

tokenizer.on('error', (message) => {
  console.log('Error', message);
});

console.log('send');
testStream.write(message.slice(0, offset))

setTimeout(() => {
  console.log('send');
  testStream.write(message.slice(offset));
}, 2000)

setTimeout(() => {
  console.log('send');
  testStream.write(message);
}, 5000)