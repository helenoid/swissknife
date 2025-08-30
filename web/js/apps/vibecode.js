/**
 * VibeCode App - Advanced Rich Text Editor with AI-Powered Streamlit Generation
 * Full-featured text editor like TipTap with AI assistance for creating Streamlit apps
 */

export class VibeCodeApp {
  constructor(desktop) {
    this.desktop = desktop;
    this.swissknife = null;
    this.editor = null;
    this.currentFile = null;
    this.language = 'python';
    this.theme = 'dark';
    this.aiAssistEnabled = true;
    this.recentFiles = [];
    this.editorMode = 'rich'; // 'rich', 'code', 'preview'
    this.streamlitCode = '';
    this.currentApp = null;
    this.isGenerating = false;
  }

  async initialize() {
    this.swissknife = this.desktop.swissknife;
    await this.loadRecentFiles();
  }

  createWindow() {
    const content = `
      <div class="vibecode-container">
        <div class="vibecode-toolbar">
          <div class="toolbar-section">
            <button class="toolbar-btn" id="new-file-btn" title="New File">📄</button>
            <button class="toolbar-btn" id="open-file-btn" title="Open File">📁</button>
            <button class="toolbar-btn" id="save-file-btn" title="Save File" disabled>💾</button>
            <button class="toolbar-btn" id="save-as-btn" title="Save As">💾+</button>
          </div>
          
          <div class="toolbar-section">
            <div class="mode-switcher">
              <button class="mode-btn ${this.editorMode === 'rich' ? 'active' : ''}" data-mode="rich">Rich Text</button>
              <button class="mode-btn ${this.editorMode === 'code' ? 'active' : ''}" data-mode="code">Code</button>
              <button class="mode-btn ${this.editorMode === 'preview' ? 'active' : ''}" data-mode="preview">Preview</button>
            </div>
          </div>
          
          <div class="toolbar-section">
            <select id="language-select" title="Language">
              <option value="python">Python</option>
              <option value="streamlit">Streamlit</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>
          
          <div class="toolbar-section streamlit-controls">
            <button class="toolbar-btn" id="generate-streamlit-btn" title="Generate Streamlit App">🎯 Generate App</button>
            <button class="toolbar-btn" id="preview-streamlit-btn" title="Preview App" disabled>👁️ Preview</button>
            <button class="toolbar-btn" id="deploy-streamlit-btn" title="Deploy App" disabled>🚀 Deploy</button>
          </div>
          
          <div class="toolbar-section">
            <button class="toolbar-btn ${this.aiAssistEnabled ? 'active' : ''}" id="ai-assist-btn" title="AI Assistance">🤖</button>
            <button class="toolbar-btn" id="ai-enhance-btn" title="Enhance Code">⚡</button>
            <button class="toolbar-btn" id="ai-debug-btn" title="Debug Code">🐛</button>
          </div>
        </div>
        
        <div class="vibecode-content">
          <div class="editor-sidebar">
            <div class="sidebar-tabs">
              <div class="sidebar-tab active" data-tab="files">📁 Files</div>
              <div class="sidebar-tab" data-tab="templates">📋 Templates</div>
              <div class="sidebar-tab" data-tab="components">🧩 Components</div>
            </div>
            
            <div class="sidebar-content">
              <div class="sidebar-panel active" id="files-panel">
                <div class="sidebar-section">
                  <h4>Recent Files</h4>
                  <div class="recent-files" id="recent-files"></div>
                </div>
                <div class="sidebar-section">
                  <h4>Project Structure</h4>
                  <div class="file-tree" id="file-tree">
                    <div class="tree-item" data-path="/">
                      <span class="tree-icon">📁</span>
                      <span class="tree-label">Root</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="sidebar-panel" id="templates-panel">
                <div class="sidebar-section">
                  <h4>Streamlit Templates</h4>
                  <div class="template-list">
                    <div class="template-item" data-template="dashboard">📊 Dashboard</div>
                    <div class="template-item" data-template="ml-model">🤖 ML Model</div>
                    <div class="template-item" data-template="data-viz">📈 Data Visualization</div>
                    <div class="template-item" data-template="chatbot">💬 Chatbot</div>
                    <div class="template-item" data-template="file-upload">📤 File Upload</div>
                    <div class="template-item" data-template="multipage">📄 Multi-page App</div>
                  </div>
                </div>
              </div>
              
              <div class="sidebar-panel" id="components-panel">
                <div class="sidebar-section">
                  <h4>Streamlit Components</h4>
                  <div class="component-list">
                    <div class="component-item" data-component="text">📝 Text Elements</div>
                    <div class="component-item" data-component="data">📊 Data Display</div>
                    <div class="component-item" data-component="charts">📈 Charts</div>
                    <div class="component-item" data-component="input">⌨️ Input Widgets</div>
                    <div class="component-item" data-component="media">🎬 Media</div>
                    <div class="component-item" data-component="layout">📐 Layout</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="editor-main">
            <div class="editor-header">
              <div class="file-tabs" id="file-tabs">
                <div class="file-tab active" data-file="main.py">
                  <span class="tab-icon">🐍</span>
                  <span class="tab-label">main.py</span>
                  <span class="tab-close">×</span>
                </div>
              </div>
              <div class="editor-status">
                <span id="cursor-position">Ln 1, Col 1</span>
                <span id="file-encoding">UTF-8</span>
                <span id="file-type">Python</span>
              </div>
            </div>
            
            <div class="editor-content">
              <!-- Rich Text Editor -->
              <div class="rich-editor-container" id="rich-editor-container" style="display: ${this.editorMode === 'rich' ? 'block' : 'none'}">
                <div class="rich-toolbar">
                  <div class="toolbar-group">
                    <button class="rich-btn" data-action="bold" title="Bold"><b>B</b></button>
                    <button class="rich-btn" data-action="italic" title="Italic"><i>I</i></button>
                    <button class="rich-btn" data-action="underline" title="Underline"><u>U</u></button>
                    <button class="rich-btn" data-action="strikethrough" title="Strikethrough"><s>S</s></button>
                  </div>
                  <div class="toolbar-group">
                    <button class="rich-btn" data-action="heading1" title="Heading 1">H1</button>
                    <button class="rich-btn" data-action="heading2" title="Heading 2">H2</button>
                    <button class="rich-btn" data-action="heading3" title="Heading 3">H3</button>
                  </div>
                  <div class="toolbar-group">
                    <button class="rich-btn" data-action="bulletList" title="Bullet List">• List</button>
                    <button class="rich-btn" data-action="orderedList" title="Numbered List">1. List</button>
                    <button class="rich-btn" data-action="blockquote" title="Quote">" Quote</button>
                  </div>
                  <div class="toolbar-group">
                    <button class="rich-btn" data-action="code" title="Inline Code">&lt;/&gt;</button>
                    <button class="rich-btn" data-action="codeBlock" title="Code Block">{ }</button>
                    <button class="rich-btn" data-action="link" title="Link">🔗</button>
                    <button class="rich-btn" data-action="image" title="Image">🖼️</button>
                  </div>
                  <div class="toolbar-group">
                    <button class="rich-btn" data-action="ai-complete" title="AI Complete">🤖 Complete</button>
                    <button class="rich-btn" data-action="ai-streamlit" title="Convert to Streamlit">🎯 To App</button>
                  </div>
                </div>
                <div class="rich-editor" id="rich-editor" contenteditable="true" placeholder="Start writing your app description or requirements..."></div>
              </div>
              
              <!-- Code Editor -->
              <div class="code-editor-container" id="code-editor-container" style="display: ${this.editorMode === 'code' ? 'block' : 'none'}">
                <div class="code-editor-wrapper">
                  <div class="line-numbers" id="line-numbers"></div>
                  <textarea id="code-editor" class="code-editor" placeholder="# Start coding your Streamlit app...
import streamlit as st

st.title('My Streamlit App')
st.write('Hello, World!')"></textarea>
                </div>
              </div>
              
              <!-- Preview Panel -->
              <div class="preview-container" id="preview-container" style="display: ${this.editorMode === 'preview' ? 'block' : 'none'}">
                <div class="preview-toolbar">
                  <button class="preview-btn" id="refresh-preview">🔄 Refresh</button>
                  <button class="preview-btn" id="fullscreen-preview">⛶ Fullscreen</button>
                  <button class="preview-btn" id="share-preview">📤 Share</button>
                </div>
                <div class="preview-frame-container">
                  <iframe id="preview-frame" class="preview-frame" src="about:blank"></iframe>
                </div>
              </div>
            </div>
          </div>
          
          <div class="output-panel" id="output-panel">
            <div class="panel-header">
              <div class="panel-tabs">
                <div class="panel-tab active" data-panel="console">🖥️ Console</div>
                <div class="panel-tab" data-panel="terminal">⚡ Terminal</div>
                <div class="panel-tab" data-panel="ai-assistant">🤖 AI Assistant</div>
                <div class="panel-tab" data-panel="requirements">📦 Requirements</div>
              </div>
              <div class="panel-controls">
                <button class="panel-btn" id="clear-output">🗑️</button>
                <button class="panel-btn" id="toggle-panel">👁️</button>
              </div>
            </div>
            <div class="panel-content">
              <div class="panel-section active" id="console-panel">
                <div class="console-output" id="console-output"></div>
                <div class="console-input">
                  <span class="console-prompt">>>> </span>
                  <input type="text" id="console-input" placeholder="Execute Python code...">
                  <button id="console-send">Run</button>
                </div>
              </div>
              
              <div class="panel-section" id="terminal-panel">
                <div class="terminal-output" id="terminal-output"></div>
                <div class="terminal-input">
                  <span class="terminal-prompt">$ </span>
                  <input type="text" id="terminal-input" placeholder="streamlit run app.py">
                </div>
              </div>
              
              <div class="panel-section" id="ai-assistant-panel">
                <div class="ai-chat" id="ai-chat"></div>
                <div class="ai-input-container">
                  <textarea id="ai-input" placeholder="Describe the Streamlit app you want to create..." rows="3"></textarea>
                  <button id="ai-send">Generate</button>
                </div>
              </div>
              
              <div class="panel-section" id="requirements-panel">
                <div class="requirements-header">
                  <h4>Python Requirements</h4>
                  <button id="install-requirements">📦 Install All</button>
                </div>
                <div class="requirements-list" id="requirements-list">
                  <div class="requirement-item">
                    <span class="req-name">streamlit</span>
                    <span class="req-version">>=1.28.0</span>
                    <span class="req-status installed">✅</span>
                  </div>
                </div>
                <div class="add-requirement">
                  <input type="text" id="new-requirement" placeholder="package-name>=version">
                  <button id="add-requirement">+ Add</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Streamlit Generation Dialog -->
        <div class="streamlit-dialog" id="streamlit-dialog" style="display: none;">
          <div class="dialog-content">
            <div class="dialog-header">
              <h3>🎯 Generate Streamlit App</h3>
              <button class="close-btn" id="close-dialog">✕</button>
            </div>
            <div class="dialog-body">
              <div class="generation-step active" id="step-describe">
                <h4>Describe Your App</h4>
                <textarea id="app-description" placeholder="Describe the Streamlit app you want to create. Be specific about:
- What data it should handle
- What visualizations you want
- What user interactions you need
- Any specific libraries or models to use

Example: 'Create a stock price dashboard that shows real-time data with interactive charts, allows users to select different stocks, and predicts future prices using a simple ML model.'" rows="8"></textarea>
                <div class="step-actions">
                  <button id="analyze-description" class="primary-btn">🔍 Analyze & Generate</button>
                </div>
              </div>
              
              <div class="generation-step" id="step-configure">
                <h4>Configure Components</h4>
                <div class="component-config">
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
                </div>
                <div class="step-actions">
                  <button id="back-to-describe" class="secondary-btn">← Back</button>
                  <button id="generate-code" class="primary-btn">⚡ Generate Code</button>
                </div>
              </div>
              
              <div class="generation-step" id="step-review">
                <h4>Review Generated Code</h4>
                <div class="code-preview">
                  <pre id="generated-code-preview"></pre>
                </div>
                <div class="step-actions">
                  <button id="back-to-configure" class="secondary-btn">← Back</button>
                  <button id="accept-code" class="primary-btn">✅ Accept & Insert</button>
                  <button id="regenerate-code" class="secondary-btn">🔄 Regenerate</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- AI Enhancement Panel -->
        <div class="ai-enhancement-panel" id="ai-enhancement-panel" style="display: none;">
          <div class="enhancement-header">
            <h3>🤖 AI Code Enhancement</h3>
            <button class="close-btn" id="close-enhancement">✕</button>
          </div>
          <div class="enhancement-content">
            <div class="enhancement-options">
              <button class="enhancement-btn" data-action="optimize">⚡ Optimize Performance</button>
              <button class="enhancement-btn" data-action="refactor">🔧 Refactor Code</button>
              <button class="enhancement-btn" data-action="add-features">➕ Add Features</button>
              <button class="enhancement-btn" data-action="fix-bugs">🐛 Fix Issues</button>
              <button class="enhancement-btn" data-action="add-comments">💬 Add Comments</button>
              <button class="enhancement-btn" data-action="style-improve">🎨 Improve Styling</button>
            </div>
            <div class="enhancement-result" id="enhancement-result"></div>
          </div>
        </div>
      </div>
    `;

    const window = this.desktop.createWindow({
      title: 'VibeCode - AI-Powered Streamlit Editor',
      content: content,
      width: 1400,
      height: 900,
      resizable: true
    });

    this.setupEventListeners(window);
    this.initializeEditor(window);
    this.populateRecentFiles(window);
    this.loadDefaultRequirements(window);
    
    return window;
  }

