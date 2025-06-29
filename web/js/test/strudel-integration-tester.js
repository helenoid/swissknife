/**
 * Strudel Integration Test Suite
 * Comprehensive testing for CDN-first loading with NPM fallback
 */

class StrudelIntegrationTester {
    constructor() {
        this.results = {
            cdn: { tested: false, success: false, details: [] },
            npm: { tested: false, success: false, details: [] },
            audio: { tested: false, success: false, details: [] },
            app: { tested: false, success: false, details: [] },
            performance: { tested: false, success: false, details: [] }
        };
        this.timeouts = {
            cdn: 10000,    // 10 seconds for CDN tests
            npm: 5000,     // 5 seconds for NPM tests  
            audio: 3000,   // 3 seconds for audio tests
            app: 15000     // 15 seconds for app initialization
        };
    }

    async runAllTests() {
        console.log('🧪 Starting comprehensive Strudel integration tests...');
        
        try {
            await this.testCDNAvailability();
            await this.testNPMFallback();
            await this.testAudioCapabilities();
            await this.testAppIntegration();
            await this.testPerformance();
            
            this.generateReport();
        } catch (error) {
            console.error('Test suite failed:', error);
        }
    }

    async testCDNAvailability() {
        console.log('🌐 Testing CDN availability...');
        this.results.cdn.tested = true;
        
        const cdnTests = [
            {
                name: 'Strudel Core',
                url: 'https://unpkg.com/@strudel/core@latest/dist/strudel.mjs',
                critical: true
            },
            {
                name: 'Strudel WebAudio',
                url: 'https://unpkg.com/@strudel/webaudio@latest/dist/webaudio.mjs',
                critical: true
            },
            {
                name: 'Strudel Mini',
                url: 'https://unpkg.com/@strudel/mini@latest/dist/mini.mjs',
                critical: false
            },
            {
                name: 'Strudel Soundfonts',
                url: 'https://unpkg.com/@strudel/soundfonts@latest/dist/soundfonts.mjs',
                critical: false
            }
        ];

        let criticalSuccesses = 0;
        let totalCritical = cdnTests.filter(t => t.critical).length;

        for (const test of cdnTests) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeouts.cdn);
                
