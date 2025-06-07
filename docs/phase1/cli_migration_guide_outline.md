# CLI Migration Guide Outline

This document outlines the structure and content for a comprehensive migration guide designed to assist users in transitioning from previous versions (or related tools like `swissknife_old`) to the new, integrated SwissKnife CLI (targeting version `[Target Version, e.g., v1.0.0]`).

## 1. Introduction

### 1.1 Purpose of This Guide
- `[Explain why this guide exists - e.g., due to significant architectural changes and new features.]`
- `[Define the target audience - e.g., existing users of swissknife_old, users of specific integrated components, new users.]`
- `[Explain prerequisites - e.g., familiarity with previous version, basic CLI usage.]`
- `[Guide structure overview - how to navigate the sections based on user needs.]`

### 1.2 Integration Overview & Key Changes
- `[Briefly summarize the integration project goals - unifying capabilities, TypeScript rewrite, new features.]`
- `[Highlight the key benefits for the user - e.g., performance, VFS, TaskNet, local ML, consistency.]`
- `[Mention the target version this guide applies to and compatibility notes with previous versions.]`

### 1.3 Migration Strategy Recommendations
- `[Advise on recommended approaches - e.g., suggest parallel installation for testing, recommend config migration first.]`
- `[Outline testing strategies users should employ during their migration.]`
- `[Provide guidance on rollback procedures if major issues are encountered.]`

## 2. Installation and Setup Changes

### 2.1 New Installation Process
- `[Detail the new installation methods - e.g., install script, binary download, package manager.]`
- `[List any changes in dependencies or system prerequisites (Node.js version, build tools if needed).]`
- `[Explain how to install the new version alongside an older version (if possible/recommended for testing).]`
- `[Provide clear instructions for uninstalling previous versions.]`

### 2.2 Configuration Migration (CRITICAL)
- `[Explain the move from the old format (e.g., flat JSON/TOML) to the new hierarchical JSON format.]`
- `[**Detail the usage of the automated migration tool (`swissknife config migrate`) if one is provided.**]`
- `[Provide clear examples mapping old configuration keys/values to their new locations in the hierarchical structure.]`
- `[**Crucially, explain how API keys and other secrets should be migrated to secure storage (keychain/env vars) instead of the config file.**]`
- `[List any changes to supported environment variables and their precedence.]`

### 2.3 First Run and Verification
- `[Describe any new initialization steps required after installation (e.g., initial config setup, key generation).]`
- `[Provide simple commands to verify the installation and basic configuration (e.g., `swissknife --version`, `swissknife config list`, `swissknife doctor`).]`

## 3. Command Changes

### 3.1 Summary of Changes
- `[High-level overview of command changes - new commands, renamed commands, removed commands, significant argument changes.]`
- `[Explicitly list any commands that are deprecated or removed and their replacements.]`
- `[Highlight major changes in command behavior or output.]`

### 3.2 Command Mapping Table (Examples)
- `[Provide a table mapping common old commands/workflows to their new equivalents.]`

| Old Command / Workflow | New Command / Workflow | Key Parameter Changes | Notes |
|------------------------|------------------------|-----------------------|-------|
| `[e.g., old_config set key val]` | `swissknife config set key val --scope user` | Added `--scope` | Configuration is now hierarchical. |
| `[e.g., run_task --input file.txt]` | `swissknife task create --input /local/file.txt` | Path uses VFS, task management is new. | Task system replaces simple execution. |
| `[e.g., ipfs_add file.txt]` | `swissknife ipfs add file.txt` or `swissknife file copy file.txt /ipfs/file.txt` | Dedicated `ipfs` commands or VFS `file` commands. | VFS provides unified interface. |
| ... | ... | ... | ... |

### 3.3 Output Format Changes & Scripting Impact
- `[Explain the changes to default text output formats (if any) and the potential impact on scripts parsing this output.]`
- `[**Strongly recommend updating scripts to use the new structured output options (`--output json`, `--output yaml`).**]`
- `[Provide examples of parsing the new JSON/YAML output for common scripting tasks.]`
- `[Detail changes in exit code conventions, if any.]`

## 4. Feature-by-Feature Migration Guide

