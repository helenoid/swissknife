#!/bin/bash

# SwissKnife Test Suite Quick Reference
# This script provides quick commands for running different test configurations

echo "🧪 SwissKnife Test Suite Quick Reference"
echo "========================================"
echo ""

show_usage() {
    echo "Available commands:"
    echo ""
    echo "  🎯 RECOMMENDED (Most Reliable):"
    echo "    ./test-quick-ref.sh hybrid     # Run 17 working test suites (CI-safe)"
    echo "    ./test-quick-ref.sh working    # Run working tests via shell script"
    echo ""
    echo "  📊 COVERAGE & ANALYSIS:"
    echo "    ./test-quick-ref.sh coverage   # Generate coverage report"
    echo "    ./test-quick-ref.sh ci-safe    # Run CI-safe tests with coverage"
    echo ""
    echo "  🔍 INDIVIDUAL CATEGORIES:"
    echo "    ./test-quick-ref.sh utils      # Run just utility tests"
    echo "    ./test-quick-ref.sh ai         # Run just AI/agent tests"
    echo "    ./test-quick-ref.sh config     # Run just config tests"
    echo "    ./test-quick-ref.sh tasks      # Run just task management tests"
    echo ""
    echo "  🛠️  FULL TEST SUITES:"
    echo "    ./test-quick-ref.sh unit       # Run all unit tests"
    echo "    ./test-quick-ref.sh integration # Run integration tests"
    echo "    ./test-quick-ref.sh e2e        # Run end-to-end tests"
    echo ""
    echo "  📋 INFO:"
    echo "    ./test-quick-ref.sh status     # Show current test suite status"
    echo "    ./test-quick-ref.sh list       # List all available test files"
}

run_command() {
    case "$1" in
        "hybrid")
            echo "🎯 Running Hybrid Test Suite (17 working test suites)..."
            npm run test:hybrid
            ;;
        "working")
            echo "🎯 Running Working Tests via Shell Script..."
            ./run-working-tests.sh
            ;;
        "coverage")
            echo "📊 Generating Coverage Report..."
            npm run test:coverage
            ;;
        "ci-safe")
            echo "📊 Running CI-Safe Tests with Coverage..."
            npm run test:ci-safe
            ;;
        "utils")
            echo "🔍 Running Utility Tests..."
            npx jest test/unit/utils/ --config=jest.hybrid.config.cjs
            ;;
        "ai")
            echo "🔍 Running AI/Agent Tests..."
            npx jest test/unit/ai/ --config=jest.hybrid.config.cjs
            ;;
        "config")
            echo "🔍 Running Configuration Tests..."
            npx jest test/unit/config/ --config=jest.hybrid.config.cjs
            ;;
        "tasks")
            echo "🔍 Running Task Management Tests..."
            npx jest test/unit/tasks/ --config=jest.hybrid.config.cjs
            ;;
        "unit")
            echo "🛠️  Running Full Unit Test Suite..."
            npm run test:unit
            ;;
        "integration")
            echo "🛠️  Running Integration Tests..."
            npm run test:integration
            ;;
        "e2e")
            echo "🛠️  Running End-to-End Tests..."
            npm run test:e2e
            ;;
        "status")
            echo "📋 Current Test Suite Status:"
            echo "    ✅ Working Test Suites: 17"
            echo "    ✅ Estimated Passing Tests: 80+"
            echo "    ✅ Coverage Areas: Utilities, AI, Configuration, Tasks, Complex Modules"
            echo "    ✅ CI/CD Integration: Enhanced with error handling"
            echo ""
            echo "📁 Test File Breakdown:"
            echo "    • Array utilities: 3 files (TypeScript + JavaScript variants)"
            echo "    • JSON utilities: 3 files (TypeScript + JavaScript variants)"
            echo "    • String utilities: 1 file (capitalize, slugify functions)"
            echo "    • Object utilities: 1 file (clone, merge, type checking)"
            echo "    • Validation utilities: 1 file (email, URL, range validation)"
            echo "    • Model system: 2 files (BaseModel, provider definitions)"
            echo "    • AI agent management: 1 file (agent lifecycle)"
            echo "    • Configuration: 1 file (key-value with defaults)"
            echo "    • Task management: 1 file (priority queue operations)"
            ;;
        "list")
            echo "📋 Available Test Files:"
            echo ""
            echo "🔧 Core Utilities (8 suites):"
            echo "  • test/unit/utils/array.test.ts"
            echo "  • test/unit/utils/array-simple.test.js"
            echo "  • test/unit/utils/array-debug.test.ts"
            echo "  • test/unit/utils/json.test.ts"
            echo "  • test/unit/utils/json.test.js"
            echo "  • test/unit/utils/json-simple.test.js"
            echo "  • test/unit/utils/string.test.ts"
            echo "  • test/unit/utils/object.test.ts"
            echo "  • test/unit/utils/validation.test.ts"
            echo ""
            echo "🤖 AI & Models (3 suites):"
            echo "  • test/unit/models/model.test.ts"
            echo "  • test/unit/models/provider.test.ts"
            echo "  • test/unit/ai/agent-simple.test.ts"
            echo ""
            echo "⚙️  Configuration & Tasks (2 suites):"
            echo "  • test/unit/config/config-simple.test.ts"
            echo "  • test/unit/tasks/task-simple.test.ts"
            echo ""
            echo "🔧 Fixed Complex Modules (3 suites):"
            echo "  • test/unit/models/execution-service-fixed.test.ts"
            echo "  • test/unit/commands/help-generator-fixed.test.ts"  
            echo "  • test/unit/commands/command-parser-fixed.test.ts"
            ;;
        *)
            show_usage
            ;;
    esac
}

# Main execution
if [ $# -eq 0 ]; then
    show_usage
else
    run_command "$1"
fi
