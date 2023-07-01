import { Transform, TransformCallback, TransformOptions } from "stream";
import { TokenResult } from "./tokenizer/tokenizer-base";
import { RootConsumer } from "./parser/root-consumer";

export class Parser extends Transform {
  private _buffer: string = '';
  private _root: RootConsumer | null = null;

  constructor(options: TransformOptions = {}) {
    super({
      ...options,
      objectMode: true,
      encoding: 'utf-8'
    });
  }

  _transform(chunk: Buffer, encoding: string, callback: TransformCallback) {
    this._buffer += chunk.toString(encoding);
    const item = TokenResult.parse(this._buffer);

    if (!this._root) {
      this._root = new RootConsumer();
    }

    if (this._root.consume(item)) {
      this.push(JSON.stringify(this._root.data));
      this._root = null;
    }

    this._buffer = '';
    callback(null);
  }
}