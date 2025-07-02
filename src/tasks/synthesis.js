/**
 * Mock implementation of tasks/synthesis.js
 */

export class TaskSynthesizer {
  constructor() {}
  
  async synthesizeResults(results) {
    return {
      id: 'synthesis-result',
      content: `Synthesized: ${results.map(r => r.result || r.content || '').join(', ')}`
    };
  }
}

export default TaskSynthesizer;
