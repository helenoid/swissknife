/**
 * Benchmark script for AIService performance
 * 
 * This script measures the performance of the AIService and chat functionality
 * focusing on response time, caching efficiency, and memory usage.
 */
import { AIService } from '../src/ai/service.js';
import { logger } from '../src/utils/logger.js';
import chalk from 'chalk';

// Set to silent mode for benchmarks
logger.level = 'silent';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  cachedResponses: number;
  totalTokens: number;
  rss: number;
  heapTotal: number;
  heapUsed: number;
}

/**
 * Run a simple benchmark on the AIService
 */
async function runBenchmark(
  name: string,
  prompt: string,
  iterations: number = 5,
  options: { model?: string; systemPrompt?: string; temperature?: number } = {}
): Promise<BenchmarkResult> {
  console.log(chalk.cyan(`\nRunning benchmark: ${name}`));
  console.log(chalk.gray(`Iterations: ${iterations}`));
  console.log(chalk.gray(`Prompt: "${prompt}"\n`));

  // Initialize services
  const aiService = AIService.getInstance();
  await aiService.initialize();
  
  // Initialize chat session
  aiService.initSession(
    options.model || 'default',
    options.systemPrompt || 'You are a helpful AI assistant',
    options.temperature || 0.7
  );
  
  // Track metrics
  const responseTimes: number[] = [];
  let totalTokens = 0;
  let cachedResponses = 0;
  
  // Run benchmark
  const benchStart = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    console.log(chalk.gray(`Iteration ${i+1}/${iterations}...`));
    
    const startTime = Date.now();
    try {
      const response = await aiService.processMessage(prompt);
      const responseTime = Date.now() - startTime;
      
      responseTimes.push(responseTime);
      if (response.cached) cachedResponses++;
      if (response.usage) {
        totalTokens += response.usage.totalTokens || 0;
      }
      
      console.log(chalk.gray(`Response time: ${responseTime}ms${response.cached ? ' (cached)' : ''}`));
    } catch (error) {
      console.log(chalk.red(`Error in iteration ${i+1}: ${error}`));
    }
  }
  
  // Calculate results
  const totalTime = Date.now() - benchStart;
  const avgTime = responseTimes.length > 0 
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) 
    : 0;
  const minTime = responseTimes.length > 0 ? Math.min(...responseTimes) : 0;
  const maxTime = responseTimes.length > 0 ? Math.max(...responseTimes) : 0;
  
  // Get memory usage
  const memoryUsage = process.memoryUsage();
  
  // Return results
  return {
    name,
    iterations,
    totalTime,
    avgTime,
    minTime,
    maxTime,
    cachedResponses,
    totalTokens,
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024)
  };
}

/**
 * Display benchmark results
 */
function displayResults(results: BenchmarkResult[]): void {
  console.log(chalk.cyan('\n========== Benchmark Results =========='));
  
  for (const result of results) {
    console.log(chalk.bold(`\n${result.name}`));
    console.log(chalk.cyan('  Execution:'));
    console.log(chalk.cyan('    Total time:') + ` ${result.totalTime}ms`);
    console.log(chalk.cyan('    Average response time:') + ` ${result.avgTime}ms`);
    console.log(chalk.cyan('    Fastest response:') + ` ${result.minTime}ms`);
    console.log(chalk.cyan('    Slowest response:') + ` ${result.maxTime}ms`);
    console.log(chalk.cyan('    Cached responses:') + ` ${result.cachedResponses}/${result.iterations}`);
    
    if (result.totalTokens > 0) {
      console.log(chalk.cyan('  Tokens:'));
      console.log(chalk.cyan('    Total tokens used:') + ` ${result.totalTokens}`);
      console.log(chalk.cyan('    Avg. tokens per request:') + 
        ` ${Math.round(result.totalTokens / (result.iterations - result.cachedResponses) || 1)}`);
    }
    
    console.log(chalk.cyan('  Memory (End of Test):'));
    console.log(chalk.cyan('    RSS:') + ` ${result.rss}MB`);
    console.log(chalk.cyan('    Heap Total:') + ` ${result.heapTotal}MB`);
    console.log(chalk.cyan('    Heap Used:') + ` ${result.heapUsed}MB`);
  }
}

/**
 * Run the benchmarks
 */
async function main() {
  console.log(chalk.bold('Starting AIService Benchmarks'));
  
  try {
    const results: BenchmarkResult[] = [];
    
    // Simple response test
    results.push(await runBenchmark(
      'Simple Response',
      'What is the capital of France?',
      5
    ));
    
    // Caching efficiency test (repeat the same prompt)
    results.push(await runBenchmark(
      'Cache Efficiency',
      'What is the capital of Japan?',
      10
    ));
    
    // Longer content test
    results.push(await runBenchmark(
      'Longer Content',
      'Write a paragraph explaining quantum computing in simple terms.',
      3
    ));
    
    // Display all results
    displayResults(results);
    
  } catch (error) {
    console.error('Benchmark failed:', error);
  }
}

// Run the main function
main().catch(console.error);
