/**
 * VibeCode App - Professional AI-Powered Streamlit Development Environment
 * Advanced IDE with Monaco Editor, real-time collaboration, and intelligent code assistance
 */

export class VibeCodeApp {
  constructor(desktop) {
    this.desktop = desktop;
    this.swissknife = null;
    
    // Core editor instances
    this.monacoEditor = null;
    this.richEditor = null;
    this.previewFrame = null;
    
    // File and project management
    this.currentFile = null;
    this.currentProject = null;
    this.recentFiles = [];
    this.openTabs = [];
    this.activeTabIndex = 0;
    
    // Editor configuration
    this.language = 'python';
    this.theme = 'vs-dark';
    this.editorMode = 'code'; // 'rich', 'code', 'preview', 'split'
    this.fontSize = 14;
    this.wordWrap = true;
    this.minimap = true;
    
    // AI and code intelligence
    this.aiAssistEnabled = true;
    this.codeCompletionEnabled = true;
    this.diagnosticsEnabled = true;
    this.formatOnSave = true;
    this.aiContext = [];
    
    // App generation and templates
    this.streamlitCode = '';
    this.currentApp = null;
    this.isGenerating = false;
    this.templateCache = new Map();
    
    // Live preview and testing
    this.previewUrl = null;
    this.isPreviewLive = false;
    this.previewMode = 'desktop'; // 'mobile', 'tablet', 'desktop'
    
    // Collaboration and sharing
    this.isCollaborating = false;
    this.collaborators = [];
    this.sharedSession = null;
    
    // Performance and debugging
    this.debugMode = false;
    this.performanceMetrics = {};
    this.testResults = null;
    
    // UI state
    this.panels = {
      explorer: true,
      output: true,
      terminal: false,
      debug: false,
      extensions: false
    };
    this.layout = 'standard'; // 'standard', 'zen', 'debug'
  }

  async initialize() {
    this.swissknife = this.desktop.swissknife;
    await this.loadConfiguration();
    await this.loadRecentFiles();
    await this.initializeProject();
    await this.loadMonacoEditor();
    await this.initializeAIServices();
  }

  async loadConfiguration() {
    try {
      const config = localStorage.getItem('vibecode-config');
      if (config) {
        const settings = JSON.parse(config);
        Object.assign(this, settings);
      }
    } catch (error) {
      console.warn('Failed to load configuration:', error);
    }
  }

  async initializeProject() {
    // Initialize with default project structure
    this.currentProject = {
      name: 'Streamlit Project',
      path: '/project',
      files: {
        'app.py': { type: 'python', content: this.getDefaultStreamlitCode() },
        'requirements.txt': { type: 'text', content: 'streamlit>=1.28.0\npandas>=1.5.0\nplotly>=5.0.0' },
        'README.md': { type: 'markdown', content: '# My Streamlit Application\n\nDescribe your app here.' }
      },
      settings: {
        python_version: '3.9',
        streamlit_version: '1.28.0'
      }
    };
  }

  async loadMonacoEditor() {
    // Load Monaco Editor from CDN if not already loaded
    if (!window.monaco) {
      await this.loadMonacoScript();
    }
  }

