import { Parser as JsonStreamParser, Tokenizer } from '../src/index';
import Chain from 'stream-chain';
import DefaultPayload from './mocks/default-payload.json';

describe('json-stream', function () {
  let testStream: Chain;
  let tokenizer: Tokenizer;
  let parser: JsonStreamParser;

  beforeEach(() => {
    tokenizer = new Tokenizer();
    parser = new JsonStreamParser();
    testStream = Chain.chain([
      tokenizer,
      parser
    ]);
  });

  test('default json', function (done) {
    testStream.on('data', (data) => {
      expect(data).toEqual(DefaultPayload);
      done();
    });

    testStream.write(JSON.stringify(DefaultPayload));
  });

  test('default string', function (done) {
    testStream.on('data', (data) => {
      expect(data).toEqual(DefaultPayload.data.message);
      done();
    });

    testStream.write(JSON.stringify(DefaultPayload.data.message));
  });

  test('default boolean', function (done) {
    testStream.on('data', (data) => {
      expect(data).toEqual(DefaultPayload.data.message);
      done();
    });

    testStream.write(JSON.stringify(DefaultPayload.data.message));
  });
});

/**
 * 
 * 
    parser.on('invalid-json', (err) => {
      console.log('InvalidJSON', err);
    });
    
    parser.on('invalid-token', (err) => {
      console.log('InvalidToken', err);
    });
 */