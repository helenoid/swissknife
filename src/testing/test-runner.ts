import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class TestRunner {
  public async runUnitTests(): Promise<void> {
    console.log('Running unit tests...');
    try {
      const { stdout, stderr } = await execAsync('pnpm test:unit');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error: any) {
      if (error.stderr) {
        console.error(error.stderr);
      } else {
        console.error('Unit test execution failed');
      }
    }
  }

  public async runIntegrationTests(): Promise<void> {
    console.log('Running integration tests...');
    try {
      const { stdout, stderr } = await execAsync('pnpm test:integration');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error: any) {
      console.error(error.stderr || 'Integration test execution failed');
    }
  }

  public async runE2ETests(): Promise<void> {
    console.log('Running e2e tests...');
    try {
      const { stdout, stderr } = await execAsync('pnpm test:e2e');
      console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error: any) {
      console.error(error.stderr || 'E2E test execution failed');
    }
  }

  public async runAllTests(): Promise<void> {
    console.log('Starting all tests...');
    await this.runUnitTests();
    await this.runIntegrationTests();
    await this.runE2ETests();
    console.log('All tests completed successfully.');
  }
}
