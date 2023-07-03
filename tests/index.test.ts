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
        expect(data).toEqual(DefaultPayload.data.aioNumber);
        done();
      });

      testStream.write(JSON.stringify(DefaultPayload.data.aioNumber) + '\n');
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
    describe('invalid payload with object', () => {
      test('default', function (done) {
        parser.once('parsing-error', (err) => {
          expect(err).toBeInstanceOf(Error);
          done();
        });
        testStream.write('{ 1234: "invalid" }');
      });

      test('recover', function (done) {
        testStream.on('data', (data) => {
          expect(data).toEqual(DefaultPayload);
          done();
        });

        testStream.write('{ foo: invalid }');
        testStream.write(JSON.stringify(DefaultPayload));
      });

      test('nested', function (done) {
        parser.once('parsing-error', (err) => {
          expect(err).toBeInstanceOf(Error);
          done();
        });
        testStream.write('{ "foo": { 1234: "bar" } }');
      });

      test('delimiter', function (done) {
        parser.once('parsing-error', (err) => {
          expect(err).toBeInstanceOf(Error);
          done();
        });
        testStream.write('{ "foo" }');
      });

      test('comma', function (done) {
        parser.once('parsing-error', (err) => {
          expect(err).toBeInstanceOf(Error);
          done();
        });
        testStream.write('{ "foo":1234: }');
      });
    });

    describe('invalid payload with array', () => {
      test('default', function (done) {
        parser.once('parsing-error', (err) => {
          expect(err).toBeInstanceOf(Error);
          done();
        });
        testStream.write('[ 1234: ]');
      });

      test('nested', function (done) {
        parser.once('parsing-error', (err) => {
          expect(err).toBeInstanceOf(Error);
          done();
        });
        testStream.write('[ { 1234: "test" } ]');
      });

      test('value', function (done) {
        parser.once('parsing-error', (err) => {
          expect(err).toBeInstanceOf(Error);
          done();
        });
        testStream.write('[ 1234, ]');
      });


      test('comma', function (done) {
        parser.once('parsing-error', (err) => {
          expect(err).toBeInstanceOf(Error);
          done();
        });
        testStream.write('[ 1234: ]');
      });
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

    test('use seperator and skip object', function (done) {
      parser.usesSeparator = true;

      let counter = 0;

      parser.on('data', () => {
        if (++counter === 2) done();
      });

      testStream.write(JSON.stringify({ name: "foo" }));
      testStream.write(JSON.stringify({ name: "test" }));
      testStream.write('\n' + JSON.stringify({ name: "bar" }));
    });

    test('use seperator too early and skip object', function (done) {
      parser.usesSeparator = true;

      testStream.on('data', (data) => {
        expect(data).toEqual({ name: "bar" });
        done();
      });

      testStream.write('{ "myKey":\n');
      testStream.write(JSON.stringify({ name: "bar" }));
    });

    test('use resolve path option to only get number', function (done) {
      parser.resolvePath = ['myNumber'];

      parser.on('data', (data) => {
        expect(data).toEqual(123);
        done();
      });

      testStream.write(JSON.stringify({ name: "foo", myNumber: 123 }));
    });

    test('use resolve path option to get items in array', function (done) {
      parser.resolvePath = ['myArray', '*'];

      parser.on('data', (data) => {
        expect(data).toBeLessThanOrEqual(5);
        if (data === 5) done();
      });

      testStream.write(JSON.stringify({ name: "foo", myArray: [1,2,3,4,5] }));
    });

    test('split string in two different writes', function (done) {
      parser.on('data', (data) => {
        expect(data).toEqual('    firstString"    endString');
        done();
      });

      tokenizer.write('"    firstString\\"');
      tokenizer.write('    endString"');
    });

    test('split number in two different writes', function (done) {
      parser.on('data', (data) => {
        expect(data).toEqual({ "test": 12345678 });
        done();
      });

      tokenizer.write('{ "test":1234');
      tokenizer.write('5678 }');
    });
  });
});
