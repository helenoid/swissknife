/**
 * CDN Configuration for Strudel Libraries
 * Defines CDN URLs and NPM fallback strategy for production builds
 */

const STRUDEL_CDN_CONFIG = {
    // CDN URLs for Strudel libraries (production)
    cdn: {
        core: 'https://unpkg.com/@strudel/core@latest/dist/strudel.mjs',
        webaudio: 'https://unpkg.com/@strudel/webaudio@latest/dist/webaudio.mjs',
        mini: 'https://unpkg.com/@strudel/mini@latest/dist/mini.mjs',
        soundfonts: 'https://unpkg.com/@strudel/soundfonts@latest/dist/soundfonts.mjs'
    },
    
    // Alternative CDN sources
    cdnAlternatives: {
        core: [
            'https://cdn.jsdelivr.net/npm/@strudel/core@latest/dist/strudel.mjs',
            'https://cdn.skypack.dev/@strudel/core'
        ],
        webaudio: [
            'https://cdn.jsdelivr.net/npm/@strudel/webaudio@latest/dist/webaudio.mjs',
            'https://cdn.skypack.dev/@strudel/webaudio'
        ]
    },
    
    // NPM fallback (bundled with application)
    npm: {
        core: './node_modules/@strudel/core/dist/strudel.mjs',
        webaudio: './node_modules/@strudel/webaudio/dist/webaudio.mjs',
        mini: './node_modules/@strudel/mini/dist/mini.mjs',
        soundfonts: './node_modules/@strudel/soundfonts/dist/soundfonts.mjs'
    },
    
    // Loading strategy configuration
    strategy: {
        timeout: 10000,          // 10 seconds timeout for CDN
        retries: 2,              // Retry CDN 2 times before fallback
        fallbackDelay: 500,      // Wait 500ms between fallback attempts
        cacheTimeouts: {
            success: 3600000,    // Cache successful loads for 1 hour
            failure: 300000      // Cache failures for 5 minutes
        }
    },
    
    // Feature detection and compatibility
    features: {
        webAudio: () => !!(window.AudioContext || window.webkitAudioContext),
        webWorkers: () => !!window.Worker,
        audioWorklet: () => {
            const ctx = window.AudioContext || window.webkitAudioContext;
            return ctx && 'audioWorklet' in new ctx();
        },
        modules: () => 'noModule' in document.createElement('script')
    }
};

/**
 * Advanced CDN loader with robust fallback handling
 */
class StrudelCDNLoader {
    constructor(config = STRUDEL_CDN_CONFIG) {
        this.config = config;
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.failureCount = new Map();
        
        // Bind methods
        this.loadLibrary = this.loadLibrary.bind(this);
        this.loadFromCDN = this.loadFromCDN.bind(this);
        this.loadFromNPM = this.loadFromNPM.bind(this);
    }
    
