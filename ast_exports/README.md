# SwissKnife Ecosystem AST Analysis

This directory contains comprehensive Abstract Syntax Tree (AST) analyses of the SwissKnife ecosystem components, including:

- Current SwissKnife TypeScript/JavaScript codebase
- Goose Rust codebase
- IPFS Accelerate JS codebase
- SwissKnife Old JavaScript/Python codebase

## Directory Structure

- `directory_structures.md`: Complete directory hierarchies for all codebases
- `interfaces/`: TypeScript interfaces extraction
- `rust_modules/`: Rust module structure
- `rust_structures/`: Rust struct definitions
- `swissknife_old/`: Legacy code analysis
- `full_asts/`: Complete AST generation for all files
  - `js/`: JavaScript/TypeScript ASTs
  - `rust/`: Rust ASTs
  - `python/`: Python ASTs
- `ast_stats.md`: Statistics about AST generation
- `ast_summary.md`: Summary of generated ASTs

## Purpose

These AST extractions provide Claude with a structured view of the codebase for:
- Generating TypeScript implementations of Rust components
- Analyzing integration points between components
- Creating tight coupling of features into the new SwissKnife system
- Understanding the IPFS Kit MCP server architecture
