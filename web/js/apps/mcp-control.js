// Enhanced MCP Server Control App with Real-Time Monitoring and Auto-Discovery
class MCPControlApp {
    constructor() {
        this.name = 'MCP Control';
        this.icon = '🔌';
        this.servers = new Map();
        this.refreshInterval = null;
        this.discoveryInterval = null;
        this.serverTemplates = new Map();
        this.connectionHistory = [];
        this.performanceMetrics = new Map();
        this.autoDiscovery = true;
        
        // Initialize common server templates
        this.initializeServerTemplates();
        
        // Start auto-discovery
        this.startAutoDiscovery();
    }

    initializeServerTemplates() {
        // Common MCP server configurations
        this.serverTemplates.set('filesystem', {
            name: 'File System Server',
            description: 'Access and manage local file system',
            command: 'npx',
            args: ['@modelcontextprotocol/server-filesystem'],
            env: {},
            autoStart: false,
            category: 'core',
            icon: '📁'
        });
        
        this.serverTemplates.set('github', {
            name: 'GitHub Integration',
            description: 'Access GitHub repositories and issues',
            command: 'npx',
            args: ['@modelcontextprotocol/server-github'],
            env: { GITHUB_TOKEN: '' },
            autoStart: false,
            category: 'integration',
            icon: '🐙'
        });
        
        this.serverTemplates.set('sqlite', {
            name: 'SQLite Database',
            description: 'Query and manage SQLite databases',
            command: 'npx',
            args: ['@modelcontextprotocol/server-sqlite'],
            env: {},
            autoStart: false,
            category: 'database',
            icon: '🗄️'
        });
        
        this.serverTemplates.set('google-drive', {
            name: 'Google Drive',
            description: 'Access Google Drive files and folders',
            command: 'npx',
            args: ['@modelcontextprotocol/server-gdrive'],
            env: { GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '' },
            autoStart: false,
            category: 'cloud',
            icon: '☁️'
        });
        
        this.serverTemplates.set('brave-search', {
            name: 'Brave Search',
            description: 'Web search capabilities via Brave Search API',
            command: 'npx',
            args: ['@modelcontextprotocol/server-brave-search'],
            env: { BRAVE_API_KEY: '' },
            autoStart: false,
            category: 'search',
            icon: '🔍'
        });
        
        this.serverTemplates.set('postgres', {
            name: 'PostgreSQL Database',
            description: 'Connect to PostgreSQL databases',
            command: 'npx',
            args: ['@modelcontextprotocol/server-postgres'],
            env: { POSTGRES_CONNECTION_STRING: '' },
            autoStart: false,
            category: 'database',
            icon: '🐘'
        });
        
        this.serverTemplates.set('puppeteer', {
            name: 'Web Automation',
            description: 'Browser automation with Puppeteer',
            command: 'npx',
            args: ['@modelcontextprotocol/server-puppeteer'],
            env: {},
            autoStart: false,
            category: 'automation',
            icon: '🎭'
        });
        
        this.serverTemplates.set('fetch', {
            name: 'HTTP Fetch',
            description: 'Make HTTP requests and fetch web content',
            command: 'npx',
            args: ['@modelcontextprotocol/server-fetch'],
            env: {},
            autoStart: false,
            category: 'network',
            icon: '🌐'
        });
    }

