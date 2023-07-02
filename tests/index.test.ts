import Chain from 'stream-chain';

import {
  Parser as JsonStreamParser,
  ConsumerType,
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
      parser.once('parsing-error', (err) => {
        expect(err).toBeInstanceOf(Error);
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
      parser.allowedRootElements = [ConsumerType.Object];

      parser.once('parsing-error', (err) => {
        expect(err).toBeInstanceOf(Error);
        done();
      });

      testStream.write(JSON.stringify('Hello world!'));
    });

    test('exceed string max length', function (done) {
      tokenizer.maxStringLength = 5;

      parser.once('parsing-error', (err) => {
        expect(err).toBeInstanceOf(Error);
        done();
      });

      testStream.write(JSON.stringify('Hello world!'));
    });

    test('exceed number max length', function (done) {
      tokenizer.maxNumberLength = 2;

      parser.once('parsing-error', (err) => {
        expect(err).toBeInstanceOf(Error);
        done();
      });

      testStream.write(JSON.stringify(123));
    });

    test('exceed max payload size', function (done) {
      parser.maxPayloadByteSize = 50;

      parser.once('parsing-error', (err) => {
        expect(err).toBeInstanceOf(Error);
        done();
      });

      testStream.write(JSON.stringify(DefaultPayload));
    });
  });
});
