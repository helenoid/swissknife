// Mock implementation of worker for testing
import { EventEmitter } from 'events';
import * as sinon from 'sinon';

export class MockWorker extends EventEmitter {
  postMessage: sinon.SinonStub;
  terminate: sinon.SinonStub;
  
  constructor() {
    super();
    this.postMessage = sinon.stub();
    this.terminate = sinon.stub().callsFake(() => {
      this.emit('exit', 0);
    });
  }
}

export default MockWorker;
