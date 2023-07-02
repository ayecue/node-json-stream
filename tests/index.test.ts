import Chain from 'stream-chain';

import {
  Parser as JsonStreamParser,
  ResultType,
  Tokenizer
} from '../src/index';
import DefaultPayload from './mocks/default-payload.json';

describe('json-stream', function () {
  let testStream: Chain;
  let tokenizer: Tokenizer;
  let parser: JsonStreamParser;

  beforeEach(() => {
    tokenizer = new Tokenizer();
    parser = new JsonStreamParser();
    testStream = Chain.chain([tokenizer, parser]);
  });

  describe('default', () => {
    test('root > object', function (done) {
      testStream.on('data', (data) => {
        expect(data).toEqual(DefaultPayload);
        done();
      });

      testStream.write(JSON.stringify(DefaultPayload));
    });

    test('root > string', function (done) {
      testStream.on('data', (data) => {
        expect(data).toEqual(DefaultPayload.data.message);
        done();
      });

      testStream.write(JSON.stringify(DefaultPayload.data.message));
    });

    test('root > boolean', function (done) {
      testStream.on('data', (data) => {
        expect(data).toEqual(true);
        done();
      });

      testStream.write(JSON.stringify(true));
    });

    test('root > number', function (done) {
      testStream.on('data', (data) => {
        expect(data).toEqual(DefaultPayload.data.floatingNumber);
        done();
      });

      testStream.write(JSON.stringify(DefaultPayload.data.floatingNumber));
    });

    test('root > array', function (done) {
      testStream.on('data', (data) => {
        expect(data).toEqual(DefaultPayload.data.arr);
        done();
      });

      testStream.write(JSON.stringify(DefaultPayload.data.arr));
    });
  });

  describe('scenarios', () => {
    test('invalid payload', function (done) {
      parser.once('invalid-token', (data) => {
        expect(data).toEqual({ type: 'invalid', value: 'Unexpected token.' });
        done();
      });
      testStream.write('{ foo: invalid }');
    });

    test('invalid payload but recover anyway', function (done) {
      testStream.on('data', (data) => {
        expect(data).toEqual(DefaultPayload);
        done();
      });

      testStream.write('{ foo: invalid }');
      testStream.write(JSON.stringify(DefaultPayload));
    });

    test('only allow object root but write string', function (done) {
      parser.allowedRootElements = [ResultType.Object];

      parser.once('invalid-json', (data) => {
        expect(data).toEqual({
          type: ResultType.String,
          value: 'Hello world!'
        });
        done();
      });

      testStream.write(JSON.stringify('Hello world!'));
    });
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
