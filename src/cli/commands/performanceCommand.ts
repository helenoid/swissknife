import { Command } from 'commander.js';
import { PerformanceOptimizer } from '../../performance/optimizer.js';
import { TaskManager } from '../../tasks/manager.js';
import { IPFSKitClient } from '../../ipfs/client.js';
import { Agent } from '../../ai/agent/agent.js';
import { Model } from '../../ai/models/model.js';
import { StorageProvider } from '../../types/storage.js';
import { ModelOptions } from '../../types/ai.js';

const performanceCommand = new Command('performance')
  .description('Run performance optimization tasks')
  .action(async () => {
    const modelOptions: ModelOptions = {
      id: 'default-model',
      name: 'Default Model',
      provider: 'local',
      parameters: {},
      metadata: {},
    };
    const model = new Model(modelOptions);

    const agentOptions = { model };
    const agent = new Agent(agentOptions);

    const taskManager = new TaskManager(model);
    const ipfsClient = new IPFSKitClient();

    const optimizer = new PerformanceOptimizer(taskManager, ipfsClient, agent);
    await optimizer.optimize();
  });

export default performanceCommand;
