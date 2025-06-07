#!/bin/bash
# Run all SwissKnife tests with the fixed configuration
npx jest --config=jest-fixed-all.config.cjs "$@"
