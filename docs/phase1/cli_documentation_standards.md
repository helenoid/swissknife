# CLI Documentation Standards

This document establishes standards for creating and maintaining documentation related to the SwissKnife CLI application, including analysis documents, API specifications, command references, and user guides. Adhering to these standards ensures consistency, completeness, and clarity across all project documentation.

## Documentation File Structure

All documentation should be organized using the following structure:

```
docs/
  ├── phase1/                     # Phase 1 integration documentation
  │   ├── analysis/               # Component analysis documents
  │   │   └── [component]_analysis.md
  │   ├── component_inventory.md  # Component inventory
  │   ├── cli_architecture.md     # CLI architecture
  │   ├── cli_integration_strategy.md # Integration strategy
  │   └── ... (other phase 1 docs)
  └── commands/                   # Command-specific documentation
      └── [command_name].md       # Documentation for each command
```

## Document Templates

The following templates should be used as a starting point for common documentation types to ensure consistency.

### 1. Component Analysis Template (`docs/phase1/analysis/`)

*Purpose: To provide an in-depth analysis of a specific component being considered for integration.*

```markdown
# [Component Name] Analysis

## Overview
Brief description of the component's purpose and function.

## CLI Compatibility Assessment
- **Compatibility**: [Compatible | Requires Adaptation | Incompatible]
- **Priority**: [High | Medium | Low]
- **Complexity**: [High | Medium | Low]

## Component Details
Detailed description of the component's functionality, architecture, and design.

## Dependencies
- List of external dependencies
- Internal dependencies on other components

## CLI Integration Considerations
Specific considerations for integrating this component into a CLI environment.

## Adaptation Requirements
For components requiring adaptation, details on changes needed for CLI compatibility.

## Implementation Approach
Recommended approach for implementing or integrating the component.

## Testing Considerations
Specific testing requirements or considerations for this component.

## Documentation Requirements
Documentation needs specific to this component.
```

### 2. Command Documentation Template (`docs/commands/`)

*Purpose: To document the usage, options, and examples for a specific user-facing CLI command. Note: Parts of this may be auto-generated from code definitions.*

```markdown
# `swissknife [command-name]`

[Brief description of the command's purpose]

## Usage

```
swissknife [command] [subcommand] [options]
```

## Options

| Option | Alias | Type | Description | Default | Required |
|--------|-------|------|-------------|---------|----------|
| [option1] | [alias] | [type] | [description] | [default] | [Yes/No] |
| [option2] | [alias] | [type] | [description] | [default] | [Yes/No] |

## Subcommands

### [subcommand1]

[Description of subcommand]

#### Usage

```
swissknife [command] [subcommand1] [options]
```

#### Options

| Option | Alias | Type | Description | Default | Required |
|--------|-------|------|-------------|---------|----------|
| [option1] | [alias] | [type] | [description] | [default] | [Yes/No] |
| [option2] | [alias] | [type] | [description] | [default] | [Yes/No] |

## Examples

```bash
# Example 1: [Brief description]
swissknife [command] [example command line]

# Example 2: [Brief description]
swissknife [command] [example command line]
```

## Notes

[Additional information, caveats, or important notes]

## Related Commands

- [`[related-command1]`](./[related-command1].md): [Brief description]
- [`[related-command2]`](./[related-command2].md): [Brief description]
```

### 3. Implementation Document Template (`docs/architecture/` or similar)

*Purpose: To document the internal design, architecture, and API of a specific implemented component or service.*