    async render() {
        return `
            <div class="mcp-control-app enhanced">
                <div class="mcp-header">
                    <div class="header-left">
                        <h2>🔌 MCP Server Control Center</h2>
                        <div class="server-status">
                            <span class="status-indicator">
                                🟢 ${this.getActiveServerCount()} servers active
                            </span>
                            <span class="discovery-status">
                                ${this.autoDiscovery ? '🔍 Auto-discovery ON' : '🔍 Auto-discovery OFF'}
                            </span>
                        </div>
                    </div>
                    <div class="mcp-actions">
                        <button onclick="mcpControlApp.refreshServers()" class="btn-primary">🔄 Refresh</button>
                        <button onclick="mcpControlApp.showServerTemplates()" class="btn-secondary">📋 Templates</button>
                        <button onclick="mcpControlApp.showAddServer()" class="btn-secondary">➕ Add Server</button>
                        <button onclick="mcpControlApp.showDiscovery()" class="btn-secondary">🔍 Discovery</button>
                        <button onclick="mcpControlApp.showMetrics()" class="btn-secondary">📊 Metrics</button>
                    </div>
                </div>
                
                <div class="mcp-content">
                    <div class="mcp-sidebar">
                        <div class="server-categories">
                            <h4>📂 Categories</h4>
                            <div class="category-list">
                                <div class="category-item active" data-category="all">
                                    <span class="category-icon">🔍</span>
                                    <span class="category-name">All Servers</span>
                                    <span class="category-count">${this.servers.size}</span>
                                </div>
                                <div class="category-item" data-category="core">
                                    <span class="category-icon">⚙️</span>
                                    <span class="category-name">Core</span>
                                    <span class="category-count">${this.getCategoryCount('core')}</span>
                                </div>
                                <div class="category-item" data-category="integration">
                                    <span class="category-icon">🔗</span>
                                    <span class="category-name">Integrations</span>
                                    <span class="category-count">${this.getCategoryCount('integration')}</span>
                                </div>
                                <div class="category-item" data-category="database">
                                    <span class="category-icon">🗄️</span>
                                    <span class="category-name">Databases</span>
                                    <span class="category-count">${this.getCategoryCount('database')}</span>
                                </div>
                                <div class="category-item" data-category="cloud">
                                    <span class="category-icon">☁️</span>
                                    <span class="category-name">Cloud</span>
                                    <span class="category-count">${this.getCategoryCount('cloud')}</span>
                                </div>
                                <div class="category-item" data-category="custom">
                                    <span class="category-icon">🛠️</span>
                                    <span class="category-name">Custom</span>
                                    <span class="category-count">${this.getCategoryCount('custom')}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="quick-stats">
                            <h4>📊 Quick Stats</h4>
                            <div class="stat-item">
                                <span>Active Servers:</span>
                                <span class="stat-value">${this.getActiveServerCount()}</span>
                            </div>
                            <div class="stat-item">
                                <span>Total Connections:</span>
                                <span class="stat-value">${this.connectionHistory.length}</span>
                            </div>
                            <div class="stat-item">
                                <span>Auto-start Enabled:</span>
                                <span class="stat-value">${this.getAutoStartCount()}</span>
                            </div>
                            <div class="stat-item">
                                <span>Templates Available:</span>
                                <span class="stat-value">${this.serverTemplates.size}</span>
                            </div>
                        </div>
                        
                        <div class="recent-activity">
                            <h4>🔔 Recent Activity</h4>
                            <div class="activity-list">
                                ${this.renderRecentActivity()}
                            </div>
                        </div>
                    </div>
                    
                    <div class="server-list-container">
                        <div class="list-header">
                            <div class="search-filter-bar">
                                <input type="text" id="server-search" placeholder="Search servers..." 
                                       onkeyup="mcpControlApp.filterServers()">
                                <select id="status-filter" onchange="mcpControlApp.filterServers()">
                                    <option value="">All Status</option>
                                    <option value="running">Running</option>
                                    <option value="stopped">Stopped</option>
                                    <option value="error">Error</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="server-list" id="mcp-server-list">
                            ${this.renderServerList()}
                        </div>
                    </div>
                </div>
                
                ${this.renderModals()}
            </div>
        `;
    }

