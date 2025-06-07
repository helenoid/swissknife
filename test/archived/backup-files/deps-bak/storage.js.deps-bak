// Mock storage module
class MockStorage {
  constructor() {
    this.data = new Map();
  }

  get(key) {
    return Promise.resolve(this.data.get(key));
  }

  set(key, value) {
    this.data.set(key, value);
    return Promise.resolve();
  }

  has(key) {
    return Promise.resolve(this.data.has(key));
  }

  delete(key) {
    const existed = this.data.has(key);
    this.data.delete(key);
    return Promise.resolve(existed);
  }

  clear() {
    this.data.clear();
    return Promise.resolve();
  }

  keys() {
    return Promise.resolve(Array.from(this.data.keys()));
  }

  values() {
    return Promise.resolve(Array.from(this.data.values()));
  }

  entries() {
    return Promise.resolve(Array.from(this.data.entries()));
  }

  size() {
    return Promise.resolve(this.data.size);
  }
}

module.exports = { Storage: MockStorage };
