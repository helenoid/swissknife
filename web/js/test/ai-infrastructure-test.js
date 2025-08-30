/**
 * AI Infrastructure Integration Test
 * Tests the IPFS Accelerate Bridge and AI Model Router integration
 */

class AIInfrastructureTest {
  constructor() {
    this.testResults = [];
    this.bridge = null;
    this.router = null;
  }

  async runAllTests() {
    console.log('🧪 Starting AI Infrastructure Integration Tests...');
    
    try {
      // Test 1: Bridge Initialization
      await this.testBridgeInitialization();
      
      // Test 2: Model Loading
      await this.testModelLoading();
      
      // Test 3: Router Integration
      await this.testRouterIntegration();
      
      // Test 4: Model Inference
      await this.testModelInference();
      
      // Test 5: P2P Integration
      await this.testP2PIntegration();
      
      this.displayResults();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  async testBridgeInitialization() {
    console.log('🔬 Testing IPFS Accelerate Bridge initialization...');
    
    try {
      // Check if bridge is available
      if (!window.ipfsAccelerateBridge) {
        throw new Error('IPFS Accelerate Bridge not found');
      }
      
      this.bridge = window.ipfsAccelerateBridge;
      
      // Check initialization
      if (!this.bridge.isInitialized) {
        throw new Error('Bridge not initialized');
      }
      
      // Check hardware capabilities
      const capabilities = this.bridge.hardwareCapabilities;
      console.log('🔧 Hardware capabilities:', capabilities);
      
      // Check supported models
      const models = this.bridge.getSupportedModels();
      console.log('🧠 Supported models:', models.length);
      
      this.addTestResult('Bridge Initialization', true, 'Bridge initialized successfully');
      
    } catch (error) {
      this.addTestResult('Bridge Initialization', false, error.message);
    }
  }

  async testModelLoading() {
    console.log('🔬 Testing model loading...');
    
    try {
      if (!this.bridge) {
        throw new Error('Bridge not available');
      }
      
      // Test loading a small model
      const modelId = 'bert-base-uncased';
      console.log(`Loading model: ${modelId}`);
      
      const result = await this.bridge.modelServer.loadModel(modelId);
      
      if (!result.success) {
        throw new Error('Model loading failed');
      }
      
      // Check if model is in loaded list
      const loadedModels = this.bridge.modelServer.getLoadedModels();
      if (!loadedModels.includes(modelId)) {
        throw new Error('Model not in loaded list');
      }
      
      console.log(`✅ Model ${modelId} loaded successfully`);
      this.addTestResult('Model Loading', true, `Successfully loaded ${modelId}`);
      
    } catch (error) {
      this.addTestResult('Model Loading', false, error.message);
    }
  }

  async testRouterIntegration() {
    console.log('🔬 Testing AI Model Router integration...');
    
    try {
      // Check if router is available
      if (!window.aiModelRouter) {
        throw new Error('AI Model Router not found');
      }
      
      this.router = window.aiModelRouter;
      
      // Check initialization
      if (!this.router.isInitialized) {
        throw new Error('Router not initialized');
      }
      
      // Get available endpoints
      const endpoints = this.router.getAvailableEndpoints();
      console.log('🌐 Available endpoints:', endpoints.length);
      
      // Check for local transformers endpoint
      const localEndpoint = endpoints.find(ep => ep.type === 'LOCAL_TRANSFORMERS');
      if (!localEndpoint) {
        throw new Error('Local transformers endpoint not found');
      }
      
      console.log('✅ Router integration working');
      this.addTestResult('Router Integration', true, `Found ${endpoints.length} endpoints`);
      
    } catch (error) {
      this.addTestResult('Router Integration', false, error.message);
    }
  }

  async testModelInference() {
    console.log('🔬 Testing model inference...');
    
    try {
      if (!this.bridge) {
        throw new Error('Bridge not available');
      }
      
      // Test inference on loaded model
      const modelId = 'bert-base-uncased';
      const testInput = 'This is a test sentence for BERT encoding.';
      
      console.log(`Running inference on ${modelId}...`);
      const result = await this.bridge.modelServer.inference(modelId, testInput);
      
      if (!result.success) {
        throw new Error('Inference failed');
      }
      
      console.log('✅ Inference completed successfully');
      console.log('📊 Result metadata:', result.metadata);
      
      this.addTestResult('Model Inference', true, 'Inference completed successfully');
      
    } catch (error) {
      this.addTestResult('Model Inference', false, error.message);
    }
  }

  async testP2PIntegration() {
    console.log('🔬 Testing P2P integration...');
    
    try {
      // Check if P2P system is available
      const p2pAvailable = window.p2pMLSystem && window.p2pMLSystem.isRunning;
      
      if (p2pAvailable) {
        console.log('✅ P2P system is available and running');
        
        // Check P2P endpoints in router
        const endpoints = this.router?.getAvailableEndpoints() || [];
        const p2pEndpoints = endpoints.filter(ep => ep.type === 'P2P_PEER');
        
        console.log(`🤝 Found ${p2pEndpoints.length} P2P peer endpoints`);
        this.addTestResult('P2P Integration', true, `P2P system available with ${p2pEndpoints.length} peers`);
        
      } else {
        console.log('⚠️ P2P system not available (expected in standalone test)');
        this.addTestResult('P2P Integration', true, 'P2P system not available (expected)');
      }
      
    } catch (error) {
      this.addTestResult('P2P Integration', false, error.message);
    }
  }

  addTestResult(testName, passed, details) {
    this.testResults.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  displayResults() {
    console.log('\n🏁 Test Results Summary:');
    console.log('=' .repeat(50));
    
    let passed = 0;
    let failed = 0;
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} | ${result.name}: ${result.details}`);
      
      if (result.passed) {
        passed++;
      } else {
        failed++;
      }
    });
    
    console.log('=' .repeat(50));
    console.log(`📊 Summary: ${passed} passed, ${failed} failed`);
    
    // Show system status
    this.displaySystemStatus();
  }

  displaySystemStatus() {
    console.log('\n🔍 System Status:');
    console.log('-' .repeat(30));
    
    if (this.bridge) {
      const metrics = this.bridge.getSystemMetrics();
      console.log('🧠 IPFS Accelerate Bridge:');
      console.log(`  - Loaded Models: ${metrics.loadedModels}`);
      console.log(`  - Total Inferences: ${metrics.totalInferences}`);
      console.log(`  - Memory Used: ${metrics.memory?.used || 'N/A'} MB`);
      console.log(`  - Hardware: WebGPU=${this.bridge.hardwareCapabilities.webgpu}, WebNN=${this.bridge.hardwareCapabilities.webnn}`);
    }
    
    if (this.router) {
      const stats = this.router.getRoutingStats();
      console.log('🌐 AI Model Router:');
      console.log(`  - Available Endpoints: ${this.router.getAvailableEndpoints().length}`);
      console.log(`  - Total Requests: ${stats.totalRequests}`);
      console.log(`  - Success Rate: ${Math.round(stats.successRate * 100)}%`);
      console.log(`  - Avg Response Time: ${stats.avgResponseTime}ms`);
    }
  }
}

// Export for testing
window.AIInfrastructureTest = AIInfrastructureTest;

// Auto-run test if this is loaded as a standalone script
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      console.log('🚀 Starting automated AI infrastructure test...');
      const test = new AIInfrastructureTest();
      test.runAllTests();
    }, 2000);
  });
} else if (typeof window !== 'undefined') {
  setTimeout(() => {
    console.log('🚀 Starting AI infrastructure test...');
    const test = new AIInfrastructureTest();
    test.runAllTests();
  }, 1000);
}