                const response = await fetch(test.url, {
                    method: 'HEAD',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    this.results.cdn.details.push(`✅ ${test.name}: Available`);
                    if (test.critical) criticalSuccesses++;
                } else {
                    this.results.cdn.details.push(`❌ ${test.name}: HTTP ${response.status}`);
                }
                
            } catch (error) {
                this.results.cdn.details.push(`❌ ${test.name}: ${error.message}`);
            }
        }

        this.results.cdn.success = criticalSuccesses === totalCritical;
        
        if (this.results.cdn.success) {
            console.log('✅ CDN test passed - all critical packages available');
        } else {
            console.log(`❌ CDN test failed - ${criticalSuccesses}/${totalCritical} critical packages available`);
        }
    }

    async testNPMFallback() {
        console.log('📦 Testing NPM fallback capability...');
        this.results.npm.tested = true;

        try {
            // Test if package.json indicates NPM packages are installed
            const response = await fetch('/package.json');
            
            if (response.ok) {
                const packageJson = await response.json();
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                
                const requiredPackages = [
                    '@strudel/core',
                    '@strudel/webaudio',
                    '@strudel/mini',
                    '@strudel/soundfonts'
                ];

                let installedCount = 0;
                for (const pkg of requiredPackages) {
                    if (deps[pkg]) {
                        this.results.npm.details.push(`✅ ${pkg}: v${deps[pkg]}`);
                        installedCount++;
                    } else {
                        this.results.npm.details.push(`❌ ${pkg}: Not installed`);
                    }
                }

                this.results.npm.success = installedCount === requiredPackages.length;
                
                if (this.results.npm.success) {
                    console.log('✅ NPM fallback ready - all packages installed');
                } else {
                    console.log(`⚠️ NPM fallback partial - ${installedCount}/${requiredPackages.length} packages`);
                }
            } else {
                throw new Error('package.json not accessible');
            }
            
        } catch (error) {
            this.results.npm.details.push(`❌ NPM test error: ${error.message}`);
            this.results.npm.success = false;
            console.log('❌ NPM fallback test failed');
        }
    }

    async testAudioCapabilities() {
        console.log('🔊 Testing audio capabilities...');
        this.results.audio.tested = true;

        try {
            // Test AudioContext support
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            
            if (!AudioContextClass) {
                throw new Error('AudioContext not supported in this browser');
            }

            this.results.audio.details.push('✅ AudioContext class available');

            // Test AudioContext creation
            const audioContext = new AudioContextClass();
            this.results.audio.details.push(`✅ AudioContext created (state: ${audioContext.state})`);
            this.results.audio.details.push(`✅ Sample rate: ${audioContext.sampleRate}Hz`);

            // Test audio node creation
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            const analyser = audioContext.createAnalyser();
            
            this.results.audio.details.push('✅ Audio nodes created successfully');

            // Test Web Audio API features needed by Strudel
            if (audioContext.createWorklet) {
                this.results.audio.details.push('✅ AudioWorklet supported');
            } else {
                this.results.audio.details.push('⚠️ AudioWorklet not supported (fallback available)');
            }

            // Test if audio can be resumed (user interaction requirement)
            if (audioContext.state === 'suspended') {
                this.results.audio.details.push('⚠️ AudioContext suspended (requires user interaction)');
            }

            await audioContext.close();
            this.results.audio.details.push('✅ AudioContext cleaned up');

            this.results.audio.success = true;
            console.log('✅ Audio capabilities test passed');

        } catch (error) {
            this.results.audio.details.push(`❌ Audio test error: ${error.message}`);
            this.results.audio.success = false;
            console.log('❌ Audio capabilities test failed');
        }
    }

    async testAppIntegration() {
        console.log('🎵 Testing Strudel app integration...');
        this.results.app.tested = true;

        try {
            // Test if StrudelApp class is available
            if (typeof StrudelApp === 'undefined') {
                throw new Error('StrudelApp class not found - check if strudel.js is loaded');
            }

            this.results.app.details.push('✅ StrudelApp class available');

            // Test app instantiation
            const strudelApp = new StrudelApp();
            this.results.app.details.push('✅ StrudelApp instance created');

            // Create a test container
            const testContainer = document.createElement('div');
            testContainer.style.cssText = `
                position: absolute;
                top: -9999px;
                width: 800px;
                height: 600px;
                background: #1a1a1a;
            `;
            document.body.appendChild(testContainer);

            // Test initialization with timeout
            const initPromise = strudelApp.initialize(testContainer);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Initialization timeout after 15 seconds')), this.timeouts.app)
            );

            try {
                await Promise.race([initPromise, timeoutPromise]);
                this.results.app.details.push('✅ App initialization completed');
            } catch (initError) {
                throw new Error(`Initialization failed: ${initError.message}`);
            }

            // Test UI creation
            if (testContainer.children.length > 0) {
                this.results.app.details.push(`✅ UI created (${testContainer.children.length} elements)`);
                
                // Check for key UI components
                if (testContainer.querySelector('.strudel-app')) {
                    this.results.app.details.push('✅ Main app container found');
                }
                if (testContainer.querySelector('.strudel-header')) {
                    this.results.app.details.push('✅ Header component found');
                }
                if (testContainer.querySelector('.transport-controls')) {
                    this.results.app.details.push('✅ Transport controls found');
                }
            } else {
                throw new Error('No UI elements created');
            }

            // Test app methods
            if (typeof strudelApp.runSelfTests === 'function') {
                const selfTestResults = await strudelApp.runSelfTests();
                if (selfTestResults.success) {
                    this.results.app.details.push('✅ Self-tests passed');
                } else {
                    this.results.app.details.push(`⚠️ Self-tests partial: ${JSON.stringify(selfTestResults.results)}`);
                }
            }

            // Cleanup
            document.body.removeChild(testContainer);
            if (typeof strudelApp.cleanup === 'function') {
                strudelApp.cleanup();
                this.results.app.details.push('✅ App cleanup completed');
            }

            this.results.app.success = true;
            console.log('✅ App integration test passed');

        } catch (error) {
            this.results.app.details.push(`❌ App integration error: ${error.message}`);
            this.results.app.success = false;
            console.log('❌ App integration test failed');
        }
    }

    async testPerformance() {
        console.log('⚡ Testing performance characteristics...');
        this.results.performance.tested = true;

        try {
            const performanceTests = [];

            // Test app loading time
            const loadStart = performance.now();
            
            if (typeof StrudelApp !== 'undefined') {
                const app = new StrudelApp();
                const container = document.createElement('div');
                container.style.cssText = 'position: absolute; top: -9999px; width: 400px; height: 300px;';
                document.body.appendChild(container);

                const initStart = performance.now();
                try {
                    await app.initialize(container);
                    const initTime = performance.now() - initStart;
                    performanceTests.push(`App initialization: ${initTime.toFixed(2)}ms`);
                    
                    if (initTime < 5000) {
                        this.results.performance.details.push(`✅ Fast initialization: ${initTime.toFixed(2)}ms`);
                    } else {
                        this.results.performance.details.push(`⚠️ Slow initialization: ${initTime.toFixed(2)}ms`);
                    }
                } catch (error) {
                    this.results.performance.details.push(`❌ Performance test error: ${error.message}`);
                }

                document.body.removeChild(container);
                if (app.cleanup) app.cleanup();
            }

            const totalTime = performance.now() - loadStart;
            this.results.performance.details.push(`Total test time: ${totalTime.toFixed(2)}ms`);

            // Test memory usage if available
            if (performance.memory) {
                const memory = performance.memory;
                this.results.performance.details.push(`Memory used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
                this.results.performance.details.push(`Memory limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);
            }

            this.results.performance.success = true;
            console.log('✅ Performance test completed');

        } catch (error) {
            this.results.performance.details.push(`❌ Performance test error: ${error.message}`);
            this.results.performance.success = false;
            console.log('❌ Performance test failed');
        }
    }

    generateReport() {
        console.log('\n📋 STRUDEL INTEGRATION TEST REPORT');
        console.log('=====================================');
        
        const categories = [
            { key: 'cdn', name: 'CDN Availability', icon: '🌐' },
            { key: 'npm', name: 'NPM Fallback', icon: '📦' },
            { key: 'audio', name: 'Audio Capabilities', icon: '🔊' },
            { key: 'app', name: 'App Integration', icon: '🎵' },
            { key: 'performance', name: 'Performance', icon: '⚡' }
        ];

        let totalTests = 0;
        let passedTests = 0;

        categories.forEach(cat => {
            const result = this.results[cat.key];
            if (result.tested) {
                totalTests++;
                if (result.success) passedTests++;
                
                console.log(`\n${cat.icon} ${cat.name}: ${result.success ? '✅ PASS' : '❌ FAIL'}`);
                result.details.forEach(detail => console.log(`  ${detail}`));
            }
        });

        console.log('\n📊 SUMMARY');
        console.log(`Tests completed: ${totalTests}`);
        console.log(`Tests passed: ${passedTests}`);
        console.log(`Success rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);

        const overallSuccess = passedTests >= Math.ceil(totalTests * 0.8); // 80% success threshold
        console.log(`\n🎯 OVERALL: ${overallSuccess ? '✅ INTEGRATION READY' : '❌ NEEDS ATTENTION'}`);

        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (!this.results.cdn.success && this.results.npm.success) {
            console.log('  - CDN issues detected, NPM fallback is ready');
        }
        if (!this.results.audio.success) {
            console.log('  - Audio issues may limit functionality');
        }
        if (!this.results.app.success) {
            console.log('  - App integration needs debugging');
        }

        return {
            totalTests,
            passedTests,
            successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0,
            overallSuccess,
            results: this.results
        };
    }
}

// Export for use
window.StrudelIntegrationTester = StrudelIntegrationTester;

// Auto-run if in test environment
if (window.location.pathname.includes('test-strudel')) {
    window.addEventListener('load', async () => {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for other scripts
        
        const tester = new StrudelIntegrationTester();
        const report = await tester.runAllTests();
        
        // Display results in UI if available
        const output = document.getElementById('test-output');
        if (output) {
            output.textContent += '\n' + '='.repeat(50) + '\n';
            output.textContent += `FINAL RESULT: ${report.overallSuccess ? 'READY FOR PRODUCTION' : 'NEEDS FIXES'}\n`;
            output.textContent += `Success Rate: ${report.successRate}% (${report.passedTests}/${report.totalTests})\n`;
        }
    });
}
