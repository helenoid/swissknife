#!/bin/bash
# Strudel Integration Build Script
# Ensures CDN-first loading with NPM fallback for production builds

set -e

echo "🎵 Building SwissKnife with Strudel Integration..."
echo "=============================================="

# Check if we're in the web directory
if [ ! -f "webpack.config.js" ]; then
    echo "❌ Error: Must run from web directory"
    exit 1
fi

# Check NPM packages are installed
echo "📦 Checking NPM dependencies..."
if [ ! -d "node_modules/@strudel" ]; then
    echo "⚠️  Strudel packages not found, installing..."
    npm install @strudel/core @strudel/webaudio @strudel/mini @strudel/soundfonts
else
    echo "✅ Strudel packages found"
fi

# Run pre-build tests
echo "🧪 Running pre-build integration tests..."
if command -v node &> /dev/null; then
    node -e "
        const fs = require('fs');
        const path = require('path');
        
        // Check required files exist
        const requiredFiles = [
            'js/apps/strudel.js',
            'css/strudel.css',
            'js/core/strudel-cdn-loader.js'
        ];
        
        let allFound = true;
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                console.log('❌ Missing:', file);
                allFound = false;
            } else {
                console.log('✅ Found:', file);
            }
        }
        
        if (!allFound) {
            process.exit(1);
        }
        
        console.log('✅ All Strudel integration files present');
    "
else
    echo "⚠️  Node.js not available, skipping file checks"
fi

# Build for development
echo "🔨 Building development version..."
npm run build:dev

# Test development build
echo "🧪 Testing development build..."
if [ -d "dist" ]; then
    echo "✅ Development build completed"
    ls -la dist/ | head -10
else
    echo "❌ Development build failed"
    exit 1
fi

# Build for production
echo "🚀 Building production version..."
npm run build

# Test production build
echo "🧪 Testing production build..."
if [ -d "dist" ]; then
    echo "✅ Production build completed"
    
    # Check if Strudel files are included
    if [ -f "dist/css/strudel.css" ]; then
        echo "✅ Strudel CSS included in build"
    else
        echo "⚠️  Strudel CSS not found in build"
    fi
    
    # Check bundle sizes
    echo "📊 Bundle sizes:"
    du -h dist/*.js | sort -hr | head -5
    
    # Check total build size
    TOTAL_SIZE=$(du -sh dist/ | cut -f1)
    echo "📁 Total build size: $TOTAL_SIZE"
    
else
    echo "❌ Production build failed"
    exit 1
fi

# Generate CDN configuration for production
echo "🌐 Generating CDN configuration..."
cat > dist/strudel-cdn-config.json << EOF
{
  "version": "$(date +%Y%m%d-%H%M%S)",
  "strategy": "cdn-first-npm-fallback",
  "cdnUrls": {
    "core": "https://unpkg.com/@strudel/core@latest/dist/strudel.mjs",
    "webaudio": "https://unpkg.com/@strudel/webaudio@latest/dist/webaudio.mjs",
    "mini": "https://unpkg.com/@strudel/mini@latest/dist/mini.mjs",
    "soundfonts": "https://unpkg.com/@strudel/soundfonts@latest/dist/soundfonts.mjs"
  },
  "fallback": "bundled-npm-packages",
  "timeout": 10000,
  "retries": 2
}
EOF

echo "✅ CDN configuration generated"

# Create deployment verification script
echo "📋 Creating deployment verification script..."
cat > dist/verify-strudel.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Strudel Deployment Verification</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #1a1a1a; color: white; }
        .test { margin: 10px 0; padding: 10px; border: 1px solid #444; border-radius: 4px; }
        .success { background: #0f5132; }
        .error { background: #58151c; }
    </style>
</head>
<body>
    <h1>🎵 Strudel Deployment Verification</h1>
    <div id="results"></div>
    
    <script>
        async function verify() {
            const results = document.getElementById('results');
            
            function addResult(message, success) {
                const div = document.createElement('div');
                div.className = `test ${success ? 'success' : 'error'}`;
                div.textContent = message;
                results.appendChild(div);
            }
            
            // Test CDN URLs
            const cdnUrls = [
                'https://unpkg.com/@strudel/core@latest/dist/strudel.mjs',
                'https://unpkg.com/@strudel/webaudio@latest/dist/webaudio.mjs'
            ];
            
            for (const url of cdnUrls) {
                try {
                    const response = await fetch(url, { method: 'HEAD' });
                    addResult(`✅ CDN available: ${url}`, response.ok);
                } catch (error) {
                    addResult(`❌ CDN failed: ${url} - ${error.message}`, false);
                }
            }
            
            // Test if built files exist
            const builtFiles = ['main.js', 'css/strudel.css'];
            for (const file of builtFiles) {
                try {
                    const response = await fetch(file, { method: 'HEAD' });
                    addResult(`✅ Built file available: ${file}`, response.ok);
                } catch (error) {
                    addResult(`❌ Built file missing: ${file}`, false);
                }
            }
        }
        
        verify();
    </script>
</body>
</html>
EOF

echo "✅ Deployment verification page created"

# Final report
echo ""
echo "🎯 BUILD SUMMARY"
echo "================"
echo "✅ Development build: Complete"
echo "✅ Production build: Complete"
echo "✅ CDN configuration: Generated"
echo "✅ Verification tools: Created"
echo ""
echo "📁 Build outputs:"
echo "  - dist/           (Built application)"
echo "  - dist/verify-strudel.html (Verification page)"
echo "  - dist/strudel-cdn-config.json (CDN config)"
echo ""
echo "🚀 Ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Test the built application: open dist/index.html"
echo "2. Verify CDN/fallback: open dist/verify-strudel.html"
echo "3. Deploy to your web server"
echo ""
echo "🧪 To test Strudel integration:"
echo "  - Click the 🎵 Strudel icon on the desktop"
echo "  - Check browser console for loading strategy"
echo "  - Verify audio context initialization"
