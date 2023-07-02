# node-json-stream

Introducing a rapid, lightweight, and self-contained JSON parsing library specifically designed for stream-based processing. This library adheres completely to the JSON specification.

## Usage

```ts
import { Parser, Tokenizer } from 'node-json-stream';
import { PassThrough } from 'stream';
import through from 'through2';

const pass = new PassThrough();
const sink = through.obj(function (item, e, next) {
  console.log('received', item);
  this.push(item);
  next();
});

pass
  .pipe(new Tokenizer())
  .pipe(new Parser())
  .pipe(sink);

pass.write(JSON.stringify({
  method: 'test',
  data: {
    message: 'Hello world!',
  }
}));
```

## Parser options

```ts
new Parser({
  /**
    Define maximum payload size, if exceeded parser will parsing-error event.
    By default uses 4096.
  */
  maxPayloadByteSize: 1000,
  /**
    Define types that are allowed for the root element, if the root element is not in the list it'll emit a parsing-error event.
    By default contains Array, Object, String, Number, Boolean
  */
  allowedRootElements: [ConsumerType.Object],
  /**
    Define if parser should recognize the separator token send by the tokenizer, if
    set to true the parser will always wait for the separator token after parsing
    of an object is done.
    By default set to false.
  */
  usesSeparator: true
})
```

## Tokenizer options

```ts
new Tokenizer({
  /**
    Define maximum number length, if the number length is exceeded the toknizer will push a invalid token type to the parser.
    Uses 20 by default.
  */
  maxNumberLength: 5,
  /**
    Define maximum string length, if the string length is exceeded the toknizer will push a invalid token type to the parser.
    Uses 1000 by default.
  */
  maxStringLength: 10,
  /**
    Define seperator character for tokenizer to forward to parser.
    Uses \n by default.
  */
  seperatorCode: '%'
})
```

## Examples

**One message after another without seperator**

```ts
import { Parser, Tokenizer } from 'node-json-stream';
import { chain } from 'stream-chain';

const myStream = chain([
  new Tokenizer(),
  new Parser()
]);

myStream.on('data', (payload) => {
  /* will print both objects */
  console.log('myData', payload);
});

myStream.write(JSON.stringify({
  method: 'test',
  data: {
    message: 'Hello world!',
  }
}));

myStream.write(JSON.stringify({
  method: 'test',
  data: {
    message: 'Hello world!',
  }
}));
```

**A invalid JSON is sent but recover and progress to parse next item**

```ts
import { Parser, Tokenizer } from 'node-json-stream';
import { chain } from 'stream-chain';

const myStream = chain([
  new Tokenizer(),
  new Parser()
]);

myStream.on('data', (payload) => {
  /* will print last object since it's valid */
  console.log('myData', payload);
});

myStream.write('{ } w }}}');

myStream.write(JSON.stringify({
  method: 'test',
  data: {
    message: 'Hello world!',
  }
}));
```

**Send multiple messages in one**

```ts
import { Parser, Tokenizer } from 'node-json-stream';
import { chain } from 'stream-chain';

const myStream = chain([
  new Tokenizer(),
  new Parser()
]);

myStream.on('data', (payload) => {
  /* will print both objects */
  console.log('myData', payload);
});

myStream.write(JSON.stringify({
  method: 'test',
  data: {
    message: 'Hello world!',
  }
}) + JSON.stringify({
  method: 'test',
  data: {
    message: 'Hello world!',
  }
}));
```

**Send multiple messages in one and use separater**

```ts
import { Parser, Tokenizer } from 'node-json-stream';
import { chain } from 'stream-chain';

const myStream = chain([
  new Tokenizer(),
  new Parser({ usesSeparator: true })
]);

myStream.on('data', (payload) => {
  /**
    only prints the first object and last object due to missing a newline
    after the first object
  */
  console.log('myData', payload);
});

myStream.write(JSON.stringify({
  method: 'test',
  data: {
    message: 'Hello world!',
  }
}) + JSON.stringify({
  method: 'test',
  data: {
    message: 'Hello world!',
  }
}) + '\n' + JSON.stringify({
  method: 'test',
  data: {
    message: 'Hello world!',
  }
}));
```

**Send multiple different JSON but only allow object**

```ts
import { Parser, Tokenizer, ConsumerType } from 'node-json-stream';
import { chain } from 'stream-chain';

const myStream = chain([
  new Tokenizer(),
  new Parser({ allowedRootElements: [ConsumerType.Object] })
]);

myStream.on('data', (payload) => {
  /*
    only prints the objects and ignores the strings and number
  */
  console.log('myData', payload);
});

myStream.write(JSON.stringify({
  method: 'test',
  data: {
    message: 'Hello world!',
  }
}));

myStream.write(JSON.stringify("Hello world!"));
myStream.write(JSON.stringify("Hello world!"));
myStream.write(JSON.stringify("Hello world!"));

myStream.write(JSON.stringify(42));

myStream.write(JSON.stringify({
  method: 'test',
  data: {
    message: 'Hello world!',
  }
}));
```