```markdown
# [Component Name] Implementation Details

## Overview
Brief description of the implemented component.

## Architecture
Architectural design of the component, including diagrams if appropriate.

## API Reference

### Classes

#### [Class Name]

[Description of class]

##### Constructor

```typescript
constructor([param1]: [type], [param2]: [type])
```

##### Properties

| Name | Type | Description |
|------|------|-------------|
| [property1] | [type] | [description] |
| [property2] | [type] | [description] |

##### Methods

###### [method1]

```typescript
[method1]([param1]: [type], [param2]: [type]): [return type]
```

[Description of method]

**Parameters:**
- [param1]: [description]
- [param2]: [description]

**Returns:** [description of return value]

### Interfaces

#### [Interface Name]

[Description of interface]

##### Properties

| Name | Type | Description |
|------|------|-------------|
| [property1] | [type] | [description] |
| [property2] | [type] | [description] |

##### Methods

###### [method1]

```typescript
[method1]([param1]: [type], [param2]: [type]): [return type]
```

[Description of method]

## Command Line Interface
Description of the command line interface for this component.

## Configuration
Configuration options for this component.

## Examples
Example usage of the component.

## Testing
Testing approach and considerations for the component.
```

## Documentation Style Guidelines

### 1. General Style

- Use clear, concise language
- Write in present tense (e.g., "The command returns" not "The command will return")
- Use active voice where possible
- Define acronyms and technical terms on first use
- Use consistent terminology throughout all documentation
- Format code snippets, commands, and file paths appropriately

### 2. Markdown Formatting

