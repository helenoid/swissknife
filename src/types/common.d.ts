/**
 * Common TypeScript interfaces used throughout SwissKnife
 */

export interface Dictionary<T> {
  [key: string]: T;
}

export interface Disposable {
  dispose(): void | Promise<void>;
}

export interface Serializable {
  serialize(): string | object;
}

export interface Configurable {
  configure(options: Dictionary<any>): void;
}