### 4.1 Model System
- `[Explain changes to model selection flags/configuration (e.g., using `--model`, configuring defaults).]`
- `[Describe how to list and inspect new model capabilities.]`
- `[Guide users on configuring API keys securely (referencing Section 2.2).]`
- `[Detail how to set up and use local models (if applicable).]`

### 4.2 Storage System (VFS)
- `[Introduce the Virtual Filesystem (VFS) concept and mount points.]`
- `[Explain how to configure storage backends (local, IPFS) and mount points using `storage mount`.]`
- `[Map old file/storage commands to the new `file ...` and `ipfs ...` commands using VFS paths (e.g., `/local/...`, `/ipfs/...`).]`
- `[Provide guidance on migrating data between old storage locations and new VFS backends if necessary.]`

### 4.3 Task System (TaskNet)
- `[Introduce the new TaskNet system concepts (tasks, scheduler, GoT, workers).]`
- `[Explain how to define and submit tasks using `task create` (replacing older execution methods).]`
- `[Show how to monitor task status using `task status` and `task list`.]`
- `[Guide users on configuring local worker pool settings (if applicable).]`
- `[Explain basic usage of GoT via `task graph ...` commands, if relevant for users.]`

### 4.4 Authentication System
- `[Explain how to migrate existing credentials (e.g., API keys) to the new secure storage (keychain/env vars).]`
- `[Describe how to use new `auth ...` commands for key generation or identity management (if applicable).]`
- `[If UCANs are implemented, provide a basic overview and usage guide.]`

### 4.5 MCP Integration
- `[Detail changes in configuring and managing local MCP servers using `mcp ...` commands.]`
- `[Explain any changes related to MCP transports or capabilities.]`

*(Add sections for other major features like Vector Search, ML Engine as needed)*

## 5. Script and Integration Updates

### 5.1 Updating Shell Scripts
- `[Provide concrete examples of common script patterns using old commands and how to update them.]`
- `[Focus on changes needed due to new command names, arguments, and especially output parsing (recommend switching to JSON).]`
- `[Highlight changes in error handling and exit codes.]`

### 5.2 Updating Programmatic Integrations (If Applicable)
- `[If SwissKnife can be used as a library, detail changes to the exported TypeScript/JavaScript API.]`
- `[Provide code examples for updated API usage.]`
- `[Mention changes in authentication or configuration required for programmatic use.]`

### 5.3 Updating CI/CD Pipelines
- `[Guide users on updating installation steps in CI/CD scripts.]`
- `[Highlight changes needed for providing configuration or credentials (e.g., using env vars instead of config files in CI).]`
- `[Address potential changes needed for Docker container setups.]`

## 6. Troubleshooting and Common Issues

### 6.1 Common Migration Problems
- `[List anticipated issues, e.g., "Configuration file not found/invalid format", "Old command 'X' not found", "Script failing due to output change", "API key errors".]`
- `[For each issue, provide diagnostic steps (e.g., "Run `swissknife config list --scope all`", "Check `stderr` for detailed error code").]`
- `[Offer clear resolution steps or links to relevant documentation sections.]`

### 6.2 Compatibility Issues
- `[Explain how to check for version compatibility issues.]`
- `[Guide users on debugging problems potentially caused by interactions between the new CLI and their existing environment/tools.]`
- `[Provide tips on isolating issues (e.g., testing with default config, minimal arguments).]`

### 6.3 Performance Issues
- `[Guide users on diagnosing performance regressions after migration.]`
- `[Suggest common areas for optimization (e.g., resource limits for local ML, network settings for IPFS).]`
- `[Point to relevant configuration options for performance tuning.]`

## 7. Advanced Migration Topics (Optional)

### 7.1 Migrating Custom Tools/Plugins
- `[If the old system supported plugins, detail API changes affecting them.]`
- `[Provide guidance and examples for updating custom tools to the new Tool interface.]`

### 7.2 Migrating Large-Scale Deployments
- `[Offer strategies for rolling out the new version in enterprise environments.]`
- `[Discuss considerations for managing configuration and user training at scale.]`

### 7.3 Migrating Data / Models / Indexes
- `[Provide specific instructions if users need to migrate large datasets, ML models, or vector indexes compatible with the new version.]`