  setupEventListeners(window) {
    // File operations
    window.querySelector('#new-file-btn').addEventListener('click', () => this.newFile(window));
    window.querySelector('#open-file-btn').addEventListener('click', () => this.openFile(window));
    window.querySelector('#save-file-btn').addEventListener('click', () => this.saveFile(window));
    window.querySelector('#save-as-btn').addEventListener('click', () => this.saveAsFile(window));

    // Mode switching
    window.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchMode(window, btn.dataset.mode));
    });

    // Streamlit operations
    window.querySelector('#generate-streamlit-btn').addEventListener('click', () => this.showStreamlitDialog(window));
    window.querySelector('#preview-streamlit-btn').addEventListener('click', () => this.previewStreamlit(window));
    window.querySelector('#deploy-streamlit-btn').addEventListener('click', () => this.deployStreamlit(window));

    // AI operations
    window.querySelector('#ai-assist-btn').addEventListener('click', () => this.toggleAIAssist(window));
    window.querySelector('#ai-enhance-btn').addEventListener('click', () => this.showEnhancementPanel(window));
    window.querySelector('#ai-debug-btn').addEventListener('click', () => this.debugWithAI(window));

    // Rich text editor
    this.setupRichTextEditor(window);

    // Code editor
    const codeEditor = window.querySelector('#code-editor');
    codeEditor.addEventListener('input', () => this.onCodeEditorChange(window));
    codeEditor.addEventListener('keydown', (e) => this.handleKeyDown(window, e));

    // Sidebar tabs
    window.querySelectorAll('.sidebar-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchSidebarTab(window, tab.dataset.tab));
    });

    // Template selection
    window.querySelectorAll('.template-item').forEach(item => {
      item.addEventListener('click', () => this.loadTemplate(window, item.dataset.template));
    });

    // Component insertion
    window.querySelectorAll('.component-item').forEach(item => {
      item.addEventListener('click', () => this.insertComponent(window, item.dataset.component));
    });

    // Panel tabs
    window.querySelectorAll('.panel-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchPanel(window, tab.dataset.panel));
    });

    // Console and terminal
    window.querySelector('#console-send').addEventListener('click', () => this.executeCode(window));
    window.querySelector('#console-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.executeCode(window);
    });

    // AI Assistant
    window.querySelector('#ai-send').addEventListener('click', () => this.sendAIMessage(window));
    window.querySelector('#ai-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendAIMessage(window);
      }
    });

    // Streamlit dialog
    this.setupStreamlitDialog(window);

    // Enhancement panel
    this.setupEnhancementPanel(window);

    // Requirements management
    window.querySelector('#install-requirements').addEventListener('click', () => this.installRequirements(window));
    window.querySelector('#add-requirement').addEventListener('click', () => this.addRequirement(window));

    // Preview controls
    window.querySelector('#refresh-preview').addEventListener('click', () => this.refreshPreview(window));
    window.querySelector('#fullscreen-preview').addEventListener('click', () => this.fullscreenPreview(window));
    window.querySelector('#share-preview').addEventListener('click', () => this.sharePreview(window));
  }

  // Enhanced methods for Streamlit generation and rich text editing

  switchMode(window, mode) {
    this.editorMode = mode;
    
    // Update mode buttons
    window.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    
    // Show/hide appropriate editors
    window.querySelector('#rich-editor-container').style.display = mode === 'rich' ? 'block' : 'none';
    window.querySelector('#code-editor-container').style.display = mode === 'code' ? 'block' : 'none';
    window.querySelector('#preview-container').style.display = mode === 'preview' ? 'block' : 'none';
    
    if (mode === 'preview') {
      this.refreshPreview(window);
    }
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
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const code = document.createElement('code');
      code.style.background = '#f0f0f0';
      code.style.padding = '2px 4px';
      code.style.borderRadius = '3px';
      code.style.fontFamily = 'monospace';
      range.surroundContents(code);
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
    
    const selection = window.getSelection();
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

  switchSidebarTab(window, tabName) {
    window.querySelectorAll('.sidebar-tab').forEach(tab => tab.classList.remove('active'));
    window.querySelectorAll('.sidebar-panel').forEach(panel => panel.classList.remove('active'));
    
    window.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    window.querySelector(`#${tabName}-panel`).classList.add('active');
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

  // Placeholder methods for remaining functionality
  newFile(window) { /* Implementation */ }
  openFile(window) { /* Implementation */ }
  saveFile(window) { /* Implementation */ }
  saveAsFile(window) { /* Implementation */ }
  populateRecentFiles(window) { /* Implementation */ }
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