    /**
     * Load a Strudel library with CDN-first strategy
     */
    async loadLibrary(libraryName) {
        // Check cache first
        const cacheKey = `strudel-${libraryName}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && this.isCacheValid(cached)) {
            console.log(`📦 Using cached ${libraryName}:`, cached.success ? 'success' : 'failed');
            if (cached.success) {
                return cached.module;
            } else {
                throw new Error(`Cached failure for ${libraryName}: ${cached.error}`);
            }
        }
        
        // Check if already loading
        if (this.loadingPromises.has(libraryName)) {
            return this.loadingPromises.get(libraryName);
        }
        
        // Start loading
        const loadingPromise = this.performLoad(libraryName);
        this.loadingPromises.set(libraryName, loadingPromise);
        
        try {
            const result = await loadingPromise;
            this.cacheResult(cacheKey, { success: true, module: result, timestamp: Date.now() });
            return result;
        } catch (error) {
            this.cacheResult(cacheKey, { success: false, error: error.message, timestamp: Date.now() });
            throw error;
        } finally {
            this.loadingPromises.delete(libraryName);
        }
    }
    
    async performLoad(libraryName) {
        console.log(`🌐 Loading ${libraryName} with CDN-first strategy...`);
        
        // Try CDN first
        try {
            const module = await this.loadFromCDN(libraryName);
            console.log(`✅ ${libraryName} loaded from CDN`);
            return module;
        } catch (cdnError) {
            console.warn(`⚠️ CDN failed for ${libraryName}:`, cdnError.message);
            
            // Try alternative CDNs
            const alternatives = this.config.cdnAlternatives[libraryName] || [];
            for (const altUrl of alternatives) {
                try {
                    const module = await this.loadFromURL(altUrl);
                    console.log(`✅ ${libraryName} loaded from alternative CDN`);
                    return module;
                } catch (altError) {
                    console.warn(`⚠️ Alternative CDN failed for ${libraryName}:`, altError.message);
                }
            }
            
            // Fallback to NPM
            try {
                const module = await this.loadFromNPM(libraryName);
                console.log(`✅ ${libraryName} loaded from NPM fallback`);
                return module;
            } catch (npmError) {
                console.error(`❌ All loading strategies failed for ${libraryName}`);
                throw new Error(`Failed to load ${libraryName}: CDN error: ${cdnError.message}, NPM error: ${npmError.message}`);
            }
        }
    }
    
    async loadFromCDN(libraryName) {
        const url = this.config.cdn[libraryName];
        if (!url) {
            throw new Error(`No CDN URL configured for ${libraryName}`);
        }
        
        return this.loadFromURL(url);
    }
    
    async loadFromURL(url) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'module';
            script.crossOrigin = 'anonymous';
            
            const timeout = setTimeout(() => {
                script.remove();
                reject(new Error(`Timeout loading from ${url}`));
            }, this.config.strategy.timeout);
            
            script.onload = () => {
                clearTimeout(timeout);
                // For ES modules, we need to import them
                import(url).then(resolve).catch(reject);
            };
            
            script.onerror = () => {
                clearTimeout(timeout);
                script.remove();
                reject(new Error(`Failed to load script from ${url}`));
            };
            
            script.src = url;
            document.head.appendChild(script);
        });
    }
    
    async loadFromNPM(libraryName) {
        const npmPath = this.config.npm[libraryName];
        if (!npmPath) {
            throw new Error(`No NPM path configured for ${libraryName}`);
        }
        
        try {
            // Try dynamic import for bundled modules
            return await import(npmPath);
        } catch (importError) {
            // Fallback to script tag loading for bundled files
            const scriptPath = npmPath.replace('./node_modules/', './');
            return this.loadFromURL(scriptPath);
        }
    }
    
    isCacheValid(cached) {
        const age = Date.now() - cached.timestamp;
        const maxAge = cached.success ? 
            this.config.strategy.cacheTimeouts.success : 
            this.config.strategy.cacheTimeouts.failure;
        return age < maxAge;
    }
    
    cacheResult(key, result) {
        this.cache.set(key, result);
        
        // Cleanup old cache entries
        if (this.cache.size > 50) {
            const oldest = Array.from(this.cache.entries())
                .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0];
            this.cache.delete(oldest[0]);
        }
    }
    
    /**
     * Load all Strudel libraries
     */
    async loadAll() {
        const libraries = ['core', 'webaudio', 'mini', 'soundfonts'];
        const results = {};
        
        console.log('🎵 Loading all Strudel libraries...');
        
        for (const lib of libraries) {
            try {
                results[lib] = await this.loadLibrary(lib);
                console.log(`✅ ${lib} loaded successfully`);
            } catch (error) {
                console.error(`❌ Failed to load ${lib}:`, error.message);
                // Don't throw - continue with other libraries
                results[lib] = null;
            }
        }
        
        return results;
    }
    
    /**
     * Check system compatibility
     */
    checkCompatibility() {
        const features = this.config.features;
        const results = {};
        
        for (const [name, check] of Object.entries(features)) {
            try {
                results[name] = check();
            } catch (error) {
                results[name] = false;
                console.warn(`Feature check failed for ${name}:`, error.message);
            }
        }
        
        console.log('🔍 Compatibility check:', results);
        return results;
    }
}

// Export configuration and loader
window.STRUDEL_CDN_CONFIG = STRUDEL_CDN_CONFIG;
window.StrudelCDNLoader = StrudelCDNLoader;

// Create global instance
window.strudelCDN = new StrudelCDNLoader();

console.log('🎵 Strudel CDN loader initialized');