- Use ATX-style headings with a space after the `#` characters (e.g., `## Heading 2`)
- Use fenced code blocks with language specifiers (e.g., ```typescript)
- Use unordered lists with `-` for list items
- Use ordered lists with `1.`, `2.`, etc. for sequential steps
- Use tables for structured data
- Use *italics* for emphasis and **bold** for strong emphasis
- Use `code` formatting for code elements, commands, and file paths

### 3. Command Documentation

- Begin with a clear, concise description of the command's purpose
- Document all options, including type, default value, and whether required
- Document all subcommands with their options
- Provide practical, realistic examples
- Document exit codes and error messages
- Include related commands when appropriate

### 4. API Documentation

- Document all public classes, interfaces, and functions
- Include parameter types and return types
- Document thrown exceptions
- Provide descriptions for all parameters
- Include example usage when appropriate
- Document default values and valid ranges for parameters

### 5. Code Examples

- Provide complete, working examples
- Include comments in examples to explain key points
- Ensure examples follow project coding standards
- Test all examples to ensure they work as documented

## CLI Command Output Examples

Include standardized examples of CLI command output:

### Success Output

```
[✓] Operation completed successfully
    Details: Added 3 files to IPFS
    CIDs: Qm123... Qm456... Qm789...
```

### Error Output

```
[✗] Operation failed: Unable to connect to IPFS node
    Details: Connection refused at 127.0.0.1:5001
    Suggested action: Ensure IPFS daemon is running with 'ipfs daemon'
```

### Progress Output

```
[▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      ] 75% Complete
Processing item 75/100: document.pdf
```

## Command Syntax Notation

Use the following notation for documenting command syntax:

- `command`: Required command or subcommand
- `<parameter>`: Required parameter value
- `[parameter]`: Optional parameter value
- `--option`: Option with double hyphen prefix
- `-o`: Short option with single hyphen prefix
- `--option=<value>`: Option with required value
- `--option[=<value>]`: Option with optional value
- `item1|item2`: Mutually exclusive options

## Term Glossary

Maintain a consistent glossary of key terms used throughout the project documentation.

- **Agent (AI Agent)**: The core component responsible for processing user requests, interacting with models, and using tools.
- **Backend (Storage)**: A specific implementation providing storage capabilities (e.g., FilesystemBackend, IPFSBackend).
- **CLI**: Command-Line Interface; the primary user interaction method for SwissKnife.
- **Command**: A user-invokable action in the CLI (e.g., `swissknife agent chat`). Can have subcommands.
- **Component**: A logical unit of functionality within the architecture (e.g., Storage System, Model System).
- **Configuration**: Settings that control the application's behavior, loaded hierarchically.
- **Context (Execution Context)**: An object passed to command handlers providing access to arguments, configuration, and services.
- **GoT (Graph-of-Thought)**: A reasoning structure used by the Task System for complex problem-solving.
- **IPFS (InterPlanetary File System)**: Content-addressable, peer-to-peer storage network.
- **IPFS Kit MCP Server**: The specific external server providing IPFS capabilities via the Model Context Protocol.
- **Mapping Store (IPFS)**: Internal mechanism used by the IPFSBackend to map virtual paths to CIDs.
- **MCP (Model Context Protocol)**: A protocol for communication between AI models/agents and external tools/resources.
- **Milestone**: A significant point or deliverable in the project timeline.
- **Model**: An AI model (e.g., LLM, embedding model) used for generation or analysis.
- **Mount Point (Storage)**: A virtual path prefix mapped to a specific storage backend in the VFS.
- **Option / Flag**: A modifier specified on the command line (e.g., `--verbose`, `-f <file>`) to alter command behavior.
- **Parameter / Argument**: A value required by or passed to a command, option, or tool.
- **Provider (Model)**: An implementation that interacts with a specific source of AI models (e.g., OpenAI API, local runtime).
- **Registry**: A central store for managing definitions (e.g., CommandRegistry, ModelRegistry, StorageRegistry).
- **Service**: A distinct functional unit within the architecture, often accessible via the Execution Context (e.g., AgentService, StorageService). Can also refer to long-running background processes.
- **Storage Operations / VFS**: The high-level API providing a unified interface over different storage backends.
- **Task**: A unit of work managed by the Task System, potentially executed by workers.
- **TaskNet**: The enhanced task processing system including GoT, scheduling, decomposition, etc.
- **Tool**: A capability invokable by the AI Agent (or directly) to interact with external systems or perform specific actions.
- **Worker (Worker Thread)**: A Node.js `worker_thread` used for parallel execution of tasks locally.

## Documentation Testing

All documentation should be tested for:

1. **Accuracy**: Verify all commands, options, and examples work as described
2. **Completeness**: Ensure all commands, options, and behaviors are documented
3. **Clarity**: Ensure documentation is clear and understandable
4. **Consistency**: Ensure terminology and formatting are consistent
5. **Links**: Verify all internal and external links work correctly

## Command Reference Standards

The command reference documentation should follow these standards:

1. **Completeness**: Document all commands, subcommands, and options
2. **Consistency**: Use consistent formatting for all commands
3. **Examples**: Include practical examples for all commands
4. **Organization**: Organize commands logically by functional area
5. **Index**: Provide an index of all available commands

## Version Information

Documentation should include version information:

1. **Document Version**: Version of the documentation itself
2. **Compatible Software Version**: Version of SwissKnife the documentation applies to
3. **Last Updated**: Date the documentation was last updated
4. **Contributors**: Authors or contributors to the documentation

## Translation Guidelines

For future internationalization:

1. **String Extraction**: Mark all user-facing strings for translation
2. **Cultural Considerations**: Be aware of cultural differences and avoid idioms
3. **Text Expansion**: Allow for text expansion in translated versions
4. **Date and Time Formats**: Use ISO formats or explicitly document formats
5. **Directional Text**: Consider right-to-left language support

## Documentation Review Process

All documentation should go through the following review process:

1. **Self-Review**: Author reviews for completeness and accuracy
2. **Technical Review**: Developer familiar with the component reviews for technical accuracy
3. **Usability Review**: Reviewer unfamiliar with the component reviews for clarity and usability
4. **Editorial Review**: Review for style, grammar, and consistency
5. **Final Approval**: Project lead approves final documentation

## Documentation Maintenance

Documentation maintenance responsibilities:

1. **Ownership**: Each component should have a documentation owner
2. **Update Frequency**: Documentation should be updated with each code change
3. **Review Cycle**: Full documentation review every major release
4. **Deprecation**: Mark deprecated features clearly with migration paths
5. **Archiving**: Archive documentation for previous versions

## Conclusion

These documentation standards ensure that all SwissKnife CLI documentation is consistent, complete, and clear. By following these standards, we create a professional, usable documentation set that enhances the value of the SwissKnife CLI tool.

All documentation should be committed to version control alongside code, and documentation changes should be included in the same pull requests as code changes when practical.
