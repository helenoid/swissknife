# MCP Blue/Green Deployment System

This document provides a comprehensive overview of the Blue/Green Deployment capabilities that have been added to the MCP (Model Context Protocol) server system.

## 1. Overview

The Blue/Green Deployment system for MCP servers enables safe, reliable deployment of new server versions with zero downtime. The system supports:

- Multiple concurrent versions of the same server
- Gradual traffic shifting between versions
- Automatic rollback capabilities
- Detailed version history tracking
- Full command-line management interface

## 2. Architecture

The system consists of the following components:

### 2.1 Core Components

- **ServerRegistry**: Central registry for tracking server versions and their status
- **DeploymentManager**: High-level service for managing deployments
- **CLI Commands**: User interface for managing server versions

### 2.2 Data Flow

```
┌─────────────┐      ┌─────────────────┐      ┌──────────────┐
│             │      │                 │      │              │
│  CLI        │─────▶│  Deployment     │─────▶│  Server      │
│  Commands   │◀─────│  Manager        │◀─────│  Registry    │
│             │      │                 │      │              │
└─────────────┘      └─────────────────┘      └──────────────┘
                                                     │
                                                     ▼
                                              ┌──────────────┐
                                              │              │
                                              │ Configuration│
                                              │ Store        │
                                              │              │
                                              └──────────────┘
```

## 3. Key Concepts

### 3.1 Deployment Status

Each server version can have one of three statuses:

- **Blue**: The stable, production version (only one per server)
- **Green**: A new version being tested or gradually rolled out
- **Inactive**: A version that is not receiving traffic

### 3.2 Traffic Distribution

The system automatically manages traffic distribution between versions:

- Traffic is expressed as a percentage (0-100%)
- The sum of all traffic percentages for active versions always equals 100%
- When changing one version's traffic, others are automatically adjusted

### 3.3 Version History

The system maintains detailed history for each server version:

- Status changes (when a version was promoted or demoted)
- Traffic percentage changes
- Rollback events (when a problematic version was rolled back)

## 4. Command Reference

### 4.1 Deployment Commands

#### `mcp-deploy`

Deploy a new server version

```
mcp-deploy <name> <version> --type <stdio|sse> [options]
```

Options:
- `--command <command>`: Command to execute (for stdio servers)
- `--args <args...>`: Arguments for the command (stdio servers only)
- `--url <url>`: URL for SSE servers
- `--env <env...>`: Environment variables (KEY=value format)
- `--traffic <percentage>`: Initial traffic percentage (0-100)
- `--blue`: Set as blue (stable) version instead of green
- `--scope <project|global|mcprc>`: Configuration scope

Example:
```
mcp-deploy my-server 1.0.0 --type stdio --command node --args server.js --traffic 0
```

#### `mcp-promote`

Promote a version to blue (stable) status

```
mcp-promote <name> <version>
```

Example:
```
mcp-promote my-server 1.0.0
```

#### `mcp-rollback`

Roll back from a version to the stable (blue) version

```
mcp-rollback <name> <version> [--reason <reason>]
```

Example:
```
mcp-rollback my-server 2.0.0 --reason "High error rate"
```

#### `mcp-traffic`

Set traffic percentage for a version

```
mcp-traffic <name> <version> <percentage>
```

Example:
```
mcp-traffic my-server 2.0.0 50
```

### 4.2 Information Commands

#### `mcp-status`

Get status information for server versions

```
mcp-status [name] [--json]
```

Example:
```
mcp-status my-server
```

#### `mcp-history`

Get deployment history for a server version

```
mcp-history <name> <version> [--json]
```

Example:
```
mcp-history my-server 1.0.0
```

### 4.3 Management Commands

#### `mcp-migrate`

Migrate existing MCP servers to support blue/green deployment

```
mcp-migrate
```

#### `mcp-remove-version`

Remove a server version

```
mcp-remove-version <name> <version>
```

Example:
```
mcp-remove-version my-server 1.0.0
```

## 5. Usage Scenarios

### 5.1 Basic Deployment Workflow

1. Deploy new version with 0% traffic:
   ```
   mcp-deploy my-server 2.0.0 --type stdio --command node --args server.js --traffic 0
   ```

2. Gradually increase traffic:
   ```
   mcp-traffic my-server 2.0.0 20
   # Monitor for any issues
   mcp-traffic my-server 2.0.0 50
   # Monitor for any issues
   mcp-traffic my-server 2.0.0 100
   ```

3. Promote to stable:
   ```
   mcp-promote my-server 2.0.0
   ```

### 5.2 Immediate Deployment (Blue/Green Swap)

1. Deploy new version as blue:
   ```
   mcp-deploy my-server 2.0.0 --type stdio --command node --args server.js --blue
   ```

### 5.3 Rollback Scenario

1. If issues are detected, roll back:
   ```
   mcp-rollback my-server 2.0.0 --reason "Performance degradation"
   ```

## 6. Implementation Details

### 6.1 Configuration Storage

Server versions are stored in different locations based on scope:

- **Project**: In the project configuration file
- **Global**: In the global configuration file
- **MCPRC**: In the .mcprc file

### 6.2 Version History

Version history is stored in the project configuration file with the following structure:

```json
{
  "mcpVersionHistory": {
    "my-server": {
      "versions": ["1.0.0", "2.0.0"],
      "currentBlue": "1.0.0",
      "lastRollback": {
        "fromVersion": "2.0.0",
        "toVersion": "1.0.0",
        "timestamp": 1618159897000,
        "reason": "Performance degradation"
      }
    }
  }
}
```

### 6.3 Event System

The `ServerRegistry` emits events for important changes:

- `server:registered`: When a server version is registered
- `server:status-changed`: When a server version's status changes
- `server:traffic-changed`: When a server version's traffic percentage changes
- `server:health-changed`: When a server health status changes
- `server:rollback`: When a rollback occurs

## 7. Best Practices

### 7.1 Version Numbers

- Use semantic versioning (MAJOR.MINOR.PATCH) for server versions
- Increment the major version for breaking changes
- Increment the minor version for new features
- Increment the patch version for bug fixes

### 7.2 Deployment Strategy

- Start with 0% traffic for new versions
- Gradually increase traffic while monitoring for issues
- Promote to blue only after thorough testing
- Keep the previous stable version available for quick rollback

### 7.3 Monitoring

- Watch server logs during deployment
- Monitor error rates, performance metrics
- Set up automated health checks

## 8. Troubleshooting

### 8.1 Common Issues

- **Issue**: Cannot promote to blue
  **Solution**: Ensure there are no other versions with blue status

- **Issue**: Traffic percentages don't add up to 100%
  **Solution**: The system automatically normalizes percentages, but you may need to manually adjust

- **Issue**: Cannot roll back
  **Solution**: Ensure you have a blue version to roll back to

### 8.2 Logs

When troubleshooting, check the logs for events related to server deployments:

- `mcp_server_registered`: When a server version is registered
- `mcp_server_updated`: When a server version is updated
- `mcp_server_status_changed`: When a server version's status changes
- `mcp_server_traffic_changed`: When a server version's traffic percentage changes
- `mcp_server_rollback`: When a rollback occurs

## 9. Future Enhancements

Future versions of the Blue/Green Deployment system will include:

- Traffic manager for intelligent request routing
- Automated health monitoring and rollback
- Advanced deployment patterns (canary, A/B testing)
- Deployment metrics and analytics
- Web-based management interface