  async loadMonacoScript() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.monaco) {
        resolve();
        return;
      }

      // Load Monaco Editor
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
      script.onload = () => {
        window.require.config({ 
          paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }
        });
        window.require(['vs/editor/editor.main'], () => {
          this.configureMonaco();
          resolve();
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  configureMonaco() {
    // Configure Monaco for Streamlit development
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: (model, position) => {
        return this.getStreamlitCompletions(model, position);
      }
    });

    // Add Streamlit-specific snippets
    monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: () => ({
        suggestions: this.getStreamlitSnippets()
      })
    });

    // Configure diagnostics
    monaco.languages.onLanguage('python', () => {
      this.setupPythonLanguageFeatures();
    });
  }

  async initializeAIServices() {
    // Initialize AI-powered features
    this.aiContext = [];
    if (this.swissknife && this.aiAssistEnabled) {
      try {
        // Test AI connectivity
        await this.swissknife.chat({
          message: 'Hello, I\'m initializing VibeCode. Please respond with "ready" if you can assist with Streamlit development.',
          model: 'gpt-3.5-turbo'
        });
        console.log('AI services initialized successfully');
      } catch (error) {
        console.warn('AI services initialization failed:', error);
        this.aiAssistEnabled = false;
      }
    }
  }

  getDefaultStreamlitCode() {
    return `import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px

# Configure the Streamlit page
st.set_page_config(
    page_title="My Streamlit App",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Main title
st.title("🚀 Welcome to VibeCode!")
st.markdown("### AI-Powered Streamlit Development Environment")

# Sidebar
with st.sidebar:
    st.header("Settings")
    option = st.selectbox(
        "Choose a demo:",
        ["Data Visualization", "Machine Learning", "Interactive Widgets"]
    )

# Main content based on selection
if option == "Data Visualization":
    st.subheader("📊 Data Visualization Demo")
    
    # Generate sample data
    df = pd.DataFrame({
        'x': np.random.randn(100),
        'y': np.random.randn(100),
        'category': np.random.choice(['A', 'B', 'C'], 100)
    })
    
    # Create interactive plot
    fig = px.scatter(df, x='x', y='y', color='category', title="Interactive Scatter Plot")
    st.plotly_chart(fig, use_container_width=True)
    
    # Display data table
    with st.expander("View Raw Data"):
        st.dataframe(df)

elif option == "Machine Learning":
    st.subheader("🤖 Machine Learning Demo")
    st.info("Add your ML models and visualizations here!")
    
elif option == "Interactive Widgets":
    st.subheader("⚡ Interactive Widgets Demo")
    
    # Interactive widgets
    col1, col2 = st.columns(2)
    
    with col1:
        slider_val = st.slider("Select a value", 0, 100, 50)
        st.write(f"Slider value: {slider_val}")
        
    with col2:
        text_input = st.text_input("Enter some text", "Hello, World!")
        st.write(f"You entered: {text_input}")

# Footer
st.markdown("---")
st.markdown("Built with ❤️ using VibeCode - The AI-Powered Streamlit IDE")`;
  }

  async loadRecentFiles() {
    try {
      // Load recent files from storage
      const stored = localStorage.getItem('vibecode-recent-files');
      if (stored) {
        this.recentFiles = JSON.parse(stored);
      } else {
        this.recentFiles = [];
      }
    } catch (error) {
      console.warn('Failed to load recent files:', error);
      this.recentFiles = [];
    }
  }

  async render() {
    return `
      <div class="vibecode-container" data-theme="${this.theme}">
        <!-- Top Menu Bar -->
        <div class="vibecode-menubar">
          <div class="menu-section">
            <div class="menu-group">
              <button class="menu-btn" id="new-file-btn" title="New File (Ctrl+N)">
                <span class="icon">📄</span>
                <span class="label">New</span>
              </button>
              <button class="menu-btn" id="open-file-btn" title="Open File (Ctrl+O)">
                <span class="icon">📁</span>
                <span class="label">Open</span>
              </button>
              <button class="menu-btn" id="save-file-btn" title="Save File (Ctrl+S)" disabled>
                <span class="icon">💾</span>
                <span class="label">Save</span>
              </button>
            </div>
          </div>
          
          <div class="menu-section">
            <div class="editor-modes">
              <button class="mode-btn ${this.editorMode === 'code' ? 'active' : ''}" data-mode="code">
                <span class="icon">💻</span> Code
              </button>
              <button class="mode-btn ${this.editorMode === 'rich' ? 'active' : ''}" data-mode="rich">
                <span class="icon">📝</span> Rich Text
              </button>
              <button class="mode-btn ${this.editorMode === 'preview' ? 'active' : ''}" data-mode="preview">
                <span class="icon">👁️</span> Preview
              </button>
              <button class="mode-btn ${this.editorMode === 'split' ? 'active' : ''}" data-mode="split">
                <span class="icon">⚡</span> Split
              </button>
            </div>
          </div>
          
          <div class="menu-section">
            <div class="ai-controls">
              <button class="ai-btn ${this.aiAssistEnabled ? 'active' : ''}" id="ai-toggle-btn" title="Toggle AI Assistant">
                <span class="icon">🤖</span> AI
              </button>
              <button class="ai-btn" id="ai-generate-btn" title="Generate Streamlit App">
                <span class="icon">🎯</span> Generate
              </button>
              <button class="ai-btn" id="ai-optimize-btn" title="Optimize Code">
                <span class="icon">⚡</span> Optimize
              </button>
            </div>
          </div>
          
          <div class="menu-section">
            <div class="run-controls">
              <button class="run-btn primary" id="run-app-btn" title="Run Streamlit App (F5)">
                <span class="icon">▶️</span> Run
              </button>
              <button class="run-btn" id="debug-app-btn" title="Debug App">
                <span class="icon">🐛</span> Debug
              </button>
              <button class="run-btn" id="deploy-app-btn" title="Deploy App">
                <span class="icon">🚀</span> Deploy
              </button>
            </div>
          </div>
          
          <div class="menu-section">
            <div class="view-controls">
              <button class="view-btn ${this.panels.explorer ? 'active' : ''}" id="toggle-explorer" title="Explorer">
                <span class="icon">🗂️</span>
              </button>
              <button class="view-btn ${this.panels.output ? 'active' : ''}" id="toggle-output" title="Output">
                <span class="icon">📋</span>
              </button>
              <button class="view-btn ${this.panels.terminal ? 'active' : ''}" id="toggle-terminal" title="Terminal">
                <span class="icon">⚡</span>
              </button>
              <button class="view-btn" id="command-palette" title="Command Palette (Ctrl+Shift+P)">
                <span class="icon">⌘</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Main Layout -->
        <div class="vibecode-layout">
          <!-- Explorer Sidebar -->
          <div class="explorer-panel ${this.panels.explorer ? 'visible' : 'hidden'}">
            <div class="panel-header">
              <h3>📁 Explorer</h3>
              <div class="panel-actions">
                <button class="panel-action" id="new-folder-btn" title="New Folder">📁</button>
                <button class="panel-action" id="new-file-project-btn" title="New File">📄</button>
                <button class="panel-action" id="refresh-explorer" title="Refresh">🔄</button>
              </div>
            </div>
            
            <div class="explorer-content">
              <!-- Project Structure -->
              <div class="explorer-section">
                <div class="section-header">
                  <span class="section-icon">📂</span>
                  <span class="section-title">${this.currentProject?.name || 'No Project'}</span>
                  <button class="collapse-btn">▼</button>
                </div>
                <div class="file-tree" id="file-tree">
                  ${this.renderFileTree()}
                </div>
              </div>
              
              <!-- Recent Files -->
              <div class="explorer-section">
                <div class="section-header">
                  <span class="section-icon">🕒</span>
                  <span class="section-title">Recent Files</span>
                  <button class="collapse-btn">▼</button>
                </div>
                <div class="recent-files" id="recent-files">
                  ${this.renderRecentFiles()}
                </div>
              </div>
              
              <!-- Templates & Snippets -->
              <div class="explorer-section">
                <div class="section-header">
                  <span class="section-icon">📋</span>
                  <span class="section-title">Templates</span>
                  <button class="collapse-btn">▼</button>
                </div>
                <div class="templates-list" id="templates-list">
                  ${this.renderTemplatesList()}
                </div>
              </div>
            </div>
          </div>

          <!-- Main Editor Area -->
          <div class="editor-area">
            <!-- Tab Bar -->
            <div class="tab-bar">
              <div class="tabs-container" id="tabs-container">
                ${this.renderTabs()}
              </div>
              <div class="tab-actions">
                <button class="tab-action" id="split-editor" title="Split Editor">⚡</button>
                <button class="tab-action" id="close-all-tabs" title="Close All">✕</button>
              </div>
            </div>
            
            <!-- Editor Container -->
            <div class="editor-container">
              <!-- Monaco Code Editor -->
              <div class="monaco-editor-container" id="monaco-container" 
                   style="display: ${this.editorMode === 'code' || this.editorMode === 'split' ? 'block' : 'none'}">
                <div id="monaco-editor" class="monaco-editor"></div>
                
                <!-- Code Intelligence Overlay -->
                <div class="code-intelligence" id="code-intelligence">
                  <div class="intellisense-popup" id="intellisense-popup"></div>
                  <div class="error-squiggles" id="error-squiggles"></div>
                  <div class="code-actions" id="code-actions"></div>
                </div>
              </div>
              
              <!-- Rich Text Editor -->
              <div class="rich-editor-container" id="rich-editor-container"
                   style="display: ${this.editorMode === 'rich' ? 'block' : 'none'}">
                <div class="rich-toolbar">
                  ${this.renderRichToolbar()}
                </div>
                <div class="rich-editor" id="rich-editor" contenteditable="true">
                  ${this.getRichEditorContent()}
                </div>
              </div>
              
              <!-- Live Preview -->
              <div class="preview-container" id="preview-container"
                   style="display: ${this.editorMode === 'preview' || this.editorMode === 'split' ? 'block' : 'none'}">
                <div class="preview-toolbar">
                  <div class="preview-controls">
                    <button class="preview-btn ${this.previewMode === 'mobile' ? 'active' : ''}" data-mode="mobile">📱</button>
                    <button class="preview-btn ${this.previewMode === 'tablet' ? 'active' : ''}" data-mode="tablet">📲</button>
                    <button class="preview-btn ${this.previewMode === 'desktop' ? 'active' : ''}" data-mode="desktop">🖥️</button>
                  </div>
                  <div class="preview-actions">
                    <button class="preview-action" id="refresh-preview">🔄</button>
                    <button class="preview-action" id="open-external">🔗</button>
                    <button class="preview-action" id="share-preview">📤</button>
                  </div>
                </div>
                <div class="preview-frame-wrapper ${this.previewMode}">
                  <iframe id="preview-frame" class="preview-frame" src="about:blank"></iframe>
                  <div class="preview-overlay" id="preview-overlay">
                    <div class="loading-spinner">⏳ Loading preview...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bottom Panel -->
        <div class="bottom-panel ${this.panels.output || this.panels.terminal ? 'visible' : 'hidden'}">
          <div class="panel-tabs">
            <button class="panel-tab ${this.panels.output ? 'active' : ''}" data-panel="output">
              <span class="icon">📋</span> Output
            </button>
            <button class="panel-tab ${this.panels.terminal ? 'active' : ''}" data-panel="terminal">
              <span class="icon">⚡</span> Terminal
            </button>
            <button class="panel-tab" data-panel="problems">
              <span class="icon">⚠️</span> Problems <span class="badge" id="problems-count">0</span>
            </button>
            <button class="panel-tab" data-panel="debug">
              <span class="icon">🐛</span> Debug Console
            </button>
            <button class="panel-tab" data-panel="ai-chat">
              <span class="icon">🤖</span> AI Assistant
            </button>
          </div>
          
          <div class="panel-content">
            <!-- Output Panel -->
            <div class="panel-section ${this.panels.output ? 'active' : ''}" id="output-panel">
              <div class="output-content" id="output-content"></div>
            </div>
            
            <!-- Terminal Panel -->
            <div class="panel-section ${this.panels.terminal ? 'active' : ''}" id="terminal-panel">
              <div class="terminal-content" id="terminal-content"></div>
              <div class="terminal-input">
                <span class="prompt">$</span>
                <input type="text" id="terminal-input" placeholder="streamlit run app.py">
                <button id="terminal-send">▶️</button>
              </div>
            </div>
            
            <!-- Problems Panel -->
            <div class="panel-section" id="problems-panel">
              <div class="problems-list" id="problems-list"></div>
            </div>
            
            <!-- Debug Console -->
            <div class="panel-section" id="debug-panel">
              <div class="debug-content" id="debug-content"></div>
            </div>
            
            <!-- AI Chat Panel -->
            <div class="panel-section" id="ai-chat-panel">
              <div class="ai-chat-content" id="ai-chat-content"></div>
              <div class="ai-input-container">
                <textarea id="ai-input" placeholder="Ask me anything about Streamlit development..." rows="2"></textarea>
                <button id="ai-send">💬 Send</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Floating Elements -->
        ${this.renderFloatingElements()}
      </div>
    `;
  }

  setupEventListeners(window) {
    // File operations
    window.querySelector('#new-file-btn')?.addEventListener('click', () => this.newFile(window));
    window.querySelector('#open-file-btn')?.addEventListener('click', () => this.openFile(window));
    window.querySelector('#save-file-btn')?.addEventListener('click', () => this.saveFile(window));

    // Editor mode switching
    window.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchEditorMode(window, btn.dataset.mode));
    });

    // AI controls
    window.querySelector('#ai-toggle-btn')?.addEventListener('click', () => this.toggleAI(window));
    window.querySelector('#ai-generate-btn')?.addEventListener('click', () => this.showGenerationDialog(window));
    window.querySelector('#ai-optimize-btn')?.addEventListener('click', () => this.optimizeCode(window));

    // Run controls
    window.querySelector('#run-app-btn')?.addEventListener('click', () => this.runStreamlitApp(window));
    window.querySelector('#debug-app-btn')?.addEventListener('click', () => this.debugApp(window));
    window.querySelector('#deploy-app-btn')?.addEventListener('click', () => this.deployApp(window));

    // View controls
    window.querySelector('#toggle-explorer')?.addEventListener('click', () => this.togglePanel(window, 'explorer'));
    window.querySelector('#toggle-output')?.addEventListener('click', () => this.togglePanel(window, 'output'));
    window.querySelector('#toggle-terminal')?.addEventListener('click', () => this.togglePanel(window, 'terminal'));
    window.querySelector('#command-palette')?.addEventListener('click', () => this.showCommandPalette(window));

    // Explorer events
    this.setupExplorerEvents(window);
    
    // Tab events
    this.setupTabEvents(window);
    
    // Monaco editor events
    this.setupMonacoEvents(window);
    
    // Rich editor events
    this.setupRichEditorEvents(window);
    
    // Preview events
    this.setupPreviewEvents(window);
    
    // Panel events
    this.setupPanelEvents(window);
    
    // Floating dialogs events
    this.setupDialogEvents(window);
    
    // Keyboard shortcuts
    this.setupKeyboardShortcuts(window);
    
    // Collaboration events
    this.setupCollaborationEvents(window);
  }

  setupExplorerEvents(window) {
    // File tree events
    window.addEventListener('click', (e) => {
      if (e.target.closest('.tree-item')) {
        const item = e.target.closest('.tree-item');
        const fileName = item.dataset.file;
        if (fileName) {
          this.openFileFromTree(window, fileName);
        }
      }
    });

    // Recent files events
    window.addEventListener('click', (e) => {
      if (e.target.closest('.recent-file')) {
        const item = e.target.closest('.recent-file');
        const fileName = item.dataset.file;
        if (fileName) {
          this.openRecentFile(window, fileName);
        }
      }
    });

    // Template events
    window.addEventListener('click', (e) => {
      if (e.target.closest('.template-card')) {
        const card = e.target.closest('.template-card');
        const templateId = card.dataset.template;
        if (templateId) {
          this.loadTemplate(window, templateId);
        }
      }
    });

    // Explorer actions
    window.querySelector('#new-folder-btn')?.addEventListener('click', () => this.createNewFolder(window));
    window.querySelector('#new-file-project-btn')?.addEventListener('click', () => this.createNewFileInProject(window));
    window.querySelector('#refresh-explorer')?.addEventListener('click', () => this.refreshExplorer(window));
  }

  setupTabEvents(window) {
    window.addEventListener('click', (e) => {
      if (e.target.closest('.tab')) {
        const tab = e.target.closest('.tab');
        const tabIndex = parseInt(tab.dataset.tabIndex);
        
        if (e.target.classList.contains('tab-close')) {
          e.stopPropagation();
          this.closeTab(window, tabIndex);
        } else {
          this.switchToTab(window, tabIndex);
        }
      }
    });

    // Tab bar actions
    window.querySelector('#split-editor')?.addEventListener('click', () => this.splitEditor(window));
    window.querySelector('#close-all-tabs')?.addEventListener('click', () => this.closeAllTabs(window));
  }

  setupMonacoEvents(window) {
    // Monaco editor will be initialized after render
    // We'll set up events in the initializeMonacoEditor method
  }

  setupRichEditorEvents(window) {
    const richEditor = window.querySelector('#rich-editor');
    const richToolbar = window.querySelector('.rich-toolbar');
    
    if (richToolbar) {
      richToolbar.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action) {
          this.executeRichTextAction(window, action);
        }
      });
    }
    
    if (richEditor) {
      richEditor.addEventListener('input', () => this.onRichTextChange(window));
      richEditor.addEventListener('paste', (e) => this.handleRichTextPaste(window, e));
      richEditor.addEventListener('keydown', (e) => this.handleRichTextKeydown(window, e));
    }
  }

  setupPreviewEvents(window) {
    // Preview mode buttons
    window.querySelectorAll('.preview-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setPreviewMode(window, btn.dataset.mode);
      });
    });

    // Preview actions
    window.querySelector('#refresh-preview')?.addEventListener('click', () => this.refreshPreview(window));
    window.querySelector('#open-external')?.addEventListener('click', () => this.openExternalPreview(window));
    window.querySelector('#share-preview')?.addEventListener('click', () => this.sharePreview(window));
  }

  setupPanelEvents(window) {
    // Panel tabs
    window.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchBottomPanel(window, tab.dataset.panel);
      });
    });

    // Terminal input
    const terminalInput = window.querySelector('#terminal-input');
    const terminalSend = window.querySelector('#terminal-send');
    
    if (terminalInput) {
      terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.executeTerminalCommand(window, terminalInput.value);
          terminalInput.value = '';
        }
      });
    }
    
    if (terminalSend) {
      terminalSend.addEventListener('click', () => {
        this.executeTerminalCommand(window, terminalInput.value);
        terminalInput.value = '';
      });
    }

    // AI chat
    const aiInput = window.querySelector('#ai-input');
    const aiSend = window.querySelector('#ai-send');
    
    if (aiInput) {
      aiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.sendAIMessage(window, aiInput.value);
          aiInput.value = '';
        }
      });
    }
    
    if (aiSend) {
      aiSend.addEventListener('click', () => {
        this.sendAIMessage(window, aiInput.value);
        aiInput.value = '';
      });
    }
  }

  setupDialogEvents(window) {
    // Generation dialog
    window.querySelector('.close-dialog')?.addEventListener('click', () => {
      this.hideGenerationDialog(window);
    });

    // Settings panel
    window.querySelector('.close-settings')?.addEventListener('click', () => {
      this.hideSettingsPanel(window);
    });

    // Command palette
    const commandInput = window.querySelector('#command-input');
    if (commandInput) {
      commandInput.addEventListener('input', (e) => {
        this.filterCommands(window, e.target.value);
      });
      
      commandInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.hideCommandPalette(window);
        }
      });
    }
  }

  setupKeyboardShortcuts(window) {
    window.addEventListener('keydown', (e) => {
      // File operations
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        this.newFile(window);
      } else if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        this.openFile(window);
      } else if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        this.saveFile(window);
      }
      
      // Run operations
      else if (e.key === 'F5') {
        e.preventDefault();
        this.runStreamlitApp(window);
      }
      
      // AI operations
      else if (e.ctrlKey && e.key === ' ') {
        e.preventDefault();
        this.showAIAssistant(window);
      }
      
      // Command palette
      else if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        this.showCommandPalette(window);
      }
      
      // Panel toggles
      else if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        this.togglePanel(window, 'terminal');
      }
    });
  }

  setupCollaborationEvents(window) {
    // Collaboration will be implemented in future versions
    // This is a placeholder for real-time collaboration features
  }

  renderFileTree() {
    if (!this.currentProject?.files) {
      return '<div class="empty-tree">No project loaded</div>';
    }

    let html = '';
    for (const [fileName, fileInfo] of Object.entries(this.currentProject.files)) {
      const isActive = this.currentFile?.name === fileName;
      const icon = this.getFileIcon(fileName, fileInfo.type);
      
      html += `
        <div class="tree-item ${isActive ? 'active' : ''}" data-file="${fileName}">
          <span class="tree-icon">${icon}</span>
          <span class="tree-label">${fileName}</span>
          <div class="tree-actions">
            <button class="tree-action" title="Delete">🗑️</button>
          </div>
        </div>
      `;
    }
    return html;
  }

  renderRecentFiles() {
    if (this.recentFiles.length === 0) {
      return '<div class="empty-list">No recent files</div>';
    }

    return this.recentFiles.slice(0, 10).map(file => `
      <div class="recent-file" data-file="${file.name}">
        <span class="file-icon">${this.getFileIcon(file.name, file.type)}</span>
        <div class="file-info">
          <span class="file-name">${file.name}</span>
          <span class="file-path">${file.path || ''}</span>
        </div>
      </div>
    `).join('');
  }

  renderTemplatesList() {
    const templates = [
      { id: 'dashboard', name: 'Dashboard', icon: '📊', description: 'Interactive data dashboard' },
      { id: 'ml-model', name: 'ML Model', icon: '🤖', description: 'Machine learning application' },
      { id: 'data-viz', name: 'Data Visualization', icon: '📈', description: 'Advanced data visualization' },
      { id: 'chatbot', name: 'Chatbot', icon: '💬', description: 'AI-powered chatbot interface' },
      { id: 'file-upload', name: 'File Upload', icon: '📤', description: 'File processing application' },
      { id: 'multipage', name: 'Multi-page App', icon: '📄', description: 'Multi-page application' },
      { id: 'api-dashboard', name: 'API Dashboard', icon: '🔌', description: 'REST API monitoring dashboard' },
      { id: 'real-time', name: 'Real-time Data', icon: '⚡', description: 'Live data streaming app' }
    ];

    return templates.map(template => `
      <div class="template-card" data-template="${template.id}">
        <span class="template-icon">${template.icon}</span>
        <div class="template-info">
          <span class="template-name">${template.name}</span>
          <span class="template-description">${template.description}</span>
        </div>
      </div>
    `).join('');
  }

  renderTabs() {
    if (this.openTabs.length === 0) {
      return '<div class="no-tabs">No files open</div>';
    }

    return this.openTabs.map((tab, index) => {
      const isActive = index === this.activeTabIndex;
      const icon = this.getFileIcon(tab.name, tab.type);
      const isModified = tab.modified;
      
      return `
        <div class="tab ${isActive ? 'active' : ''}" data-tab-index="${index}">
          <span class="tab-icon">${icon}</span>
          <span class="tab-label">${tab.name}</span>
          ${isModified ? '<span class="tab-modified">●</span>' : ''}
          <button class="tab-close" title="Close">✕</button>
        </div>
      `;
    }).join('');
  }

  renderRichToolbar() {
    return `
      <div class="rich-toolbar-section">
        <button class="rich-btn" data-action="bold" title="Bold (Ctrl+B)"><b>B</b></button>
        <button class="rich-btn" data-action="italic" title="Italic (Ctrl+I)"><i>I</i></button>
        <button class="rich-btn" data-action="underline" title="Underline (Ctrl+U)"><u>U</u></button>
        <button class="rich-btn" data-action="strikethrough" title="Strikethrough"><s>S</s></button>
      </div>
      
      <div class="rich-toolbar-section">
        <button class="rich-btn" data-action="heading1" title="Heading 1">H1</button>
        <button class="rich-btn" data-action="heading2" title="Heading 2">H2</button>
        <button class="rich-btn" data-action="heading3" title="Heading 3">H3</button>
      </div>
      
      <div class="rich-toolbar-section">
        <button class="rich-btn" data-action="bulletList" title="Bullet List">• List</button>
        <button class="rich-btn" data-action="orderedList" title="Numbered List">1. List</button>
        <button class="rich-btn" data-action="blockquote" title="Quote">" Quote</button>
      </div>
      
      <div class="rich-toolbar-section">
        <button class="rich-btn" data-action="code" title="Inline Code">&lt;/&gt;</button>
        <button class="rich-btn" data-action="codeBlock" title="Code Block">{ }</button>
        <button class="rich-btn" data-action="link" title="Link">🔗</button>
        <button class="rich-btn" data-action="image" title="Image">🖼️</button>
      </div>
      
      <div class="rich-toolbar-section">
        <button class="rich-btn ai-btn" data-action="ai-complete" title="AI Complete">🤖 Complete</button>
        <button class="rich-btn ai-btn" data-action="ai-streamlit" title="Convert to Streamlit">🎯 To App</button>
        <button class="rich-btn ai-btn" data-action="ai-improve" title="Improve Writing">✨ Improve</button>
      </div>
    `;
  }

  getRichEditorContent() {
    return `
      <h1>Welcome to VibeCode! 🎯</h1>
      <p>Create amazing Streamlit applications with AI assistance.</p>
      
      <h2>Getting Started</h2>
      <p>Describe your application idea here, and I'll help you build it step by step.</p>
      
      <blockquote>
        <p><strong>Example:</strong> "Create a real-time stock market dashboard with interactive charts, 
        portfolio tracking, and predictive analytics using machine learning."</p>
      </blockquote>
      
      <h3>Features</h3>
      <ul>
        <li>🤖 <strong>AI-Powered Code Generation</strong> - Describe your app and get working code</li>
        <li>📊 <strong>Rich Template Library</strong> - Start with professional templates</li>
        <li>⚡ <strong>Live Preview</strong> - See your changes instantly</li>
        <li>🔧 <strong>Smart Code Completion</strong> - Context-aware suggestions</li>
        <li>🐛 <strong>Intelligent Debugging</strong> - AI-assisted error resolution</li>
      </ul>
      
      <p>Click the <strong>🎯 To App</strong> button above to convert this description into working Streamlit code!</p>
    `;
  }

  renderFloatingElements() {
    return `
      <!-- Command Palette -->
      <div class="command-palette" id="command-palette" style="display: none;">
        <div class="palette-input">
          <input type="text" id="command-input" placeholder="Type a command...">
        </div>
        <div class="palette-results" id="palette-results"></div>
      </div>
      
      <!-- AI Code Assistant -->
      <div class="ai-assistant-float" id="ai-assistant-float" style="display: none;">
        <div class="assistant-header">
          <span class="assistant-title">🤖 AI Assistant</span>
          <button class="close-assistant">✕</button>
        </div>
        <div class="assistant-content">
          <div class="suggestions" id="ai-suggestions"></div>
          <div class="quick-actions">
            <button class="quick-action" data-action="explain">Explain Code</button>
            <button class="quick-action" data-action="optimize">Optimize</button>
            <button class="quick-action" data-action="debug">Debug</button>
            <button class="quick-action" data-action="test">Add Tests</button>
          </div>
        </div>
      </div>
      
      <!-- Streamlit Generation Dialog -->
      <div class="streamlit-dialog" id="streamlit-dialog" style="display: none;">
        <div class="dialog-backdrop"></div>
        <div class="dialog-content">
          <div class="dialog-header">
            <h3>🎯 AI Streamlit Generator</h3>
            <button class="close-dialog">✕</button>
          </div>
          <div class="dialog-body">
            ${this.renderGenerationSteps()}
          </div>
        </div>
      </div>
      
      <!-- Settings Panel -->
      <div class="settings-panel" id="settings-panel" style="display: none;">
        <div class="settings-header">
          <h3>⚙️ VibeCode Settings</h3>
          <button class="close-settings">✕</button>
        </div>
        <div class="settings-content">
          ${this.renderSettingsContent()}
        </div>
      </div>
    `;
  }

  renderGenerationSteps() {
    return `
      <div class="generation-steps">
        <div class="step active" id="step-describe">
          <h4>1. Describe Your Application</h4>
          <textarea id="app-description" placeholder="Describe your Streamlit app in detail...
          
Examples:
• 'A financial dashboard showing stock prices, portfolio performance, and market analysis'
• 'A machine learning app for image classification with drag-and-drop upload'
• 'A data visualization tool for sales analytics with interactive charts and filters'
          
Be specific about:
- What data you'll work with
- What visualizations you need
- What user interactions you want
- Any specific libraries or features" rows="10"></textarea>
          
          <div class="step-actions">
            <button class="btn primary" id="analyze-description">🔍 Analyze & Continue</button>
          </div>
        </div>
        
        <div class="step" id="step-configure">
          <h4>2. Configure Components</h4>
          <div class="config-grid">
            <div class="config-section">
              <h5>📊 Data Sources</h5>
              <div class="config-options" id="data-sources"></div>
            </div>
            <div class="config-section">
              <h5>📈 Visualizations</h5>
              <div class="config-options" id="visualizations"></div>
            </div>
            <div class="config-section">
              <h5>⌨️ User Inputs</h5>
              <div class="config-options" id="user-inputs"></div>
            </div>
            <div class="config-section">
              <h5>🧩 Features</h5>
              <div class="config-options" id="features"></div>
            </div>
          </div>
          
          <div class="step-actions">
            <button class="btn secondary" id="back-to-describe">← Back</button>
            <button class="btn primary" id="generate-code">⚡ Generate Code</button>
          </div>
        </div>
        
        <div class="step" id="step-review">
          <h4>3. Review & Customize</h4>
          <div class="code-preview-container">
            <div class="preview-tabs">
              <button class="preview-tab active" data-file="app.py">📄 app.py</button>
              <button class="preview-tab" data-file="requirements.txt">📦 requirements.txt</button>
              <button class="preview-tab" data-file="README.md">📝 README.md</button>
            </div>
            <div class="code-preview" id="generated-code-preview"></div>
          </div>
          
          <div class="customization-options">
            <h5>Customization Options</h5>
            <div class="custom-controls">
              <label><input type="checkbox" id="add-styling"> Enhanced Styling</label>
              <label><input type="checkbox" id="add-caching"> Smart Caching</label>
              <label><input type="checkbox" id="add-auth"> User Authentication</label>
              <label><input type="checkbox" id="add-deploy"> Deployment Config</label>
            </div>
          </div>
          
          <div class="step-actions">
            <button class="btn secondary" id="back-to-configure">← Back</button>
            <button class="btn success" id="accept-code">✅ Create Application</button>
            <button class="btn secondary" id="regenerate-code">🔄 Regenerate</button>
          </div>
        </div>
      </div>
    `;
  }

  renderSettingsContent() {
    return `
      <div class="settings-tabs">
        <button class="settings-tab active" data-tab="editor">Editor</button>
        <button class="settings-tab" data-tab="ai">AI Assistant</button>
        <button class="settings-tab" data-tab="theme">Theme</button>
        <button class="settings-tab" data-tab="keybindings">Keybindings</button>
      </div>
      
      <div class="settings-sections">
        <div class="settings-section active" id="editor-settings">
          <h4>Editor Settings</h4>
          <div class="setting-item">
            <label>Font Size</label>
            <input type="range" id="font-size" min="10" max="24" value="${this.fontSize}">
            <span>${this.fontSize}px</span>
          </div>
          <div class="setting-item">
            <label>Word Wrap</label>
            <input type="checkbox" id="word-wrap" ${this.wordWrap ? 'checked' : ''}>
          </div>
          <div class="setting-item">
            <label>Show Minimap</label>
            <input type="checkbox" id="minimap" ${this.minimap ? 'checked' : ''}>
          </div>
          <div class="setting-item">
            <label>Format on Save</label>
            <input type="checkbox" id="format-on-save" ${this.formatOnSave ? 'checked' : ''}>
          </div>
        </div>
        
        <div class="settings-section" id="ai-settings">
          <h4>AI Assistant Settings</h4>
          <div class="setting-item">
            <label>Enable AI Assistance</label>
            <input type="checkbox" id="ai-enabled" ${this.aiAssistEnabled ? 'checked' : ''}>
          </div>
          <div class="setting-item">
            <label>Code Completion</label>
            <input type="checkbox" id="code-completion" ${this.codeCompletionEnabled ? 'checked' : ''}>
          </div>
          <div class="setting-item">
            <label>Real-time Diagnostics</label>
            <input type="checkbox" id="diagnostics" ${this.diagnosticsEnabled ? 'checked' : ''}>
          </div>
        </div>
        
        <div class="settings-section" id="theme-settings">
          <h4>Theme Settings</h4>
          <div class="theme-grid">
            <div class="theme-option ${this.theme === 'vs-dark' ? 'active' : ''}" data-theme="vs-dark">
              <div class="theme-preview dark"></div>
              <span>Dark</span>
            </div>
            <div class="theme-option ${this.theme === 'vs-light' ? 'active' : ''}" data-theme="vs-light">
              <div class="theme-preview light"></div>
              <span>Light</span>
            </div>
            <div class="theme-option ${this.theme === 'hc-black' ? 'active' : ''}" data-theme="hc-black">
              <div class="theme-preview high-contrast"></div>
              <span>High Contrast</span>
            </div>
          </div>
        </div>
        
        <div class="settings-section" id="keybindings-settings">
          <h4>Keyboard Shortcuts</h4>
          <div class="keybindings-list">
            <div class="keybinding">
              <span>New File</span>
              <kbd>Ctrl+N</kbd>
            </div>
            <div class="keybinding">
              <span>Open File</span>
              <kbd>Ctrl+O</kbd>
            </div>
            <div class="keybinding">
              <span>Save File</span>
              <kbd>Ctrl+S</kbd>
            </div>
            <div class="keybinding">
              <span>Run App</span>
              <kbd>F5</kbd>
            </div>
            <div class="keybinding">
              <span>Command Palette</span>
              <kbd>Ctrl+Shift+P</kbd>
            </div>
            <div class="keybinding">
              <span>AI Assistant</span>
              <kbd>Ctrl+Space</kbd>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getFileIcon(fileName, fileType) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const icons = {
      'py': '🐍',
      'txt': '📝',
      'md': '📄',
      'json': '📋',
      'yaml': '⚙️',
      'yml': '⚙️',
      'css': '🎨',
      'html': '🌐',
      'js': '📜',
      'ts': '📘',
      'requirements': '📦',
      'dockerfile': '🐳',
      'gitignore': '🙈'
    };
    
    return icons[extension] || icons[fileType] || '📄';
  }

  async initializeMonacoEditor(window) {
    const container = window.querySelector('#monaco-editor');
    if (!container || !window.monaco) return;

    // Create Monaco editor instance
    this.monacoEditor = window.monaco.editor.create(container, {
      value: this.getActiveFileContent(),
      language: 'python',
      theme: this.theme,
      fontSize: this.fontSize,
      wordWrap: this.wordWrap ? 'on' : 'off',
      minimap: { enabled: this.minimap },
      automaticLayout: true,
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: 'on',
      tabCompletion: 'on',
      parameterHints: { enabled: true },
      quickSuggestions: { other: true, comments: true, strings: true },
      folding: true,
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      scrollBeyondLastLine: false,
      contextmenu: true,
      formatOnType: true,
      formatOnPaste: true,
      dragAndDrop: true,
      links: true,
      find: {
        addExtraSpaceOnTop: false,
        autoFindInSelection: 'never',
        seedSearchStringFromSelection: 'always'
      }
    });

    // Set up editor events
    this.monacoEditor.onDidChangeModelContent(() => {
      this.onCodeChange(window);
    });

    this.monacoEditor.onDidChangeCursorPosition((e) => {
      this.updateCursorPosition(window, e.position);
    });

    this.monacoEditor.onDidFocusEditorText(() => {
      this.onEditorFocus(window);
    });

    // Set up AI-powered features
    this.setupCodeIntelligence(window);
    this.setupStreamlitIntegration(window);
    
    // Add custom actions
    this.addMonacoActions(window);
  }

  setupCodeIntelligence(window) {
    if (!this.monacoEditor || !this.aiAssistEnabled) return;

    // Custom completion provider for Streamlit
    const streamlitProvider = window.monaco.languages.registerCompletionItemProvider('python', {
      provideCompletionItems: async (model, position) => {
        const word = model.getWordUntilPosition(position);
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };

        // Get context-aware suggestions
        const suggestions = await this.getAICompletions(window, model, position);
        
        return {
          suggestions: [
            ...this.getStreamlitCompletions(range),
            ...suggestions
          ]
        };
      }
    });

    // Hover provider for documentation
    const hoverProvider = window.monaco.languages.registerHoverProvider('python', {
      provideHover: async (model, position) => {
        const word = model.getWordAtPosition(position);
        if (!word) return;

        const documentation = await this.getDocumentation(window, word.word);
        if (documentation) {
          return {
            range: new window.monaco.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            ),
            contents: [
              { value: documentation }
            ]
          };
        }
      }
    });

    // Diagnostics provider
    this.setupDiagnostics(window);
  }

  getStreamlitCompletions(range) {
    const completions = [
      // Basic Streamlit functions
      {
        label: 'st.title',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.title("${1:My App Title}")',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a title',
        range: range
      },
      {
        label: 'st.header',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.header("${1:Header Text}")',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a header',
        range: range
      },
      {
        label: 'st.subheader',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.subheader("${1:Subheader Text}")',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a subheader',
        range: range
      },
      {
        label: 'st.write',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.write("${1:Text to display}")',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Write text or objects to the app',
        range: range
      },
      
      // Input widgets
      {
        label: 'st.button',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'if st.button("${1:Click me}"):\n\t${2:# Do something}',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a button widget',
        range: range
      },
      {
        label: 'st.selectbox',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.selectbox("${1:Choose an option}", [${2:"Option 1", "Option 2"}])',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a select widget',
        range: range
      },
      {
        label: 'st.slider',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.slider("${1:Select a value}", ${2:0}, ${3:100}, ${4:50})',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a slider widget',
        range: range
      },
      {
        label: 'st.text_input',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.text_input("${1:Enter text}", "${2:Default value}")',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a text input widget',
        range: range
      },
      
      // Charts and visualization
      {
        label: 'st.line_chart',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.line_chart(${1:data})',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a line chart',
        range: range
      },
      {
        label: 'st.bar_chart',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.bar_chart(${1:data})',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a bar chart',
        range: range
      },
      {
        label: 'st.plotly_chart',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.plotly_chart(${1:fig}, use_container_width=True)',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a Plotly chart',
        range: range
      },
      
      // Layout
      {
        label: 'st.columns',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'col1, col2 = st.columns(${1:2})\n\nwith col1:\n\t${2:# Column 1 content}\n\nwith col2:\n\t${3:# Column 2 content}',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create columns layout',
        range: range
      },
      {
        label: 'st.expander',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'with st.expander("${1:Expand to see more}"):\n\t${2:# Expandable content}',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Create an expandable container',
        range: range
      },
      {
        label: 'st.sidebar',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'with st.sidebar:\n\t${1:# Sidebar content}',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Add content to sidebar',
        range: range
      },
      
      // Data display
      {
        label: 'st.dataframe',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.dataframe(${1:df})',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a dataframe as a table',
        range: range
      },
      {
        label: 'st.table',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.table(${1:data})',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a static table',
        range: range
      },
      {
        label: 'st.metric',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.metric("${1:Metric Name}", ${2:value}, ${3:delta})',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a metric with optional delta',
        range: range
      },
      
      // Status elements
      {
        label: 'st.success',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.success("${1:Success message}")',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a success message',
        range: range
      },
      {
        label: 'st.info',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.info("${1:Info message}")',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display an info message',
        range: range
      },
      {
        label: 'st.warning',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.warning("${1:Warning message}")',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display a warning message',
        range: range
      },
      {
        label: 'st.error',
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertText: 'st.error("${1:Error message}")',
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: 'Display an error message',
        range: range
      }
    ];

    return completions;
  }

  async getAICompletions(window, model, position) {
    if (!this.aiAssistEnabled || !this.swissknife) return [];

    try {
      const textBeforeCursor = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      const suggestions = await this.swissknife.chat({
        message: `Provide code completion suggestions for Streamlit development. Context:\n${textBeforeCursor}\n\nReturn only a JSON array of completion objects with label, insertText, and documentation properties.`,
        model: 'gpt-3.5-turbo'
      });

      return JSON.parse(suggestions.message || '[]').map(suggestion => ({
        ...suggestion,
        kind: window.monaco.languages.CompletionItemKind.Function,
        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range: {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: position.column,
          endColumn: position.column
        }
      }));
    } catch (error) {
      console.warn('AI completion failed:', error);
      return [];
    }
  }

  async getDocumentation(window, word) {
    if (!this.aiAssistEnabled || !this.swissknife) return null;

    try {
      const response = await this.swissknife.chat({
        message: `Provide brief documentation for the Streamlit function or Python keyword: "${word}". Return only the documentation text, no extra formatting.`,
        model: 'gpt-3.5-turbo'
      });

      return response.message;
    } catch (error) {
      console.warn('Documentation lookup failed:', error);
      return null;
    }
  }

  setupDiagnostics(window) {
    if (!this.diagnosticsEnabled) return;

    // Debounced diagnostics
    let diagnosticsTimeout;
    
    this.monacoEditor.onDidChangeModelContent(() => {
      clearTimeout(diagnosticsTimeout);
      diagnosticsTimeout = setTimeout(() => {
        this.runDiagnostics(window);
      }, 1000);
    });
  }

  async runDiagnostics(window) {
    if (!this.monacoEditor || !this.aiAssistEnabled) return;

    const model = this.monacoEditor.getModel();
    const code = model.getValue();

    try {
      const response = await this.swissknife.chat({
        message: `Analyze this Streamlit code for potential issues and return a JSON array of diagnostics with line, column, severity, and message properties:\n\n${code}`,
        model: 'gpt-3.5-turbo'
      });

      const diagnostics = JSON.parse(response.message || '[]');
      
      const markers = diagnostics.map(diag => ({
        startLineNumber: diag.line,
        startColumn: diag.column,
        endLineNumber: diag.line,
        endColumn: diag.column + 10,
        message: diag.message,
        severity: this.getSeverityLevel(diag.severity)
      }));

      window.monaco.editor.setModelMarkers(model, 'ai-diagnostics', markers);
      this.updateProblemsPanel(window, diagnostics);
      
    } catch (error) {
      console.warn('Diagnostics failed:', error);
    }
  }

  getSeverityLevel(severity) {
    switch (severity?.toLowerCase()) {
      case 'error': return window.monaco.MarkerSeverity.Error;
      case 'warning': return window.monaco.MarkerSeverity.Warning;
      case 'info': return window.monaco.MarkerSeverity.Info;
      default: return window.monaco.MarkerSeverity.Hint;
    }
  }

  addMonacoActions(window) {
    // AI-powered actions
    this.monacoEditor.addAction({
      id: 'ai-explain-code',
      label: 'AI: Explain Code',
      keybindings: [window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KeyE],
      run: () => this.explainSelectedCode(window)
    });

    this.monacoEditor.addAction({
      id: 'ai-optimize-code',
      label: 'AI: Optimize Code',
      keybindings: [window.monaco.KeyMod.CtrlCmd | window.monaco.KeyMod.Shift | window.monaco.KeyCode.KeyO],
      run: () => this.optimizeSelectedCode(window)
    });

    this.monacoEditor.addAction({
      id: 'ai-generate-docstring',
      label: 'AI: Generate Docstring',
      keybindings: [window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.KeyD],
      run: () => this.generateDocstring(window)
    });

    this.monacoEditor.addAction({
      id: 'run-streamlit',
      label: 'Run Streamlit App',
      keybindings: [window.monaco.KeyCode.F5],
      run: () => this.runStreamlitApp(window)
    });

    this.monacoEditor.addAction({
      id: 'format-code',
      label: 'Format Code',
      keybindings: [window.monaco.KeyMod.CtrlCmd | window.monaco.KeyMod.Shift | window.monaco.KeyCode.KeyF],
      run: () => this.formatCode(window)
    });
  }

  switchEditorMode(window, mode) {
    this.editorMode = mode;
    
    // Update UI
    window.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Show/hide appropriate editors
    const monacoContainer = window.querySelector('.monaco-editor-container');
    const richContainer = window.querySelector('.rich-editor-container');
    const previewContainer = window.querySelector('.preview-container');
    
    if (monacoContainer) monacoContainer.style.display = 'none';
    if (richContainer) richContainer.style.display = 'none';
    if (previewContainer) previewContainer.style.display = 'none';
    
    switch (mode) {
      case 'code':
        if (monacoContainer) monacoContainer.style.display = 'block';
        if (!this.monacoEditor) {
          this.initializeMonacoEditor(window);
        } else {
          this.monacoEditor.layout();
        }
        break;
        
      case 'rich':
        if (richContainer) richContainer.style.display = 'block';
        break;
        
      case 'preview':
        if (previewContainer) previewContainer.style.display = 'block';
        this.refreshPreview(window);
        break;
        
      case 'split':
        if (monacoContainer) {
          monacoContainer.style.display = 'block';
          monacoContainer.style.width = '50%';
        }
        if (previewContainer) {
          previewContainer.style.display = 'block';
          previewContainer.style.width = '50%';
        }
        if (!this.monacoEditor) {
          this.initializeMonacoEditor(window);
        } else {
          this.monacoEditor.layout();
        }
        this.refreshPreview(window);
        break;
    }
    
    this.saveConfiguration();
  }

  setupRichTextEditor(window) {
    const richEditor = window.querySelector('#rich-editor');
    const toolbar = window.querySelector('.rich-toolbar');
    
    // Rich text toolbar actions
    toolbar.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (action) {
        this.executeRichTextAction(window, action);
      }
    });
    
    // Content change detection
    richEditor.addEventListener('input', () => {
      this.onRichTextChange(window);
    });
    
    // Paste handling for rich content
    richEditor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    });
  }

  executeRichTextAction(window, action) {
    const richEditor = window.querySelector('#rich-editor');
    richEditor.focus();
    
    switch (action) {
      case 'bold':
        document.execCommand('bold');
        break;
      case 'italic':
        document.execCommand('italic');
        break;
      case 'underline':
        document.execCommand('underline');
        break;
      case 'strikethrough':
        document.execCommand('strikeThrough');
        break;
      case 'heading1':
        this.insertHeading(window, 1);
        break;
      case 'heading2':
        this.insertHeading(window, 2);
        break;
      case 'heading3':
        this.insertHeading(window, 3);
        break;
      case 'bulletList':
        document.execCommand('insertUnorderedList');
        break;
      case 'orderedList':
        document.execCommand('insertOrderedList');
        break;
      case 'blockquote':
        this.insertBlockquote(window);
        break;
      case 'code':
        this.insertInlineCode(window);
        break;
      case 'codeBlock':
        this.insertCodeBlock(window);
        break;
      case 'link':
        this.insertLink(window);
        break;
      case 'image':
        this.insertImage(window);
        break;
      case 'ai-complete':
        this.aiCompleteText(window);
        break;
      case 'ai-streamlit':
        this.convertToStreamlit(window);
        break;
    }
  }

  insertHeading(window, level) {
    document.execCommand('formatBlock', false, `h${level}`);
  }

  insertBlockquote(window) {
    document.execCommand('formatBlock', false, 'blockquote');
  }

  insertInlineCode(window) {
    const selection = document.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const code = document.createElement('code');
      code.style.background = '#f0f0f0';
      code.style.padding = '2px 4px';
      code.style.borderRadius = '3px';
      code.style.fontFamily = 'monospace';
      try {
        range.surroundContents(code);
      } catch (e) {
        // If surroundContents fails, insert the code element
        const content = range.extractContents();
        code.appendChild(content);
        range.insertNode(code);
      }
    }
  }

  insertCodeBlock(window) {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.style.display = 'block';
    code.style.background = '#2d3748';
    code.style.color = '#e2e8f0';
    code.style.padding = '1rem';
    code.style.borderRadius = '0.5rem';
    code.style.fontFamily = 'monospace';
    code.textContent = 'Enter your code here...';
    pre.appendChild(code);
    
    const selection = document.getSelection();
    if (selection.rangeCount > 0) {
      selection.getRangeAt(0).insertNode(pre);
    }
  }

  insertLink(window) {
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
    }
  }

  insertImage(window) {
    const url = prompt('Enter image URL:');
    if (url) {
      document.execCommand('insertImage', false, url);
    }
  }

  showStreamlitDialog(window) {
    const dialog = window.querySelector('#streamlit-dialog');
    dialog.style.display = 'block';
    this.resetStreamlitDialog(window);
  }

  resetStreamlitDialog(window) {
    // Reset to first step
    window.querySelectorAll('.generation-step').forEach(step => step.classList.remove('active'));
    window.querySelector('#step-describe').classList.add('active');
    
    // Clear previous content
    window.querySelector('#app-description').value = '';
    window.querySelector('#generated-code-preview').textContent = '';
  }

  setupStreamlitDialog(window) {
    // Close dialog
    window.querySelector('#close-dialog').addEventListener('click', () => {
      window.querySelector('#streamlit-dialog').style.display = 'none';
    });
    
    // Step navigation
    window.querySelector('#analyze-description').addEventListener('click', () => this.analyzeDescription(window));
    window.querySelector('#back-to-describe').addEventListener('click', () => this.goToStep(window, 'describe'));
    window.querySelector('#generate-code').addEventListener('click', () => this.generateStreamlitCode(window));
    window.querySelector('#back-to-configure').addEventListener('click', () => this.goToStep(window, 'configure'));
    window.querySelector('#accept-code').addEventListener('click', () => this.acceptGeneratedCode(window));
    window.querySelector('#regenerate-code').addEventListener('click', () => this.regenerateCode(window));
  }

  async analyzeDescription(window) {
    const description = window.querySelector('#app-description').value.trim();
    if (!description) {
      this.desktop.showNotification('Please enter a description for your app', 'warning');
      return;
    }
    
    try {
      this.setGenerationLoading(window, true);
      
      // Use AI to analyze the description and suggest components
      const analysis = await this.swissknife.chat({
        message: `Analyze this Streamlit app description and suggest appropriate components in JSON format:

Description: "${description}"

Please respond with a JSON object containing:
{
  "dataSources": ["list", "of", "suggested", "data", "sources"],
  "visualizations": ["list", "of", "chart", "types"],
  "userInputs": ["list", "of", "input", "widgets"],
  "libraries": ["required", "python", "libraries"],
  "complexity": "simple|medium|complex"
}`,
        model: 'gpt-4'
      });
      
      const suggestions = JSON.parse(analysis.message);
      this.populateConfigurationStep(window, suggestions);
      this.goToStep(window, 'configure');
      
    } catch (error) {
      this.desktop.showNotification('Failed to analyze description: ' + error.message, 'error');
    } finally {
      this.setGenerationLoading(window, false);
    }
  }

  populateConfigurationStep(window, suggestions) {
    // Populate data sources
    const dataSourcesContainer = window.querySelector('#data-sources');
    dataSourcesContainer.innerHTML = '';
    suggestions.dataSources.forEach(source => {
      const option = document.createElement('label');
      option.innerHTML = `<input type="checkbox" value="${source}" checked> ${source}`;
      dataSourcesContainer.appendChild(option);
    });
    
    // Populate visualizations
    const visualizationsContainer = window.querySelector('#visualizations');
    visualizationsContainer.innerHTML = '';
    suggestions.visualizations.forEach(viz => {
      const option = document.createElement('label');
      option.innerHTML = `<input type="checkbox" value="${viz}" checked> ${viz}`;
      visualizationsContainer.appendChild(option);
    });
    
    // Populate user inputs
    const userInputsContainer = window.querySelector('#user-inputs');
    userInputsContainer.innerHTML = '';
    suggestions.userInputs.forEach(input => {
      const option = document.createElement('label');
      option.innerHTML = `<input type="checkbox" value="${input}" checked> ${input}`;
      userInputsContainer.appendChild(option);
    });
  }

  async generateStreamlitCode(window) {
    try {
      this.setGenerationLoading(window, true);
      
      const description = window.querySelector('#app-description').value;
      const selectedComponents = this.getSelectedComponents(window);
      
      const codePrompt = `Generate a complete Streamlit Python application based on this description and components:

Description: "${description}"

Selected Components:
- Data Sources: ${selectedComponents.dataSources.join(', ')}
- Visualizations: ${selectedComponents.visualizations.join(', ')}
- User Inputs: ${selectedComponents.userInputs.join(', ')}

Requirements:
1. Create a complete, runnable Streamlit app
2. Include proper imports and setup
3. Add comments explaining each section
4. Use modern Streamlit features (columns, expander, etc.)
5. Include error handling
6. Make it visually appealing with proper layout
7. Add sample data if needed

Generate only the Python code, no explanations.`;

      const response = await this.swissknife.chat({
        message: codePrompt,
        model: 'gpt-4'
      });
      
      let generatedCode = response.message;
      
      // Clean up the response to extract just the code
      if (generatedCode.includes('```python')) {
        generatedCode = generatedCode.split('```python')[1].split('```')[0];
      } else if (generatedCode.includes('```')) {
        generatedCode = generatedCode.split('```')[1].split('```')[0];
      }
      
      this.streamlitCode = generatedCode.trim();
      window.querySelector('#generated-code-preview').textContent = this.streamlitCode;
      this.goToStep(window, 'review');
      
    } catch (error) {
      this.desktop.showNotification('Failed to generate code: ' + error.message, 'error');
    } finally {
      this.setGenerationLoading(window, false);
    }
  }

  getSelectedComponents(window) {
    const getCheckedValues = (container) => {
      return Array.from(container.querySelectorAll('input:checked')).map(input => input.value);
    };
    
    return {
      dataSources: getCheckedValues(window.querySelector('#data-sources')),
      visualizations: getCheckedValues(window.querySelector('#visualizations')),
      userInputs: getCheckedValues(window.querySelector('#user-inputs'))
    };
  }

  acceptGeneratedCode(window) {
    const codeEditor = window.querySelector('#code-editor');
    codeEditor.value = this.streamlitCode;
    this.updateLineNumbers(window);
    this.switchMode(window, 'code');
    window.querySelector('#streamlit-dialog').style.display = 'none';
    window.querySelector('#preview-streamlit-btn').disabled = false;
    window.querySelector('#deploy-streamlit-btn').disabled = false;
    this.desktop.showNotification('Streamlit code inserted successfully!', 'success');
  }

  goToStep(window, stepName) {
    window.querySelectorAll('.generation-step').forEach(step => step.classList.remove('active'));
    window.querySelector(`#step-${stepName}`).classList.add('active');
  }

  setGenerationLoading(window, isLoading) {
    const buttons = window.querySelectorAll('#streamlit-dialog button');
    buttons.forEach(btn => btn.disabled = isLoading);
    
    if (isLoading) {
      window.querySelector('#streamlit-dialog').style.cursor = 'wait';
    } else {
      window.querySelector('#streamlit-dialog').style.cursor = 'default';
    }
  }

  async convertToStreamlit(window) {
    const richEditor = window.querySelector('#rich-editor');
    const content = richEditor.innerText || richEditor.textContent;
    
    if (!content.trim()) {
      this.desktop.showNotification('No content to convert', 'warning');
      return;
    }
    
    try {
      const response = await this.swissknife.chat({
        message: `Convert this text description into a Streamlit Python application:

"${content}"

Generate a complete, runnable Streamlit app that implements the described functionality. Include proper imports, layout, and comments.`,
        model: 'gpt-4'
      });
      
      let code = response.message;
      if (code.includes('```python')) {
        code = code.split('```python')[1].split('```')[0];
      }
      
      const codeEditor = window.querySelector('#code-editor');
      codeEditor.value = code.trim();
      this.updateLineNumbers(window);
      this.switchMode(window, 'code');
      
      this.desktop.showNotification('Text converted to Streamlit app!', 'success');
      
    } catch (error) {
      this.desktop.showNotification('Failed to convert text: ' + error.message, 'error');
    }
  }

  // Advanced AI-powered features
  async explainSelectedCode(window) {
    if (!this.monacoEditor || !this.aiAssistEnabled) return;

    const selection = this.monacoEditor.getSelection();
    const selectedText = this.monacoEditor.getModel().getValueInRange(selection);
    
    if (!selectedText.trim()) {
      this.desktop.showNotification('Please select some code to explain', 'warning');
      return;
    }

    try {
      const response = await this.swissknife.chat({
        message: `Explain this Streamlit/Python code in simple terms:\n\n${selectedText}`,
        model: 'gpt-4'
      });

      this.showAIResponse(window, 'Code Explanation', response.message);
    } catch (error) {
      this.desktop.showNotification('Failed to explain code: ' + error.message, 'error');
    }
  }

  async optimizeSelectedCode(window) {
    if (!this.monacoEditor || !this.aiAssistEnabled) return;

    const selection = this.monacoEditor.getSelection();
    const selectedText = this.monacoEditor.getModel().getValueInRange(selection);
    
    if (!selectedText.trim()) {
      this.desktop.showNotification('Please select some code to optimize', 'warning');
      return;
    }

    try {
      const response = await this.swissknife.chat({
        message: `Optimize this Streamlit/Python code for better performance and readability. Return only the optimized code:\n\n${selectedText}`,
        model: 'gpt-4'
      });

      let optimizedCode = response.message;
      if (optimizedCode.includes('```python')) {
        optimizedCode = optimizedCode.split('```python')[1].split('```')[0];
      } else if (optimizedCode.includes('```')) {
        optimizedCode = optimizedCode.split('```')[1].split('```')[0];
      }

      // Replace selected text with optimized version
      this.monacoEditor.executeEdits('ai-optimize', [{
        range: selection,
        text: optimizedCode.trim()
      }]);

      this.desktop.showNotification('Code optimized successfully!', 'success');
    } catch (error) {
      this.desktop.showNotification('Failed to optimize code: ' + error.message, 'error');
    }
  }

  async generateDocstring(window) {
    if (!this.monacoEditor || !this.aiAssistEnabled) return;

    const position = this.monacoEditor.getPosition();
    const model = this.monacoEditor.getModel();
    
    // Find the function definition
    let functionStart = position.lineNumber;
    let functionCode = '';
    
    for (let i = position.lineNumber; i >= 1; i--) {
      const line = model.getLineContent(i);
      if (line.trim().startsWith('def ')) {
        functionStart = i;
        break;
      }
    }
    
    // Get function code
    for (let i = functionStart; i <= model.getLineCount(); i++) {
      const line = model.getLineContent(i);
      functionCode += line + '\n';
      
      if (line.trim() === '' && functionCode.includes('def ')) {
        break;
      }
    }

    if (!functionCode.includes('def ')) {
      this.desktop.showNotification('Place cursor inside a function to generate docstring', 'warning');
      return;
    }

    try {
      const response = await this.swissknife.chat({
        message: `Generate a proper Python docstring for this function. Return only the docstring with proper indentation:\n\n${functionCode}`,
        model: 'gpt-4'
      });

      let docstring = response.message;
      if (docstring.includes('"""')) {
        docstring = docstring.split('"""')[1].split('"""')[0];
        docstring = `    """\n    ${docstring.trim()}\n    """`;
      }

      // Insert docstring after function definition
      const insertPosition = { lineNumber: functionStart + 1, column: 1 };
      this.monacoEditor.executeEdits('ai-docstring', [{
        range: new window.monaco.Range(insertPosition.lineNumber, insertPosition.column, insertPosition.lineNumber, insertPosition.column),
        text: docstring + '\n'
      }]);

      this.desktop.showNotification('Docstring generated successfully!', 'success');
    } catch (error) {
      this.desktop.showNotification('Failed to generate docstring: ' + error.message, 'error');
    }
  }

  async formatCode(window) {
    if (!this.monacoEditor) return;

    try {
      // Use Monaco's built-in formatting
      await this.monacoEditor.getAction('editor.action.formatDocument').run();
      this.desktop.showNotification('Code formatted successfully!', 'success');
    } catch (error) {
      this.desktop.showNotification('Failed to format code: ' + error.message, 'error');
    }
  }

  showAIResponse(window, title, content) {
    // Show AI response in the AI chat panel
    this.switchBottomPanel(window, 'ai-chat');
    this.addAIMessage(window, content, 'assistant', title);
  }

  // File and project management
  async newFile(window) {
    const fileName = prompt('Enter file name:', 'new_app.py');
    if (!fileName) return;

    const newFile = {
      name: fileName,
      type: this.getFileType(fileName),
      content: this.getTemplateContent(fileName),
      modified: false
    };

    // Add to project
    if (this.currentProject) {
      this.currentProject.files[fileName] = newFile;
    }

    // Open in new tab
    this.openFileInTab(window, newFile);
    this.desktop.showNotification(`Created ${fileName}`, 'success');
  }

  async openFile(window) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.py,.txt,.md,.json,.yaml,.yml,.css,.html,.js,.ts';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          name: file.name,
          type: this.getFileType(file.name),
          content: e.target.result,
          modified: false,
          path: file.name
        };

        this.openFileInTab(window, fileData);
        this.addToRecentFiles(fileData);
        this.desktop.showNotification(`Opened ${file.name}`, 'success');
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  async saveFile(window) {
    const activeFile = this.getActiveFile();
    if (!activeFile) {
      this.desktop.showNotification('No file to save', 'warning');
      return;
    }

    if (this.monacoEditor && this.editorMode === 'code') {
      activeFile.content = this.monacoEditor.getValue();
    } else if (this.editorMode === 'rich') {
      const richEditor = window.querySelector('#rich-editor');
      if (richEditor) {
        activeFile.content = richEditor.innerHTML;
      }
    }

    // Format on save if enabled
    if (this.formatOnSave && this.monacoEditor && this.editorMode === 'code') {
      await this.formatCode(window);
      activeFile.content = this.monacoEditor.getValue();
    }

    // Save to project
    if (this.currentProject && activeFile.name) {
      this.currentProject.files[activeFile.name] = activeFile;
    }

    // Mark as saved
    activeFile.modified = false;
    this.updateTabStatus(window);
    
    // Download file
    this.downloadFile(activeFile);
    
    this.saveConfiguration();
    this.desktop.showNotification(`Saved ${activeFile.name}`, 'success');
  }

  downloadFile(file) {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Tab management
  openFileInTab(window, file) {
    // Check if file is already open
    const existingIndex = this.openTabs.findIndex(tab => tab.name === file.name);
    if (existingIndex >= 0) {
      this.switchToTab(window, existingIndex);
      return;
    }

    // Add new tab
    this.openTabs.push(file);
    this.activeTabIndex = this.openTabs.length - 1;
    this.currentFile = file;
    
    this.updateTabBar(window);
    this.loadFileInEditor(window, file);
  }

  switchToTab(window, index) {
    if (index < 0 || index >= this.openTabs.length) return;
    
    this.activeTabIndex = index;
    this.currentFile = this.openTabs[index];
    
    this.updateTabBar(window);
    this.loadFileInEditor(window, this.currentFile);
  }

  closeTab(window, index) {
    if (index < 0 || index >= this.openTabs.length) return;
    
    const tab = this.openTabs[index];
    
    // Check if modified
    if (tab.modified) {
      const save = confirm(`${tab.name} has unsaved changes. Save before closing?`);
      if (save) {
        this.saveFile(window);
      }
    }
    
    this.openTabs.splice(index, 1);
    
    if (this.activeTabIndex >= index) {
      this.activeTabIndex = Math.max(0, this.activeTabIndex - 1);
    }
    
    if (this.openTabs.length === 0) {
      this.currentFile = null;
      this.clearEditor(window);
    } else {
      this.currentFile = this.openTabs[this.activeTabIndex];
      this.loadFileInEditor(window, this.currentFile);
    }
    
    this.updateTabBar(window);
  }

  updateTabBar(window) {
    const tabsContainer = window.querySelector('#tabs-container');
    if (tabsContainer) {
      tabsContainer.innerHTML = this.renderTabs();
    }
  }

  loadFileInEditor(window, file) {
    if (!file) return;
    
    if (this.monacoEditor) {
      const model = window.monaco.editor.createModel(file.content, this.getMonacoLanguage(file.type));
      this.monacoEditor.setModel(model);
    }
    
    const richEditor = window.querySelector('#rich-editor');
    if (richEditor && file.type === 'markdown') {
      richEditor.innerHTML = file.content;
    }
  }

  getMonacoLanguage(fileType) {
    const languageMap = {
      'python': 'python',
      'javascript': 'javascript',
      'typescript': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'yaml': 'yaml',
      'markdown': 'markdown',
      'text': 'plaintext'
    };
    
    return languageMap[fileType] || 'plaintext';
  }

  // Live preview system
  async runStreamlitApp(window) {
    const activeFile = this.getActiveFile();
    if (!activeFile || !activeFile.content) {
      this.desktop.showNotification('No Streamlit code to run', 'warning');
      return;
    }

    this.isPreviewLive = true;
    this.updateOutputPanel(window, 'Starting Streamlit server...', 'info');
    
    // Switch to preview mode if not already
    if (this.editorMode !== 'preview' && this.editorMode !== 'split') {
      this.switchEditorMode(window, 'split');
    }
    
    // Generate preview
    this.generateLivePreview(window, activeFile.content);
    
    this.desktop.showNotification('Streamlit app is running!', 'success');
  }

  generateLivePreview(window, code) {
    const previewFrame = window.querySelector('#preview-frame');
    const previewOverlay = window.querySelector('#preview-overlay');
    
    if (previewOverlay) {
      previewOverlay.style.display = 'flex';
    }
    
    // Generate enhanced preview HTML
    const previewHTML = this.generateEnhancedPreviewHTML(code);
    
    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    if (previewFrame) {
      previewFrame.onload = () => {
        if (previewOverlay) {
          previewOverlay.style.display = 'none';
        }
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      previewFrame.src = url;
    }
    
    this.previewUrl = url;
  }

  generateEnhancedPreviewHTML(code) {
    // Enhanced Streamlit preview generator with better parsing and styling
    const lines = code.split('\n');
    let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Streamlit Preview</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            margin: 0; padding: 2rem; background: #fafafa; line-height: 1.6;
        }
        .streamlit-container { max-width: 1200px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #ff4b4b; font-size: 2.5rem; margin-bottom: 1rem; }
        h2 { color: #333; font-size: 2rem; margin: 2rem 0 1rem 0; }
        h3 { color: #555; font-size: 1.5rem; margin: 1.5rem 0 1rem 0; }
        .stButton button { 
            background: linear-gradient(90deg, #ff4b4b, #ff6b6b); 
            color: white; border: none; padding: 0.75rem 1.5rem; 
            border-radius: 6px; font-weight: 500; cursor: pointer;
            transition: transform 0.2s ease;
        }
        .stButton button:hover { transform: translateY(-2px); }
        .stSelectbox, .stSlider, .stTextInput { 
            margin: 1rem 0; padding: 0.5rem; border: 2px solid #ddd; 
            border-radius: 6px; background: white;
        }
        .stMetric { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; padding: 1.5rem; border-radius: 8px; margin: 1rem 0;
            text-align: center;
        }
        .stAlert { padding: 1rem; border-radius: 6px; margin: 1rem 0; }
        .stAlert.success { background: #d4edda; color: #155724; border-left: 4px solid #28a745; }
        .stAlert.info { background: #d1ecf1; color: #0c5460; border-left: 4px solid #17a2b8; }
        .stAlert.warning { background: #fff3cd; color: #856404; border-left: 4px solid #ffc107; }
        .stAlert.error { background: #f8d7da; color: #721c24; border-left: 4px solid #dc3545; }
        .stColumns { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin: 2rem 0; }
        .stExpander { 
            border: 2px solid #ddd; border-radius: 8px; margin: 1rem 0; 
            background: white; overflow: hidden;
        }
        .stExpander summary { 
            padding: 1rem; background: #f8f9fa; cursor: pointer; 
            font-weight: 500; border-bottom: 1px solid #ddd;
        }
        .stExpander-content { padding: 1rem; }
        .stDataframe { 
            border: 1px solid #ddd; border-radius: 6px; overflow: hidden; 
            margin: 1rem 0; background: white;
        }
        .chart-container { 
            background: white; border: 1px solid #ddd; border-radius: 8px; 
            padding: 1rem; margin: 1rem 0; min-height: 300px;
            display: flex; align-items: center; justify-content: center;
        }
        .sidebar { 
            position: fixed; left: 0; top: 0; width: 300px; height: 100vh; 
            background: #f0f2f6; padding: 2rem; overflow-y: auto;
            border-right: 2px solid #ddd;
        }
        .main-content { margin-left: 320px; }
        .preview-note {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 1rem; border-radius: 8px; margin: 2rem 0;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="streamlit-container">
`;

    let inSidebar = false;
    let sidebarContent = '';
    let mainContent = '';
    let columnsMode = false;
    let expanderMode = false;

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Parse Streamlit commands and generate appropriate HTML
      if (trimmed.includes('st.set_page_config')) {
        // Extract page config (title, icon, layout)
        const titleMatch = trimmed.match(/page_title\s*=\s*["'](.*?)["']/);
        if (titleMatch) {
          html = html.replace('<title>Streamlit Preview</title>', `<title>${titleMatch[1]}</title>`);
        }
      }
      
      else if (trimmed.startsWith('st.title(')) {
        const title = this.extractStringFromCode(trimmed);
        mainContent += `<h1>${title}</h1>`;
      }
      
      else if (trimmed.startsWith('st.header(')) {
        const header = this.extractStringFromCode(trimmed);
        mainContent += `<h2>${header}</h2>`;
      }
      
      else if (trimmed.startsWith('st.subheader(')) {
        const subheader = this.extractStringFromCode(trimmed);
        mainContent += `<h3>${subheader}</h3>`;
      }
      
      else if (trimmed.startsWith('st.write(') || trimmed.startsWith('st.markdown(')) {
        const text = this.extractStringFromCode(trimmed);
        mainContent += `<p>${text}</p>`;
      }
      
      else if (trimmed.includes('st.button(')) {
        const label = this.extractStringFromCode(trimmed);
        mainContent += `<div class="stButton"><button onclick="alert('Button clicked!')">${label}</button></div>`;
      }
      
      else if (trimmed.includes('st.selectbox(')) {
        const label = this.extractStringFromCode(trimmed);
        mainContent += `
          <div class="stSelectbox">
            <label>${label}</label><br>
            <select style="width: 100%; padding: 0.5rem; margin-top: 0.5rem;">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>`;
      }
      
      else if (trimmed.includes('st.slider(')) {
        const label = this.extractStringFromCode(trimmed);
        mainContent += `
          <div class="stSlider">
            <label>${label}</label><br>
            <input type="range" min="0" max="100" value="50" style="width: 100%; margin-top: 0.5rem;">
          </div>`;
      }
      
      else if (trimmed.includes('st.text_input(')) {
        const label = this.extractStringFromCode(trimmed);
        mainContent += `
          <div class="stTextInput">
            <label>${label}</label><br>
            <input type="text" placeholder="Enter text..." style="width: 100%; padding: 0.5rem; margin-top: 0.5rem;">
          </div>`;
      }
      
      else if (trimmed.includes('st.metric(')) {
        mainContent += `
          <div class="stMetric">
            <div style="font-size: 0.9rem; opacity: 0.8;">Sample Metric</div>
            <div style="font-size: 2rem; font-weight: bold;">42.5K</div>
            <div style="font-size: 0.8rem; color: #90ee90;">+12.3% ↗</div>
          </div>`;
      }
      
      else if (trimmed.includes('st.success(')) {
        const text = this.extractStringFromCode(trimmed);
        mainContent += `<div class="stAlert success">✅ ${text}</div>`;
      }
      
      else if (trimmed.includes('st.info(')) {
        const text = this.extractStringFromCode(trimmed);
        mainContent += `<div class="stAlert info">ℹ️ ${text}</div>`;
      }
      
      else if (trimmed.includes('st.warning(')) {
        const text = this.extractStringFromCode(trimmed);
        mainContent += `<div class="stAlert warning">⚠️ ${text}</div>`;
      }
      
      else if (trimmed.includes('st.error(')) {
        const text = this.extractStringFromCode(trimmed);
        mainContent += `<div class="stAlert error">❌ ${text}</div>`;
      }
      
      else if (trimmed.includes('st.columns(')) {
        mainContent += `<div class="stColumns">`;
        columnsMode = true;
      }
      
      else if (trimmed.includes('st.expander(')) {
        const label = this.extractStringFromCode(trimmed);
        mainContent += `
          <details class="stExpander">
            <summary>${label}</summary>
            <div class="stExpander-content">`;
        expanderMode = true;
      }
      
      else if (trimmed.includes('st.sidebar') || trimmed.includes('with st.sidebar:')) {
        inSidebar = true;
      }
      
      else if (trimmed.includes('st.plotly_chart(') || trimmed.includes('st.line_chart(') || 
               trimmed.includes('st.bar_chart(') || trimmed.includes('st.area_chart(')) {
        mainContent += `
          <div class="chart-container">
            <div style="text-align: center; color: #666;">
              📊 Interactive Chart<br>
              <small>(In actual Streamlit, this would be a live chart)</small>
            </div>
          </div>`;
      }
      
      else if (trimmed.includes('st.dataframe(') || trimmed.includes('st.table(')) {
        mainContent += `
          <div class="stDataframe">
            <table style="width: 100%; border-collapse: collapse;">
              <thead style="background: #f8f9fa;">
                <tr><th style="padding: 0.75rem; border: 1px solid #ddd;">Column 1</th>
                    <th style="padding: 0.75rem; border: 1px solid #ddd;">Column 2</th>
                    <th style="padding: 0.75rem; border: 1px solid #ddd;">Column 3</th></tr>
              </thead>
              <tbody>
                <tr><td style="padding: 0.5rem; border: 1px solid #ddd;">Data 1</td>
                    <td style="padding: 0.5rem; border: 1px solid #ddd;">Data 2</td>
                    <td style="padding: 0.5rem; border: 1px solid #ddd;">Data 3</td></tr>
              </tbody>
            </table>
          </div>`;
      }
    });

    // Close open containers
    if (columnsMode) mainContent += `</div>`;
    if (expanderMode) mainContent += `</div></details>`;

    // Add sidebar if content exists
    if (sidebarContent) {
      html += `<div class="sidebar">${sidebarContent}</div>`;
      html += `<div class="main-content">${mainContent}</div>`;
    } else {
      html += mainContent;
    }

    html += `
        <div class="preview-note">
            <strong>📝 VibeCode Live Preview</strong><br>
            This is a simplified preview of your Streamlit app. For full functionality, run <code>streamlit run app.py</code>
        </div>
    </div>
</body>
</html>`;

    return html;
  }

  // Utility methods
  getActiveFile() {
    return this.currentFile;
  }

  getActiveFileContent() {
    const activeFile = this.getActiveFile();
    return activeFile ? activeFile.content : this.getDefaultStreamlitCode();
  }

  getFileType(fileName) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const typeMap = {
      'py': 'python',
      'js': 'javascript',
      'ts': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'txt': 'text'
    };
    return typeMap[extension] || 'text';
  }

  getTemplateContent(fileName) {
    if (fileName.endsWith('.py')) {
      return this.getDefaultStreamlitCode();
    } else if (fileName.endsWith('.md')) {
      return `# ${fileName.replace('.md', '')}\n\nDescription of your application.`;
    } else if (fileName === 'requirements.txt') {
      return 'streamlit>=1.28.0\npandas>=1.5.0\nplotly>=5.0.0\nnumpy>=1.21.0';
    }
    return '';
  }

  updateCursorPosition(window, position) {
    const statusElement = window.querySelector('#cursor-position');
    if (statusElement) {
      statusElement.textContent = `Ln ${position.lineNumber}, Col ${position.column}`;
    }
  }

  onCodeChange(window) {
    if (this.currentFile) {
      this.currentFile.modified = true;
      this.updateTabStatus(window);
    }
    
    // Auto-save after delay
    clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(() => {
      if (this.autoSave) {
        this.saveFile(window);
      }
    }, 5000);
  }

  updateTabStatus(window) {
    this.updateTabBar(window);
  }

  onEditorFocus(window) {
    // Editor gained focus
  }

  clearEditor(window) {
    if (this.monacoEditor) {
      this.monacoEditor.setValue('');
    }
  }

  saveConfiguration() {
    try {
      const config = {
        theme: this.theme,
        fontSize: this.fontSize,
        wordWrap: this.wordWrap,
        minimap: this.minimap,
        aiAssistEnabled: this.aiAssistEnabled,
        formatOnSave: this.formatOnSave,
        editorMode: this.editorMode,
        panels: this.panels
      };
      localStorage.setItem('vibecode-config', JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save configuration:', error);
    }
  }

  // Implement remaining methods with enhanced functionality
  toggleAI(window) { this.aiAssistEnabled = !this.aiAssistEnabled; this.saveConfiguration(); }
  showGenerationDialog(window) { /* Enhanced AI generation dialog */ }
  optimizeCode(window) { this.optimizeSelectedCode(window); }
  debugApp(window) { /* Debug functionality */ }
  deployApp(window) { /* Deployment functionality */ }
  togglePanel(window, panel) { this.panels[panel] = !this.panels[panel]; }
  showCommandPalette(window) { /* Command palette */ }
  createNewFolder(window) { /* Folder creation */ }
  createNewFileInProject(window) { /* File creation in project */ }
  refreshExplorer(window) { /* Explorer refresh */ }
  openFileFromTree(window, fileName) { /* Open from tree */ }
  openRecentFile(window, fileName) { /* Open recent file */ }
  splitEditor(window) { /* Split editor view */ }
  closeAllTabs(window) { /* Close all tabs */ }
  executeRichTextAction(window, action) { /* Rich text actions */ }
  handleRichTextPaste(window, e) { /* Rich text paste handling */ }
  handleRichTextKeydown(window, e) { /* Rich text keyboard handling */ }
  onRichTextChange(window) { /* Rich text change handling */ }
  setPreviewMode(window, mode) { this.previewMode = mode; }
  refreshPreview(window) { this.generateLivePreview(window, this.getActiveFileContent()); }
  openExternalPreview(window) { /* Open preview in new window */ }
  sharePreview(window) { /* Share preview functionality */ }
  switchBottomPanel(window, panel) { /* Switch bottom panel */ }
  executeTerminalCommand(window, command) { /* Terminal command execution */ }
  sendAIMessage(window, message) { /* AI chat message */ }
  hideGenerationDialog(window) { /* Hide generation dialog */ }
  hideSettingsPanel(window) { /* Hide settings panel */ }
  filterCommands(window, query) { /* Filter command palette */ }
  hideCommandPalette(window) { /* Hide command palette */ }
  showAIAssistant(window) { /* Show AI assistant */ }
  updateOutputPanel(window, message, type) { /* Update output panel */ }
  updateProblemsPanel(window, problems) { /* Update problems panel */ }
  addAIMessage(window, message, role, title) { /* Add AI message */ }
  loadTemplate(window, templateId) { /* Load template functionality */ }
  addToRecentFiles(file) { /* Add to recent files */ }
  extractStringFromCode(line) { 
    const match = line.match(/["'](.*?)["']/);
    return match ? match[1] : 'Sample Text';
  }
}

  loadTemplate(window, templateName) {
    const templates = {
      dashboard: `import streamlit as st
import pandas as pd
import plotly.express as px
import numpy as np

st.set_page_config(page_title="Dashboard", layout="wide")

st.title("📊 Interactive Dashboard")

# Sidebar controls
st.sidebar.header("Dashboard Controls")
chart_type = st.sidebar.selectbox("Chart Type", ["Line", "Bar", "Scatter", "Histogram"])
data_points = st.sidebar.slider("Data Points", 10, 1000, 100)

# Generate sample data
@st.cache_data
def load_data(n_points):
    dates = pd.date_range('2023-01-01', periods=n_points, freq='D')
    values = np.cumsum(np.random.randn(n_points)) + 100
    return pd.DataFrame({'Date': dates, 'Value': values})

data = load_data(data_points)

# Main content
col1, col2 = st.columns([3, 1])

with col1:
    st.subheader(f"{chart_type} Chart")
    if chart_type == "Line":
        fig = px.line(data, x='Date', y='Value')
    elif chart_type == "Bar":
        fig = px.bar(data, x='Date', y='Value')
    elif chart_type == "Scatter":
        fig = px.scatter(data, x='Date', y='Value')
    else:
        fig = px.histogram(data, x='Value')
    
    st.plotly_chart(fig, use_container_width=True)

with col2:
    st.subheader("Statistics")
    st.metric("Mean", f"{data['Value'].mean():.2f}")
    st.metric("Std Dev", f"{data['Value'].std():.2f}")
    st.metric("Min", f"{data['Value'].min():.2f}")
    st.metric("Max", f"{data['Value'].max():.2f}")

# Data table
with st.expander("View Raw Data"):
    st.dataframe(data)`,

      'ml-model': `import streamlit as st
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import plotly.express as px

st.title("🤖 Machine Learning Model Builder")

# Sidebar for model configuration
st.sidebar.header("Model Configuration")
n_samples = st.sidebar.slider("Training Samples", 100, 1000, 500)
test_size = st.sidebar.slider("Test Size", 0.1, 0.5, 0.2)
n_estimators = st.sidebar.slider("Number of Trees", 10, 200, 100)

# Generate sample data
@st.cache_data
def generate_data(n_samples):
    X = np.random.randn(n_samples, 4)
    y = (X[:, 0] + X[:, 1] > 0).astype(int)
    feature_names = ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4']
    return X, y, feature_names

X, y, feature_names = generate_data(n_samples)

# Train model
if st.button("Train Model"):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size)
    
    model = RandomForestClassifier(n_estimators=n_estimators)
    model.fit(X_train, y_train)
    
    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    
    st.success(f"Model trained! Accuracy: {accuracy:.3f}")
    
    # Feature importance
    importance_df = pd.DataFrame({
        'Feature': feature_names,
        'Importance': model.feature_importances_
    })
    
    fig = px.bar(importance_df, x='Feature', y='Importance', 
                 title="Feature Importance")
    st.plotly_chart(fig)
    
    # Prediction interface
    st.subheader("Make Predictions")
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        f1 = st.number_input("Feature 1", value=0.0)
    with col2:
        f2 = st.number_input("Feature 2", value=0.0)
    with col3:
        f3 = st.number_input("Feature 3", value=0.0)
    with col4:
        f4 = st.number_input("Feature 4", value=0.0)
    
    if st.button("Predict"):
        prediction = model.predict([[f1, f2, f3, f4]])[0]
        probability = model.predict_proba([[f1, f2, f3, f4]])[0]
        
        st.write(f"Prediction: {'Class 1' if prediction else 'Class 0'}")
        st.write(f"Confidence: {max(probability):.3f}")`,

      'data-viz': `import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import numpy as np

st.title("📈 Advanced Data Visualization")

# File upload
uploaded_file = st.file_uploader("Upload CSV file", type="csv")

if uploaded_file is not None:
    df = pd.read_csv(uploaded_file)
    st.success("File uploaded successfully!")
else:
    # Generate sample data
    st.info("Using sample data. Upload a CSV file to use your own data.")
    df = pd.DataFrame({
        'Date': pd.date_range('2023-01-01', periods=100),
        'Sales': np.random.normal(1000, 200, 100),
        'Customers': np.random.poisson(50, 100),
        'Category': np.random.choice(['A', 'B', 'C'], 100)
    })

# Data overview
st.subheader("Data Overview")
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("Total Rows", len(df))
with col2:
    st.metric("Total Columns", len(df.columns))
with col3:
    st.metric("Numeric Columns", len(df.select_dtypes(include=[np.number]).columns))

# Visualization controls
st.subheader("Visualization Controls")
chart_type = st.selectbox("Chart Type", [
    "Line Chart", "Bar Chart", "Scatter Plot", "Histogram", 
    "Box Plot", "Heatmap", "3D Scatter"
])

numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
categorical_columns = df.select_dtypes(include=['object']).columns.tolist()

if chart_type in ["Line Chart", "Bar Chart", "Scatter Plot"]:
    col1, col2 = st.columns(2)
    with col1:
        x_axis = st.selectbox("X-axis", df.columns)
    with col2:
        y_axis = st.selectbox("Y-axis", numeric_columns)
    
    if categorical_columns:
        color_by = st.selectbox("Color by", ["None"] + categorical_columns)
        color_by = None if color_by == "None" else color_by
    else:
        color_by = None

# Generate charts
st.subheader("Visualization")

if chart_type == "Line Chart":
    fig = px.line(df, x=x_axis, y=y_axis, color=color_by)
elif chart_type == "Bar Chart":
    fig = px.bar(df, x=x_axis, y=y_axis, color=color_by)
elif chart_type == "Scatter Plot":
    fig = px.scatter(df, x=x_axis, y=y_axis, color=color_by)
elif chart_type == "Histogram":
    column = st.selectbox("Column for Histogram", numeric_columns)
    fig = px.histogram(df, x=column)
elif chart_type == "Box Plot":
    column = st.selectbox("Column for Box Plot", numeric_columns)
    fig = px.box(df, y=column)
elif chart_type == "Heatmap":
    corr_matrix = df[numeric_columns].corr()
    fig = px.imshow(corr_matrix, text_auto=True)
elif chart_type == "3D Scatter":
    if len(numeric_columns) >= 3:
        x_col = st.selectbox("X-axis", numeric_columns)
        y_col = st.selectbox("Y-axis", [col for col in numeric_columns if col != x_col])
        z_col = st.selectbox("Z-axis", [col for col in numeric_columns if col not in [x_col, y_col]])
        fig = px.scatter_3d(df, x=x_col, y=y_col, z=z_col, color=color_by)
    else:
        st.error("Need at least 3 numeric columns for 3D scatter plot")
        fig = None

if 'fig' in locals() and fig is not None:
    st.plotly_chart(fig, use_container_width=True)

# Data table
with st.expander("View Data"):
    st.dataframe(df)`
    };
    
    if (templates[templateName]) {
      const codeEditor = window.querySelector('#code-editor');
      codeEditor.value = templates[templateName];
      this.updateLineNumbers(window);
      this.switchMode(window, 'code');
      this.desktop.showNotification(`${templateName.charAt(0).toUpperCase() + templateName.slice(1)} template loaded!`, 'success');
    }
  }

  initializeEditor(window) {
    const codeEditor = window.querySelector('#code-editor');
    const richEditor = window.querySelector('#rich-editor');
    
    // Set initial content for code editor
    codeEditor.value = `# Welcome to VibeCode! 🎯
# AI-Powered Streamlit App Generator

import streamlit as st

st.title("🚀 My First Streamlit App")
st.write("Hello, World!")

# Add your code here...
`;

    // Set initial content for rich editor
    richEditor.innerHTML = `
      <h1>Welcome to VibeCode! 🎯</h1>
      <p>Describe your Streamlit app idea here, and I'll help you build it!</p>
      <p>For example:</p>
      <blockquote>
        <p>"Create a dashboard that shows real-time stock prices with interactive charts, 
        allows users to select different stocks from a dropdown, and displays key financial metrics."</p>
      </blockquote>
      <p>Click the <strong>🎯 To App</strong> button to convert your description into working Streamlit code!</p>
    `;

    this.updateLineNumbers(window);
    this.setLanguage(window, this.language);
    this.setupSyntaxHighlighting(window);
  }

  loadDefaultRequirements(window) {
    const requirements = [
      { name: 'streamlit', version: '>=1.28.0', status: 'installed' },
      { name: 'pandas', version: '>=1.5.0', status: 'installed' },
      { name: 'plotly', version: '>=5.0.0', status: 'available' },
      { name: 'numpy', version: '>=1.21.0', status: 'installed' },
      { name: 'scikit-learn', version: '>=1.0.0', status: 'available' }
    ];
    
    const requirementsList = window.querySelector('#requirements-list');
    requirementsList.innerHTML = '';
    
    requirements.forEach(req => {
      const reqItem = document.createElement('div');
      reqItem.className = 'requirement-item';
      reqItem.innerHTML = `
        <span class="req-name">${req.name}</span>
        <span class="req-version">${req.version}</span>
        <span class="req-status ${req.status}">${req.status === 'installed' ? '✅' : '📦'}</span>
        <button class="req-install" ${req.status === 'installed' ? 'disabled' : ''}>
          ${req.status === 'installed' ? 'Installed' : 'Install'}
        </button>
      `;
      requirementsList.appendChild(reqItem);
    });
  }

  onCodeEditorChange(window) {
    this.updateLineNumbers(window);
    this.markFileAsModified(window);
    
    if (this.aiAssistEnabled) {
      this.scheduleAISuggestions(window);
    }
  }

  onRichTextChange(window) {
    this.markFileAsModified(window);
  }

  updateLineNumbers(window) {
    const editor = window.querySelector('#code-editor');
    const lineNumbers = window.querySelector('#line-numbers');
    
    if (!editor || !lineNumbers) return;
    
    const lines = editor.value.split('\n').length;
    const numbersHtml = Array.from({ length: lines }, (_, i) => 
      `<div class="line-number">${i + 1}</div>`
    ).join('');
    
    lineNumbers.innerHTML = numbersHtml;
    lineNumbers.scrollTop = editor.scrollTop;
  }

  setupSyntaxHighlighting(window) {
    const editor = window.querySelector('#code-editor');
    // Basic syntax highlighting for Python/Streamlit
    // In a real implementation, use a proper syntax highlighter like Prism.js or Monaco Editor
  }

  async executeCode(window) {
    const input = window.querySelector('#console-input');
    const output = window.querySelector('#console-output');
    const code = input.value.trim();
    
    if (!code) return;
    
    // Display command
    const commandDiv = document.createElement('div');
    commandDiv.className = 'console-line command';
    commandDiv.textContent = '>>> ' + code;
    output.appendChild(commandDiv);
    
    try {
      if (code.startsWith('streamlit ')) {
        // Handle Streamlit commands
        this.handleStreamlitCommand(window, code);
      } else {
        // Execute Python code (mock execution)
        const result = await this.executePythonCode(code);
        const resultDiv = document.createElement('div');
        resultDiv.className = 'console-line result';
        resultDiv.textContent = result;
        output.appendChild(resultDiv);
      }
    } catch (error) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'console-line error';
      errorDiv.textContent = 'Error: ' + error.message;
      output.appendChild(errorDiv);
    }
    
    input.value = '';
    output.scrollTop = output.scrollHeight;
  }

  async executePythonCode(code) {
    // Mock Python execution - in real implementation, use Pyodide or send to backend
    if (code.includes('print(')) {
      const match = code.match(/print\((.*)\)/);
      if (match) {
        return eval(match[1]); // Simplified evaluation
      }
    }
    return 'Code executed successfully';
  }

  handleStreamlitCommand(window, command) {
    const output = window.querySelector('#console-output');
    
    if (command === 'streamlit run app.py') {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'console-line success';
      resultDiv.innerHTML = `
        🚀 Streamlit app is running!<br>
        Local URL: <a href="#" onclick="window.open('http://localhost:8501', '_blank')">http://localhost:8501</a><br>
        Network URL: http://192.168.1.100:8501<br>
        <br>
        Press Ctrl+C to stop the server.
      `;
      output.appendChild(resultDiv);
      
      // Enable preview
      window.querySelector('#preview-streamlit-btn').disabled = false;
    } else {
      const resultDiv = document.createElement('div');
      resultDiv.className = 'console-line info';
      resultDiv.textContent = 'Streamlit command executed: ' + command;
      output.appendChild(resultDiv);
    }
  }

  async previewStreamlit(window) {
    const codeEditor = window.querySelector('#code-editor');
    const code = codeEditor.value;
    
    if (!code.trim()) {
      this.desktop.showNotification('No code to preview', 'warning');
      return;
    }
    
    this.switchMode(window, 'preview');
    this.generatePreview(window, code);
  }

  generatePreview(window, code) {
    const previewFrame = window.querySelector('#preview-frame');
    
    // Generate a mock Streamlit preview
    const previewHTML = this.generateStreamlitPreviewHTML(code);
    
    const blob = new Blob([previewHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    previewFrame.src = url;
    
    // Clean up URL after loading
    previewFrame.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  }

  generateStreamlitPreviewHTML(code) {
    // Parse Streamlit code and generate preview HTML
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Streamlit Preview</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 2rem; }
        .streamlit-container { max-width: 1200px; margin: 0 auto; }
        .stButton button { background: #ff4b4b; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; }
        .stSelectbox select { padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.25rem; }
        .stMetric { background: #f0f2f6; padding: 1rem; border-radius: 0.5rem; margin: 0.5rem 0; }
        .stAlert { padding: 1rem; border-radius: 0.5rem; margin: 1rem 0; }
        .stAlert.info { background: #e1f5fe; color: #01579b; }
        .stAlert.success { background: #e8f5e8; color: #2e7d32; }
        .stAlert.warning { background: #fff3cd; color: #856404; }
        .stAlert.error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="streamlit-container">
`;
    
    // Parse code and generate preview elements
    const lines = code.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('st.title(')) {
        const title = this.extractStringFromCode(trimmed);
        html += `<h1>${title}</h1>`;
      } else if (trimmed.startsWith('st.header(')) {
        const header = this.extractStringFromCode(trimmed);
        html += `<h2>${header}</h2>`;
      } else if (trimmed.startsWith('st.subheader(')) {
        const subheader = this.extractStringFromCode(trimmed);
        html += `<h3>${subheader}</h3>`;
      } else if (trimmed.startsWith('st.write(')) {
        const text = this.extractStringFromCode(trimmed);
        html += `<p>${text}</p>`;
      } else if (trimmed.startsWith('st.success(')) {
        const text = this.extractStringFromCode(trimmed);
        html += `<div class="stAlert success">✅ ${text}</div>`;
      } else if (trimmed.startsWith('st.info(')) {
        const text = this.extractStringFromCode(trimmed);
        html += `<div class="stAlert info">ℹ️ ${text}</div>`;
      } else if (trimmed.startsWith('st.warning(')) {
        const text = this.extractStringFromCode(trimmed);
        html += `<div class="stAlert warning">⚠️ ${text}</div>`;
      } else if (trimmed.startsWith('st.error(')) {
        const text = this.extractStringFromCode(trimmed);
        html += `<div class="stAlert error">❌ ${text}</div>`;
      } else if (trimmed.includes('st.button(')) {
        const label = this.extractStringFromCode(trimmed);
        html += `<button class="stButton">${label}</button><br><br>`;
      } else if (trimmed.includes('st.selectbox(')) {
        const label = this.extractStringFromCode(trimmed);
        html += `<label>${label}</label><br><select class="stSelectbox"><option>Option 1</option><option>Option 2</option></select><br><br>`;
      } else if (trimmed.includes('st.metric(')) {
        html += `<div class="stMetric"><strong>Sample Metric</strong><br><span style="font-size: 2rem; color: #ff4b4b;">123.45</span></div>`;
      }
    });
    
    html += `
        <div style="margin-top: 2rem; padding: 1rem; background: #f0f2f6; border-radius: 0.5rem;">
            <p><strong>📝 Preview Mode</strong></p>
            <p>This is a simplified preview of your Streamlit app. For full functionality, run the app with <code>streamlit run app.py</code></p>
        </div>
    </div>
</body>
</html>`;
    
    return html;
  }

  extractStringFromCode(line) {
    // Extract string content from Streamlit function calls
    const match = line.match(/['"](.*?)['"]/);
    return match ? match[1] : 'Sample Text';
  }

  refreshPreview(window) {
    const codeEditor = window.querySelector('#code-editor');
    this.generatePreview(window, codeEditor.value);
  }

  async sendAIMessage(window) {
    const aiInput = window.querySelector('#ai-input');
    const message = aiInput.value.trim();
    
    if (!message) return;
    
    const aiChat = window.querySelector('#ai-chat');
    
    // Add user message
    this.addAIMessage(window, message, 'user');
    aiInput.value = '';
    
    try {
      const context = window.querySelector('#code-editor').value;
      const response = await this.swissknife.chat({
        message: `Context - Current Streamlit code:\n${context}\n\nUser request: ${message}\n\nPlease provide specific help with Streamlit development.`,
        model: 'gpt-4'
      });
      
      this.addAIMessage(window, response.message, 'assistant');
    } catch (error) {
      this.addAIMessage(window, `Error: ${error.message}`, 'error');
    }
  }

  addAIMessage(window, message, role) {
    const aiChat = window.querySelector('#ai-chat');
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-message ${role}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'ai-avatar';
    avatar.textContent = role === 'user' ? '👤' : role === 'assistant' ? '🤖' : '⚠️';
    
    const content = document.createElement('div');
    content.className = 'ai-content';
    
    if (message.includes('```')) {
      content.innerHTML = this.formatCodeBlocks(message);
    } else {
      content.textContent = message;
    }
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    aiChat.appendChild(messageDiv);
    aiChat.scrollTop = aiChat.scrollHeight;
  }

  formatCodeBlocks(text) {
    return text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
      return `<pre style="background: #2d3748; color: #e2e8f0; padding: 1rem; border-radius: 0.5rem; overflow-x: auto;"><code class="language-${language || 'text'}">${this.escapeHtml(code.trim())}</code></pre>`;
    });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  switchPanel(window, panelName) {
    const tabs = window.querySelectorAll('.panel-tab');
    const sections = window.querySelectorAll('.panel-section');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    sections.forEach(section => section.classList.remove('active'));
    
    window.querySelector(`[data-panel="${panelName}"]`).classList.add('active');
    window.querySelector(`#${panelName}-panel`).classList.add('active');
  }

  setLanguage(window, language) {
    this.language = language;
    const editor = window.querySelector('#code-editor');
    const languageSelect = window.querySelector('#language-select');
    
    if (languageSelect) {
      languageSelect.value = language;
    }
    
    if (editor) {
      editor.className = `code-editor language-${language}`;
    }
  }

  markFileAsModified(window) {
    const saveBtn = window.querySelector('#save-file-btn');
    if (saveBtn) {
      saveBtn.disabled = false;
    }
  }

  toggleAIAssist(window) {
    this.aiAssistEnabled = !this.aiAssistEnabled;
    const btn = window.querySelector('#ai-assist-btn');
    btn.classList.toggle('active', this.aiAssistEnabled);
    
    if (this.aiAssistEnabled) {
      this.desktop.showNotification('AI assistance enabled', 'success');
    } else {
      this.desktop.showNotification('AI assistance disabled', 'info');
    }
  }

  scheduleAISuggestions(window) {
    // Debounce AI suggestions
    clearTimeout(this.aiSuggestionsTimeout);
    this.aiSuggestionsTimeout = setTimeout(() => {
      this.generateAISuggestions(window);
    }, 3000);
  }

  async generateAISuggestions(window) {
    if (!this.aiAssistEnabled) return;
    
    const editor = window.querySelector('#code-editor');
    const code = editor.value;
    
    if (code.length < 20) return;
    
    try {
      const suggestions = await this.swissknife.chat({
        message: `Analyze this Streamlit code and provide 2-3 brief improvement suggestions:\n\n${code}`,
        model: 'gpt-3.5-turbo'
      });
      
      // Show suggestions in a subtle way
      console.log('AI Suggestions:', suggestions.message);
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
    }
  }

  populateRecentFiles(window) {
    const recentFilesContainer = window.querySelector('#recent-files');
    if (!recentFilesContainer) return;

    recentFilesContainer.innerHTML = '';
    
    if (this.recentFiles.length === 0) {
      recentFilesContainer.innerHTML = '<div class="no-recent-files">No recent files</div>';
      return;
    }

    this.recentFiles.forEach(file => {
      const fileItem = document.createElement('div');
      fileItem.className = 'recent-file-item';
      fileItem.innerHTML = `
        <span class="file-icon">📄</span>
        <span class="file-name">${file.name}</span>
        <span class="file-path">${file.path}</span>
      `;
      fileItem.addEventListener('click', () => this.openRecentFile(window, file));
      recentFilesContainer.appendChild(fileItem);
    });
  }

  openRecentFile(window, file) {
    // Load file content
    const codeEditor = window.querySelector('#code-editor');
    if (codeEditor && file.content) {
      codeEditor.value = file.content;
      this.updateLineNumbers(window);
      this.currentFile = file;
      this.desktop.showNotification(`Opened ${file.name}`, 'success');
    }
  }

  // Placeholder methods for remaining functionality
  newFile(window) { 
    const codeEditor = window.querySelector('#code-editor');
    if (codeEditor) {
      codeEditor.value = `import streamlit as st

st.title("New Streamlit App")
st.write("Hello, World!")
`;
      this.updateLineNumbers(window);
      this.currentFile = null;
      this.desktop.showNotification('New file created', 'success');
    }
  }
  openFile(window) { 
    // Create file input for opening files
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.py,.txt,.md';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const codeEditor = window.querySelector('#code-editor');
          if (codeEditor) {
            codeEditor.value = e.target.result;
            this.updateLineNumbers(window);
            this.currentFile = { name: file.name, content: e.target.result };
            this.addToRecentFiles(this.currentFile);
            this.desktop.showNotification(`Opened ${file.name}`, 'success');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }
  saveFile(window) { 
    const codeEditor = window.querySelector('#code-editor');
    if (codeEditor && this.currentFile) {
      this.currentFile.content = codeEditor.value;
      this.saveToStorage();
      this.desktop.showNotification(`Saved ${this.currentFile.name}`, 'success');
    } else {
      this.saveAsFile(window);
    }
  }
  saveAsFile(window) { 
    const codeEditor = window.querySelector('#code-editor');
    if (codeEditor) {
      const fileName = prompt('Enter file name:', 'app.py');
      if (fileName) {
        const content = codeEditor.value;
        const file = { name: fileName, content: content, path: fileName };
        this.currentFile = file;
        this.addToRecentFiles(file);
        this.saveToStorage();
        
        // Create download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        
        this.desktop.showNotification(`Saved as ${fileName}`, 'success');
      }
    }
  }

  addToRecentFiles(file) {
    // Remove if already exists
    this.recentFiles = this.recentFiles.filter(f => f.name !== file.name);
    // Add to beginning
    this.recentFiles.unshift(file);
    // Keep only 10 recent files
    this.recentFiles = this.recentFiles.slice(0, 10);
    this.saveToStorage();
  }

  saveToStorage() {
    try {
      localStorage.setItem('vibecode-recent-files', JSON.stringify(this.recentFiles));
    } catch (error) {
      console.warn('Failed to save to storage:', error);
    }
  }
  insertComponent(window, componentType) { /* Implementation */ }
  setupEnhancementPanel(window) { /* Implementation */ }
  showEnhancementPanel(window) { /* Implementation */ }
  debugWithAI(window) { /* Implementation */ }
  deployStreamlit(window) { /* Implementation */ }
  installRequirements(window) { /* Implementation */ }
  addRequirement(window) { /* Implementation */ }
  fullscreenPreview(window) { /* Implementation */ }
  sharePreview(window) { /* Implementation */ }
  handleKeyDown(window, e) { /* Implementation */ }
  aiCompleteText(window) { /* Implementation */ }
  regenerateCode(window) { /* Implementation */ }
}