## 8. Reference Appendices

### 8.1 Command Mapping Quick Reference
- `[Concise table mapping old commands -> new commands.]`

### 8.2 Configuration Schema Reference
- `[Link to or include the full JSON schema for the new configuration file format.]`
- `[Detail default values and environment variable overrides.]`

### 8.3 Error Code Reference
- `[List key error codes introduced or changed, their meanings, and common causes.]`

## 9. Migration Checklists

### 9.1 Basic User Checklist
- `[ ] Backup existing configuration.`
- `[ ] Install new SwissKnife version.`
- `[ ] Run `swissknife config migrate` (if available) or manually update config (esp. API keys).`
- `[ ] Verify installation with `swissknife --version`.`
- `[ ] Test core commands used in daily workflow.`
- `[ ] Review documentation for changed commands.`

### 9.2 Advanced User / Scripter Checklist
- `[ ] All steps from Basic User Checklist.`
- `[ ] Audit existing scripts for command changes.`
- `[ ] Update scripts to use `--output json` where possible.`
- `[ ] Test updated scripts thoroughly.`
- `[ ] Explore new configuration options (hierarchical scopes, VFS mounts, etc.).`
- `[ ] Test workflows involving new features (TaskNet, VFS, etc.).`

### 9.3 System Administrator Checklist (If Applicable)
- `[ ] Plan deployment rollout schedule.`
- `[ ] Verify system prerequisites on target machines.`
- `[ ] Prepare updated configuration templates for deployment.`
- `[ ] Test installation/upgrade process in staging environment.`
- `[ ] Prepare user communication and training materials.`

## 10. Migration Examples

### Example 1: Migrating Basic User Config & Workflow
- `[Show old config file snippet -> Show new config file snippet (including secure key handling).]`
- `[Show sequence of old commands -> Show equivalent sequence of new commands.]`

### Example 2: Migrating a Shell Script
- `[Show old shell script snippet (parsing text output).]`
- `[Show updated shell script snippet (using `--output json` and `jq` or similar).]`

### Example 3: Migrating an Enterprise Deployment (Conceptual)
- `[Outline steps for a phased rollout in a team environment.]`
- `[Discuss central configuration management strategies.]`

## 11. Conclusion and Support

### 11.1 Post-Migration Recommendations
- `[Suggest exploring new features like TaskNet, VFS.]`
- `[Recommend performance tuning based on new options.]`
- `[Advise on keeping the tool updated.]`

### 11.2 Getting Help
- `[Link to relevant documentation sections (Troubleshooting, Command Ref, etc.).]`
- `[Link to community support channels (GitHub Discussions, Discord/Slack if applicable).]`
- `[Link to GitHub Issues for reporting migration-specific bugs.]`

### 11.3 Providing Feedback
- `[Encourage users to provide feedback on the migration process and the new version.]`
- `[Link to feedback channels (Discussions, specific issue labels).]`

---

## Implementation Notes for Migration Guide

### Document Preparation Timeline (Example)
1.  **During Phase 4:** Draft initial sections covering known command/config changes as they are implemented.
2.  **During Phase 5 (Testing):** Refine sections based on testing results and identified migration hurdles. Write troubleshooting guide.
3.  **During Phase 5 (Docs):** Finalize all sections, add comprehensive examples, perform editorial review.
4.  **Beta Phase:** Incorporate feedback from beta testers.
5.  **GA Release:** Publish final version.

### Content Development Strategy
- Maintain a running list of breaking changes and migration notes during development (e.g., in PR descriptions, dedicated internal doc).
- Create concrete "before" and "after" examples for configuration and common commands/scripts.
- Develop the `swissknife config migrate` tool (if feasible) alongside the guide.
- Use screenshots or short GIFs/videos for complex setup or UI changes.

### Distribution Plan
- Include as primary documentation on project website/repository (`docs/migration_guide.md`).
- Link prominently from README and release notes.
- Consider PDF version for offline access.

### Validation Approach
- Have developers review sections related to the components they implemented.
- Perform dry-runs of the migration steps internally.
- **Crucially, validate the guide with actual users during the Beta phase.** Incorporate their feedback.
- Test migration tool (if any) extensively.
