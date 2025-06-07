/**
 * Global type declarations for SwissKnife tests
 */

// Extend global for Jest and Sinon
interface Global {
  sinon: typeof import('sinon');
  waitFor: (ms: number) => Promise<void>;
  waitUntil: (condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number) => Promise<boolean>;
  mockImport: (modulePath: string, mockImplementation: any) => void;
  diagnostics: {
    logObject: (obj: any, label?: string) => void;
  };
}

// Declare Jest & related modules
declare namespace jest {
  function spyOn(object: any, method: string): jest.Mock;
  function fn<T = any>(implementation?: (...args: any[]) => T): jest.Mock<T>;
  function mock(modulePath: string, factory?: () => any, options?: object): void;
  function clearAllMocks(): void;
  let config: {
    moduleNameMapper: Record<string, string>;
    [key: string]: any;
  };
}

// Add common types for expect assertions
interface ExpectStatic {
  arrayContaining<T = any>(array: Array<T>): any;
  objectContaining<T = any>(object: Partial<T>): any;
  stringMatching(pattern: RegExp | string): any;
  any(constructor: any): any;
  extend(matchers: Record<string, any>): void;
  toHaveProperties(properties: string[]): void;
  toBeWithinRange(floor: number, ceiling: number): void;
  toHaveBeenCalledBefore(other: any): void;
  toBeBuffer(): void;
  toRejectWithError(expected: RegExp | string): Promise<void>;
}

declare global {
  const sinon: typeof import('sinon');
  const waitFor: (ms: number) => Promise<void>;
  const waitUntil: (condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number) => Promise<boolean>;
  const mockImport: (modulePath: string, mockImplementation: any) => void;
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveBeenCalledBefore(other: any): R;
      toBeBuffer(): R;
      toHaveProperties(properties: string[]): R;
      toRejectWithError(expected: RegExp | string): Promise<R>;
    }
  }
  
  // Extend NodeJS namespace
  namespace NodeJS {
    interface Global {
      sinon: typeof import('sinon');
      waitFor: (ms: number) => Promise<void>;
      waitUntil: (condition: () => boolean | Promise<boolean>, timeout?: number, interval?: number) => Promise<boolean>;
      mockImport: (modulePath: string, mockImplementation: any) => void;
    }
  }
}
