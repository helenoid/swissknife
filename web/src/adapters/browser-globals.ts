/**
 * Browser globals and polyfills for Node.js-specific functionality
 */

// Global process polyfill
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {},
    argv: [],
    cwd: () => '/',
    nextTick: (cb: Function) => setTimeout(cb, 0),
    platform: 'browser',
    version: 'browser',
    exit: () => {},
    stderr: { write: console.error },
    stdout: { write: console.log }
  } as any;
}

// Console polyfills
if (typeof console === 'undefined') {
  (global as any).console = {
    log: () => {},
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {}
  };
}

// Buffer polyfill (if not already available)
if (typeof Buffer === 'undefined') {
  (global as any).Buffer = {
    from: (data: any) => new Uint8Array(data),
    alloc: (size: number) => new Uint8Array(size),
    isBuffer: () => false
  };
}

export {};