    renderServerList() {
        if (this.servers.size === 0) {
            return `
                <div class="no-servers">
                    <div class="no-servers-icon">🔌</div>
                    <h3>No MCP Servers Configured</h3>
                    <p>Add your first MCP server to get started with Model Context Protocol integration.</p>
                    <div class="quick-actions">
                        <button onclick="mcpControlApp.showServerTemplates()" class="btn-primary">
                            📋 Browse Templates
                        </button>
                        <button onclick="mcpControlApp.showAddServer()" class="btn-secondary">
                            ➕ Add Custom Server
                        </button>
                    </div>
                </div>
            `;
        }
        
        return Array.from(this.servers.entries()).map(([name, server]) => {
            const metrics = this.performanceMetrics.get(name) || {};
            const statusIcon = this.getStatusIcon(server.status);
            const statusClass = server.status || 'stopped';
            
            return `
                <div class="server-card ${statusClass}">
                    <div class="server-header">
                        <div class="server-info">
                            <div class="server-title">
                                <span class="server-icon">${server.icon || '🔌'}</span>
                                <h4>${server.displayName || name}</h4>
                                <span class="server-category">${server.category || 'custom'}</span>
                            </div>
                            <div class="server-description">${server.description || 'No description'}</div>
                            <div class="server-command">
                                <code>${server.command} ${(server.args || []).join(' ')}</code>
                            </div>
                        </div>
                        <div class="server-actions">
                            ${server.status === 'running' ? 
                                `<button onclick="mcpControlApp.stopServer('${name}')" class="btn-danger">⏹️ Stop</button>` :
                                `<button onclick="mcpControlApp.startServer('${name}')" class="btn-primary">▶️ Start</button>`
                            }
                            <button onclick="mcpControlApp.restartServer('${name}')" class="btn-secondary">🔄 Restart</button>
                            <button onclick="mcpControlApp.editServer('${name}')" class="btn-secondary">✏️ Edit</button>
                            <button onclick="mcpControlApp.testConnection('${name}')" class="btn-secondary">🧪 Test</button>
                            <button onclick="mcpControlApp.removeServer('${name}')" class="btn-danger">🗑️ Remove</button>
                        </div>
                    </div>
                    
                    <div class="server-details">
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Status:</strong>
                                <span class="status-badge ${statusClass}">
                                    ${statusIcon} ${(server.status || 'stopped').toUpperCase()}
                                </span>
                            </div>
                            <div class="detail-item">
                                <strong>PID:</strong>
                                <span>${server.pid || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Uptime:</strong>
                                <span>${this.formatUptime(server.startTime)}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Auto-start:</strong>
                                <span>${server.autoStart ? '✅ Enabled' : '❌ Disabled'}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Last Check:</strong>
                                <span>${server.lastCheck ? new Date(server.lastCheck).toLocaleTimeString() : 'Never'}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Connections:</strong>
                                <span>${metrics.connections || 0}</span>
                            </div>
                        </div>
                        
                        ${server.status === 'running' && metrics ? `
                            <div class="performance-metrics">
                                <div class="metric-item">
                                    <span class="metric-label">CPU Usage:</span>
                                    <div class="metric-bar">
                                        <div class="metric-fill" style="width: ${metrics.cpu || 0}%"></div>
                                    </div>
                                    <span class="metric-value">${metrics.cpu || 0}%</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">Memory:</span>
                                    <div class="metric-bar">
                                        <div class="metric-fill" style="width: ${(metrics.memory || 0) / 10}%"></div>
                                    </div>
                                    <span class="metric-value">${metrics.memory || 0}MB</span>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${server.lastError ? `
                            <div class="error-info">
                                <strong>Last Error:</strong>
                                <div class="error-message">${server.lastError}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    startAutoDiscovery() {
        if (!this.autoDiscovery) return;
        
        this.discoveryInterval = setInterval(() => {
            this.discoverServers();
        }, 30000); // Check every 30 seconds
    }

    async discoverServers() {
        try {
            // Auto-discover common MCP servers in common locations
            const commonPaths = [
                'node_modules/.bin',
                '/usr/local/bin',
                process.env.HOME + '/.local/bin'
            ];
            
            // Check for installed MCP packages
            const mcpPackages = [
                '@modelcontextprotocol/server-filesystem',
                '@modelcontextprotocol/server-github',
                '@modelcontextprotocol/server-sqlite'
            ];
            
            // Simulate discovery (in real implementation, this would check actual paths)
            for (const pkg of mcpPackages) {
                const serverName = pkg.split('/').pop().replace('server-', '');
                if (!this.servers.has(serverName)) {
                    // Found new server, add as template suggestion
                    this.addDiscoveredServer(serverName, pkg);
                }
            }
        } catch (error) {
            console.warn('Auto-discovery error:', error);
        }
    }

    addDiscoveredServer(name, packageName) {
        // Add to discovered servers list for user review
        const discovered = JSON.parse(localStorage.getItem('mcp-discovered') || '[]');
        const existing = discovered.find(s => s.name === name);
        
        if (!existing) {
            discovered.push({
                name,
                packageName,
                discoveredAt: new Date().toISOString(),
                status: 'discovered'
            });
            localStorage.setItem('mcp-discovered', JSON.stringify(discovered));
        }
    }

    getActiveServerCount() {
        return Array.from(this.servers.values()).filter(s => s.status === 'running').length;
    }

    getAutoStartCount() {
        return Array.from(this.servers.values()).filter(s => s.autoStart).length;
    }

    getCategoryCount(category) {
        return Array.from(this.servers.values()).filter(s => s.category === category).length;
    }

    getStatusIcon(status) {
        const icons = {
            running: '🟢',
            stopped: '🔴',
            starting: '🟡',
            stopping: '🟡',
            error: '🔴',
            unknown: '⚪'
        };
        return icons[status] || '⚪';
    }

    formatUptime(startTime) {
        if (!startTime) return 'N/A';
        
        const now = Date.now();
        const diff = now - startTime;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    renderRecentActivity() {
        if (this.connectionHistory.length === 0) {
            return '<div class="no-activity">No recent activity</div>';
        }
        
        return this.connectionHistory.slice(-5).reverse().map(event => `
            <div class="activity-item">
                <div class="activity-icon">${this.getEventIcon(event.type)}</div>
                <div class="activity-details">
                    <div class="activity-description">${event.description}</div>
                    <div class="activity-time">${this.formatTime(event.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    getEventIcon(type) {
        const icons = {
            server_started: '▶️',
            server_stopped: '⏹️',
            server_error: '❌',
            server_added: '➕',
            server_removed: '🗑️',
            connection_established: '🔗',
            connection_lost: '🔌'
        };
        return icons[type] || '📝';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    }

    renderModals() {
        return `
            <!-- Add Server Modal -->
            <div id="add-server-modal" class="modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Add MCP Server</h3>
                        <button onclick="mcpControlApp.hideAddServer()" class="modal-close">✕</button>
                    </div>
                    <div class="modal-body">
                        <form id="add-server-form">
                            <div class="form-group">
                                <label for="server-name">Server Name:</label>
                                <input type="text" id="server-name" placeholder="my-mcp-server" required>
                            </div>
                            <div class="form-group">
                                <label for="server-command">Command:</label>
                                <input type="text" id="server-command" placeholder="npx @modelcontextprotocol/server-filesystem" required>
                            </div>
                            <div class="form-group">
                                <label for="server-args">Arguments (JSON):</label>
                                <textarea id="server-args" placeholder='["--root", "/path/to/directory"]' rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="server-env">Environment Variables (JSON):</label>
                                <textarea id="server-env" placeholder='{"NODE_ENV": "production"}' rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label for="server-description">Description:</label>
                                <input type="text" id="server-description" placeholder="Brief description of the server">
                            </div>
                            <div class="form-group">
                                <label for="server-category">Category:</label>
                                <select id="server-category">
                                    <option value="custom">Custom</option>
                                    <option value="core">Core</option>
                                    <option value="integration">Integration</option>
                                    <option value="database">Database</option>
                                    <option value="cloud">Cloud</option>
                                    <option value="automation">Automation</option>
                                </select>
                            </div>
                            <div class="form-group checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="server-autostart">
                                    <span class="checkmark"></span>
                                    Auto-start with application
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button onclick="mcpControlApp.addServer()" class="btn-primary">Add Server</button>
                        <button onclick="mcpControlApp.hideAddServer()" class="btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>

            <!-- Server Templates Modal -->
            <div id="templates-modal" class="modal hidden">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>📋 MCP Server Templates</h3>
                        <button onclick="mcpControlApp.hideServerTemplates()" class="modal-close">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="templates-grid">
                            ${this.renderServerTemplates()}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Discovery Modal -->
            <div id="discovery-modal" class="modal hidden">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🔍 Server Discovery</h3>
                        <button onclick="mcpControlApp.hideDiscovery()" class="modal-close">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="discovery-settings">
                            <label class="checkbox-label">
                                <input type="checkbox" id="auto-discovery-toggle" 
                                       ${this.autoDiscovery ? 'checked' : ''}
                                       onchange="mcpControlApp.toggleAutoDiscovery(this.checked)">
                                <span class="checkmark"></span>
                                Enable automatic server discovery
                            </label>
                        </div>
                        
                        <div class="discovered-servers">
                            <h4>Discovered Servers</h4>
                            <div id="discovered-list">
                                ${this.renderDiscoveredServers()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Metrics Modal -->
            <div id="metrics-modal" class="modal hidden">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h3>📊 Performance Metrics</h3>
                        <button onclick="mcpControlApp.hideMetrics()" class="modal-close">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="metrics-dashboard">
                            ${this.renderMetricsDashboard()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderServerTemplates() {
        return Array.from(this.serverTemplates.entries()).map(([id, template]) => `
            <div class="template-card">
                <div class="template-header">
                    <span class="template-icon">${template.icon}</span>
                    <h4>${template.name}</h4>
                    <span class="template-category">${template.category}</span>
                </div>
                <div class="template-description">
                    ${template.description}
                </div>
                <div class="template-command">
                    <code>${template.command} ${template.args.join(' ')}</code>
                </div>
                <div class="template-actions">
                    <button onclick="mcpControlApp.useTemplate('${id}')" class="btn-primary">
                        ➕ Use Template
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderDiscoveredServers() {
        const discovered = JSON.parse(localStorage.getItem('mcp-discovered') || '[]');
        
        if (discovered.length === 0) {
            return '<div class="no-discovered">No servers discovered yet</div>';
        }
        
        return discovered.map(server => `
            <div class="discovered-server">
                <div class="server-info">
                    <h5>${server.name}</h5>
                    <div class="server-package">${server.packageName}</div>
                    <div class="discovered-time">Discovered: ${new Date(server.discoveredAt).toLocaleString()}</div>
                </div>
                <div class="server-actions">
                    <button onclick="mcpControlApp.addDiscoveredServer('${server.name}')" class="btn-primary">
                        ➕ Add
                    </button>
                    <button onclick="mcpControlApp.ignoreDiscovered('${server.name}')" class="btn-secondary">
                        ✕ Ignore
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderMetricsDashboard() {
        return `
            <div class="metrics-grid">
                <div class="metric-card">
                    <h4>📊 Server Performance</h4>
                    <div class="performance-chart">
                        <!-- Performance chart would go here -->
                        <div class="chart-placeholder">Performance charts coming soon</div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <h4>🔗 Connection Health</h4>
                    <div class="connection-metrics">
                        <div class="metric-item">
                            <span>Active Connections:</span>
                            <span class="metric-value">${this.getActiveServerCount()}</span>
                        </div>
                        <div class="metric-item">
                            <span>Total Uptime:</span>
                            <span class="metric-value">${this.getTotalUptime()}</span>
                        </div>
                        <div class="metric-item">
                            <span>Connection Success Rate:</span>
                            <span class="metric-value">95%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getTotalUptime() {
        const totalUptime = Array.from(this.servers.values())
            .filter(s => s.startTime)
            .reduce((total, server) => total + (Date.now() - server.startTime), 0);
        
        const hours = Math.floor(totalUptime / (1000 * 60 * 60));
        return `${hours}h`;
    }
        // In a real implementation, this would check actual server processes
        // For now, simulate some servers
        const mockServers = [
            { name: 'my-mcp-server', command: 'uvicorn main:app', status: 'running', port: 8765 },
            { name: 'my-mcp-server4', command: 'python server.py', status: 'stopped', port: 8766 }
        ];

        for (const server of mockServers) {
            if (!this.servers.has(server.name)) {
                this.servers.set(server.name, server);
            } else {
                const existing = this.servers.get(server.name);
                existing.status = server.status;
                existing.port = server.port;
            }
        }
    }

    renderServerList() {
        const container = document.getElementById('mcp-server-list');
        if (!container) return;

        if (this.servers.size === 0) {
            container.innerHTML = `
                <div class="no-servers">
                    <h3>No MCP servers configured</h3>
                    <p>Add your first MCP server to get started.</p>
                    <button onclick="mcpControlApp.showAddServer()" class="btn-primary">➕ Add Server</button>
                </div>
            `;
            return;
        }

        const serversHtml = Array.from(this.servers.entries()).map(([name, server]) => `
            <div class="server-card ${server.status}">
                <div class="server-header">
                    <div class="server-info">
                        <h4>${name}</h4>
                        <span class="server-status status-${server.status}">${server.status.toUpperCase()}</span>
                    </div>
                    <div class="server-actions">
                        ${server.status === 'running' ? 
                            `<button onclick="mcpControlApp.stopServer('${name}')" class="btn-danger">⏹️ Stop</button>` :
                            `<button onclick="mcpControlApp.startServer('${name}')" class="btn-success">▶️ Start</button>`
                        }
                        <button onclick="mcpControlApp.editServer('${name}')" class="btn-secondary">✏️ Edit</button>
                        <button onclick="mcpControlApp.removeServer('${name}')" class="btn-danger">🗑️ Remove</button>
                    </div>
                </div>
                <div class="server-details">
                    <div class="detail-row">
                        <strong>Command:</strong> <code>${server.command}</code>
                    </div>
                    ${server.port ? `<div class="detail-row"><strong>Port:</strong> ${server.port}</div>` : ''}
                    ${server.pid ? `<div class="detail-row"><strong>PID:</strong> ${server.pid}</div>` : ''}
                    <div class="detail-row">
                        <strong>Last Check:</strong> ${new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = serversHtml;
    }

    renderError(message) {
        const container = document.getElementById('mcp-server-list');
        if (container) {
            container.innerHTML = `<div class="error">${message}</div>`;
        }
    }

    showAddServer() {
        const modal = document.getElementById('add-server-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideAddServer() {
        const modal = document.getElementById('add-server-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
        // Clear form
        document.getElementById('add-server-form').reset();
    }

    async addServer() {
        const form = document.getElementById('add-server-form');
        const formData = new FormData(form);
        
        const name = document.getElementById('server-name').value;
        const command = document.getElementById('server-command').value;
        const args = document.getElementById('server-args').value;
        const env = document.getElementById('server-env').value;

        if (!name || !command) {
            alert('Please provide server name and command');
            return;
        }

        try {
            const server = {
                name,
                command,
                args: args ? JSON.parse(args) : [],
                env: env ? JSON.parse(env) : {},
                status: 'stopped',
                pid: null,
                port: null
            };

            this.servers.set(name, server);
            this.saveServers();
            this.renderServerList();
            this.hideAddServer();
            
            console.log('Added MCP server:', server);
        } catch (error) {
            alert('Error adding server: ' + error.message);
        }
    }

    async startServer(name) {
        const server = this.servers.get(name);
        if (!server) return;

        try {
            // In a real implementation, this would start the actual process
            // For now, simulate starting
            server.status = 'starting';
            this.renderServerList();
            
            setTimeout(() => {
                server.status = 'running';
                server.pid = Math.floor(Math.random() * 10000) + 1000;
                server.port = server.port || 8765;
                this.renderServerList();
                this.showNotification(`Server "${name}" started successfully`, 'success');
            }, 2000);
            
        } catch (error) {
            server.status = 'error';
            this.renderServerList();
            this.showNotification(`Failed to start server "${name}": ${error.message}`, 'error');
        }
    }

    async stopServer(name) {
        const server = this.servers.get(name);
        if (!server) return;

        try {
            server.status = 'stopping';
            this.renderServerList();
            
            setTimeout(() => {
                server.status = 'stopped';
                server.pid = null;
                this.renderServerList();
                this.showNotification(`Server "${name}" stopped`, 'info');
            }, 1000);
            
        } catch (error) {
            this.showNotification(`Failed to stop server "${name}": ${error.message}`, 'error');
        }
    }

    async removeServer(name) {
        if (confirm(`Are you sure you want to remove server "${name}"?`)) {
            const server = this.servers.get(name);
            if (server && server.status === 'running') {
                await this.stopServer(name);
            }
            
            this.servers.delete(name);
            this.saveServers();
            this.renderServerList();
            this.showNotification(`Server "${name}" removed`, 'info');
        }
    }

    async refreshServers() {
        await this.checkServerStatuses();
        this.renderServerList();
    }

    saveServers() {
        const servers = Array.from(this.servers.values());
        localStorage.setItem('mcp-servers', JSON.stringify(servers));
    }

    showNotification(message, type = 'info') {
        // Use the global notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Create global instance
const mcpControlApp = new MCPControlApp();

// Export for window manager
window.MCPControlApp = MCPControlApp;
