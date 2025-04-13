/**
 * Performance benchmarks for the IPFS MCP Client
 * 
 * This file contains benchmarks to measure the performance of key operations
 * in the IPFS MCP Client under various loads.
 */

import { MCPClient } from '../../src/integration';
import { benchmarkFunction, runBenchmarkSuite, randomString, randomObject } from '../utils';
import axios from 'axios';

// Mock axios to avoid actual network calls during benchmarking
jest.mock('axios', () => {
  return {
    create: jest.fn().mockReturnValue({
      get: jest.fn().mockImplementation((url) => {
        if (url === '/status') {
          return Promise.resolve({ status: 200, data: { status: 'ok' } });
        }
        
        if (url.startsWith('/content/')) {
          const cid = url.replace('/content/', '');
          const size = url.includes('large') ? 1000000 : 1000; // Simulate different content sizes
          return Promise.resolve({
            data: {
              cid,
              content: 'a'.repeat(size),
              encoding: 'utf8'
            }
          });
        }
        
        if (url.startsWith('/ipld/node/')) {
          const cid = url.replace('/ipld/node/', '');
          return Promise.resolve({
            data: {
              cid,
              data: { test: 'data' },
              links: [
                { name: 'test-link', cid: 'test-link-cid' }
              ]
            }
          });
        }
        
        return Promise.resolve({ status: 200, data: {} });
      }),
      
      post: jest.fn().mockImplementation((url, data) => {
        if (url === '/content') {
          // Simulate different CID generation times based on content size
          const delay = data.content.length > 10000 ? 50 : 10;
          return new Promise(resolve => setTimeout(() => {
            resolve({
              data: {
                cid: `cid-${Math.random().toString(36).substring(2, 9)}`
              }
            });
          }, delay));
        }
        
        if (url === '/ipld/node') {
          return Promise.resolve({
            data: {
              cid: `cid-${Math.random().toString(36).substring(2, 9)}`
            }
          });
        }
        
        if (url === '/car') {
          // Simulate longer processing time for CAR creation
          return new Promise(resolve => setTimeout(() => {
            resolve({
              data: {
                carCid: `car-cid-${Math.random().toString(36).substring(2, 9)}`
              }
            });
          }, 50));
        }
        
        return Promise.resolve({ data: {} });
      })
    })
  };
});

async function main() {
  // Create client instance
  const client = new MCPClient({
    baseUrl: 'http://benchmark-server',
    token: 'benchmark-token'
  });
  
  // Connect to the MCP server
  await client.connect();
  
  // Benchmark suite
  await runBenchmarkSuite('IPFS MCP Client', [
    {
      name: 'Connect to MCP server',
      fn: async () => {
        const newClient = new MCPClient({
          baseUrl: 'http://benchmark-server',
          token: 'benchmark-token'
        });
        
        return newClient.connect();
      },
      iterations: 50
    },
    
    {
      name: 'Add small content (100 bytes)',
      fn: async () => {
        const content = 'a'.repeat(100);
        return client.addContent(content);
      },
      iterations: 100
    },
    
    {
      name: 'Add medium content (10KB)',
      fn: async () => {
        const content = 'a'.repeat(10 * 1024);
        return client.addContent(content);
      },
      iterations: 50
    },
    
    {
      name: 'Add large content (1MB)',
      fn: async () => {
        const content = 'a'.repeat(1024 * 1024);
        return client.addContent(content);
      },
      iterations: 20
    },
    
    {
      name: 'Add content as Buffer',
      fn: async () => {
        const content = Buffer.from('a'.repeat(10 * 1024));
        return client.addContent(content);
      },
      iterations: 50
    },
    
    {
      name: 'Get small content',
      fn: async () => {
        return client.getContent('small-content-cid');
      },
      iterations: 100
    },
    
    {
      name: 'Get large content',
      fn: async () => {
        return client.getContent('large-content-cid');
      },
      iterations: 50
    },
    
    {
      name: 'Get content as buffer',
      fn: async () => {
        return client.getContent('content-cid', 'buffer');
      },
      iterations: 100
    },
    
    {
      name: 'Add simple IPLD node',
      fn: async () => {
        const data = {
          key1: 'value1',
          key2: 'value2'
        };
        
        return client.addNode(data);
      },
      iterations: 100
    },
    
    {
      name: 'Add complex IPLD node',
      fn: async () => {
        const data = randomObject(4, 10);
        
        return client.addNode(data);
      },
      iterations: 50
    },
    
    {
      name: 'Add IPLD node with links',
      fn: async () => {
        const data = {
          name: 'Node with links',
          timestamp: Date.now()
        };
        
        const links = [];
        for (let i = 0; i < 20; i++) {
          links.push({
            name: `link-${i}`,
            cid: `cid-${i}-${Math.random().toString(36).substring(2, 9)}`
          });
        }
        
        return client.addNode(data, links);
      },
      iterations: 50
    },
    
    {
      name: 'Get IPLD node',
      fn: async () => {
        return client.getNode('test-node-cid');
      },
      iterations: 100
    },
    
    {
      name: 'Create CAR with 10 roots',
      fn: async () => {
        const roots = [];
        for (let i = 0; i < 10; i++) {
          roots.push(`root-${i}-${Math.random().toString(36).substring(2, 9)}`);
        }
        
        return client.createCar(roots);
      },
      iterations: 50
    },
    
    {
      name: 'Create CAR with roots and blocks',
      fn: async () => {
        const roots = [];
        for (let i = 0; i < 5; i++) {
          roots.push(`root-${i}-${Math.random().toString(36).substring(2, 9)}`);
        }
        
        const blocks = {};
        for (let i = 0; i < 20; i++) {
          const cid = `block-${i}-${Math.random().toString(36).substring(2, 9)}`;
          blocks[cid] = Buffer.from(`Block content ${i}`);
        }
        
        return client.createCar(roots, blocks);
      },
      iterations: 20
    },
    
    {
      name: 'Sequential operations (add + get)',
      fn: async () => {
        // Add content
        const { cid } = await client.addContent('Sequential test content');
        
        // Get that content
        return client.getContent(cid);
      },
      iterations: 50
    },
    
    {
      name: 'Parallel operations (10 adds)',
      fn: async () => {
        const promises = [];
        
        for (let i = 0; i < 10; i++) {
          promises.push(client.addContent(`Parallel content ${i}`));
        }
        
        return Promise.all(promises);
      },
      iterations: 20
    }
  ]);
}

// Run the benchmarks
main().catch(console.error);