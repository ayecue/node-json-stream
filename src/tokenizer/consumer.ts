export abstract class Consumer {
  abstract consume(): boolean;
  abstract get index(): number;
}
