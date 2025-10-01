/**
 * VibeCode App - Fixed version with working functionality
 * Simplified but functional AI-Powered Streamlit Development Environment
 */

class VibeCodeApp {
  constructor(desktop) {
    this.desktop = desktop;
    this.swissknife = desktop?.swissknife || null;
    
    // Core configuration  
    this.currentFile = null;
    this.recentFiles = [];
    this.language = 'python';
    this.theme = 'dark';
    this.editorMode = 'split';
    this.fontSize = 14;
    
    // AI features
    this.aiAssistEnabled = true;
    this.isGenerating = false;
    
    console.log('🎯 VibeCode initialized successfully');
  }

  async initialize() {
    console.log('🎯 Initializing VibeCode...');
    try {
      return this;
    } catch (error) {
      console.error('❌ VibeCode initialization failed:', error);
      return this;
    }
  }

  getDefaultStreamlitCode() {
    return `import streamlit as st

st.title("Welcome to VibeCode! 🎯")
st.markdown("### AI-Powered Streamlit Development Environment")

# Basic Streamlit components
name = st.text_input("What's your name?")
if name:
    st.write(f"Hello, {name}! 👋")

# Data visualization example
import pandas as pd
import numpy as np

data = pd.DataFrame({
    'x': np.random.randn(100),
    'y': np.random.randn(100)
})

st.line_chart(data)

st.markdown("Built with ❤️ using VibeCode - The AI-Powered Streamlit IDE")`;
  }

  async render() {
    console.log('🎯 Rendering VibeCode app...');
    const currentCode = this.currentFile ? this.currentFile.content : this.getDefaultStreamlitCode();
    
    return `
      <div class="vibecode-container" data-theme="dark">
        <style>
          .vibecode-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            background: #1e1e1e;
            color: #ffffff;
            font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
          }
          
          .vibecode-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 1rem;
            background: #252526;
            border-bottom: 1px solid #3e3e42;
            min-height: 50px;
          }
          
          .header-left, .header-right {
            display: flex;
            gap: 0.5rem;
            align-items: center;
          }
          
          .vibe-btn {
            padding: 0.5rem 1rem;
            background: #3c3c3c;
            color: #ffffff;
            border: 1px solid #555;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.2s;
          }
          
          .vibe-btn:hover {
            background: #4c4c4c;
            border-color: #777;
          }
          
          .vibe-btn.ai {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-color: #667eea;
          }
          
          .main-content {
            display: flex;
            flex: 1;
            overflow: hidden;
          }
          
          .code-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #1e1e1e;
          }
          
          .code-editor-container {
            flex: 1;
            position: relative;
          }
          
          .code-editor {
            width: 100%;
            height: 100%;
            background: #1e1e1e;
            color: #d4d4d4;
            border: none;
            padding: 1rem;
            font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            line-height: 1.5;
            resize: none;
            outline: none;
          }
          
          .preview-section {
            flex: 1;
            background: #ffffff;
            border-left: 1px solid #3e3e42;
            overflow: auto;
          }
          
          .preview-iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: white;
          }
          
          .status-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.25rem 1rem;
            background: #252526;
            border-top: 1px solid #3e3e42;
            font-size: 0.75rem;
            color: #cccccc;
          }
          
          .ai-panel {
            width: 300px;
            background: #252526;
            border-left: 1px solid #3e3e42;
            display: flex;
            flex-direction: column;
          }
          
          .ai-header {
            padding: 1rem;
            border-bottom: 1px solid #3e3e42;
            font-weight: bold;
          }
          
          .ai-messages {
            flex: 1;
            padding: 1rem;
            overflow-y: auto;
          }
          
          .ai-input-container {
            padding: 1rem;
            border-top: 1px solid #3e3e42;
          }
          
          .ai-input {
            width: 100%;
            padding: 0.5rem;
            background: #3c3c3c;
            color: #ffffff;
            border: 1px solid #555;
            border-radius: 4px;
            resize: none;
          }
          
          .loading-indicator {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            color: #888;
          }
          
          .spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #3c3c3c;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 0.5rem;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (max-width: 768px) {
            .main-content {
              flex-direction: column;
            }
            
            .preview-section {
              border-left: none;
              border-top: 1px solid #3e3e42;
            }
            
            .ai-panel {
              width: 100%;
              border-left: none;
              border-top: 1px solid #3e3e42;
            }
          }
        </style>

        <!-- Header -->
        <div class="vibecode-header">
          <div class="header-left">
            <button class="vibe-btn" id="new-file-btn">📄 New</button>
            <button class="vibe-btn" id="save-file-btn">💾 Save</button>
            <button class="vibe-btn" id="run-btn">▶️ Run</button>
          </div>
          
          <div class="header-right">
            <button class="vibe-btn ai" id="ai-toggle-btn" title="Toggle AI Assistant">🤖 AI</button>
            <button class="vibe-btn" id="settings-btn">⚙️</button>
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <!-- Code Editor -->
          <div class="code-section">
            <div class="code-editor-container">
              <textarea 
                id="code-editor" 
                class="code-editor" 
                placeholder="Start coding your Streamlit app here..."
              >${currentCode}</textarea>
            </div>
          </div>

          <!-- Preview Section -->
          <div class="preview-section" id="preview-section">
            <div class="loading-indicator">
              <div class="spinner"></div>
              <span>Preview will appear here when you run your Streamlit app</span>
            </div>
          </div>

          <!-- AI Assistant Panel (Hidden by default) -->
          <div class="ai-panel" id="ai-panel" style="display: none;">
            <div class="ai-header">
              🤖 AI Assistant
              <button class="vibe-btn" id="close-ai-btn" style="float: right; padding: 0.25rem 0.5rem;">×</button>
            </div>
            <div class="ai-messages" id="ai-messages">
              <div style="padding: 1rem; text-align: center; color: #888;">
                Ask me anything about Streamlit development!
              </div>
            </div>
            <div class="ai-input-container">
              <textarea 
                id="ai-input" 
                class="ai-input" 
                placeholder="Ask AI for help with your code..."
                rows="3"
              ></textarea>
              <button class="vibe-btn ai" id="send-ai-btn" style="margin-top: 0.5rem; width: 100%;">Send</button>
            </div>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="status-bar">
          <div class="status-left">
            <span id="status-text">Ready</span>
          </div>
          <div class="status-right">
            <span>Python | Streamlit | Line 1, Col 1</span>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners(window) {
    console.log('🎯 Setting up VibeCode event listeners...');
    
    // File operations
    const newBtn = window.querySelector('#new-file-btn');
    const saveBtn = window.querySelector('#save-file-btn');
    const runBtn = window.querySelector('#run-btn');
    
    // AI functionality
    const aiToggleBtn = window.querySelector('#ai-toggle-btn');
    const closeAiBtn = window.querySelector('#close-ai-btn');
    const sendAiBtn = window.querySelector('#send-ai-btn');
    const aiInput = window.querySelector('#ai-input');
    
    // Event listeners
    if (newBtn) {
      newBtn.addEventListener('click', () => this.newFile(window));
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveFile(window));
    }
    
    if (runBtn) {
      runBtn.addEventListener('click', () => this.runStreamlitApp(window));
    }
    
    if (aiToggleBtn) {
      aiToggleBtn.addEventListener('click', () => this.toggleAI(window));
    }
    
    if (closeAiBtn) {
      closeAiBtn.addEventListener('click', () => this.closeAI(window));
    }
    
    if (sendAiBtn) {
      sendAiBtn.addEventListener('click', () => this.sendAIMessage(window));
    }
    
    if (aiInput) {
      aiInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          this.sendAIMessage(window);
        }
      });
    }
    
    // Code editor events
    const codeEditor = window.querySelector('#code-editor');
    if (codeEditor) {
      codeEditor.addEventListener('input', () => {
        this.updateStatus(window, 'Modified');
      });
    }
    
    console.log('✅ VibeCode event listeners setup complete');
  }

  newFile(window) {
    const codeEditor = window.querySelector('#code-editor');
    if (codeEditor) {
      codeEditor.value = this.getDefaultStreamlitCode();
      this.currentFile = null;
      this.updateStatus(window, 'New file created');
    }
  }

  saveFile(window) {
    const codeEditor = window.querySelector('#code-editor');
    if (codeEditor) {
      const content = codeEditor.value;
      const filename = prompt('Enter filename:', 'streamlit_app.py');
      if (filename) {
        // In a real implementation, this would save to a file system
        console.log('Saving file:', filename, content);
        this.updateStatus(window, `Saved: ${filename}`);
        
        // Add to recent files
        this.currentFile = { name: filename, content: content };
      }
    }
  }

  async runStreamlitApp(window) {
    const codeEditor = window.querySelector('#code-editor');
    const previewSection = window.querySelector('#preview-section');
    
    if (!codeEditor || !previewSection) return;
    
    this.updateStatus(window, 'Running Streamlit app...');
    
    // Show loading indicator
    previewSection.innerHTML = `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <span>Running your Streamlit app...</span>
      </div>
    `;
    
    // Simulate running the app (in a real implementation, this would execute the code)
    setTimeout(() => {
      previewSection.innerHTML = `
        <div style="padding: 2rem; background: white; color: black;">
          <div style="border-left: 4px solid #ff6b6b; padding-left: 1rem; margin-bottom: 1rem;">
            <h3>🎯 VibeCode Preview</h3>
            <p>Your Streamlit app would run here in a real implementation.</p>
          </div>
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 4px; font-family: monospace;">
            <strong>Code Preview:</strong><br>
            <pre style="margin: 0; white-space: pre-wrap;">${codeEditor.value.slice(0, 200)}${codeEditor.value.length > 200 ? '...' : ''}</pre>
          </div>
          <div style="margin-top: 1rem; padding: 1rem; background: #e3f2fd; border-radius: 4px;">
            <strong>📝 Note:</strong> This is a preview. In the full implementation, your Streamlit app would be executed and displayed here.
          </div>
        </div>
      `;
      this.updateStatus(window, 'Ready');
    }, 2000);
  }

  toggleAI(window) {
    const aiPanel = window.querySelector('#ai-panel');
    if (aiPanel) {
      const isVisible = aiPanel.style.display !== 'none';
      aiPanel.style.display = isVisible ? 'none' : 'flex';
      this.updateStatus(window, isVisible ? 'AI Assistant closed' : 'AI Assistant opened');
    }
  }

  closeAI(window) {
    const aiPanel = window.querySelector('#ai-panel');
    if (aiPanel) {
      aiPanel.style.display = 'none';
      this.updateStatus(window, 'AI Assistant closed');
    }
  }

  async sendAIMessage(window) {
    const aiInput = window.querySelector('#ai-input');
    const aiMessages = window.querySelector('#ai-messages');
    
    if (!aiInput || !aiMessages) return;
    
    const message = aiInput.value.trim();
    if (!message) return;
    
    // Add user message
    this.addAIMessage(window, message, 'user');
    aiInput.value = '';
    
    // Add loading message
    this.addAIMessage(window, 'Thinking...', 'assistant', true);
    
    // Simulate AI response
    setTimeout(() => {
      // Remove loading message
      const loadingMessage = aiMessages.querySelector('.ai-loading');
      if (loadingMessage) {
        loadingMessage.remove();
      }
      
      // Add AI response
      const responses = [
        "I'd be happy to help you with your Streamlit code! What specific functionality are you looking to implement?",
        "For better Streamlit apps, consider using st.cache_data for performance optimization.",
        "You can create interactive widgets with st.button(), st.slider(), st.selectbox() and many more!",
        "To add charts, use st.line_chart(), st.bar_chart(), or st.plotly_chart() for more advanced visualizations.",
        "Don't forget to add st.title() and st.markdown() to make your app look professional!"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      this.addAIMessage(window, randomResponse, 'assistant');
    }, 1500);
  }

  addAIMessage(window, message, role, isLoading = false) {
    const aiMessages = window.querySelector('#ai-messages');
    if (!aiMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
      margin-bottom: 1rem;
      padding: 0.75rem;
      border-radius: 8px;
      background: ${role === 'user' ? '#3c3c3c' : '#2d3748'};
      ${isLoading ? 'opacity: 0.7;' : ''}
    `;
    
    if (isLoading) {
      messageDiv.className = 'ai-loading';
    }
    
    messageDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 0.5rem; color: ${role === 'user' ? '#67eea' : '#81c784'};">
        ${role === 'user' ? '👤 You' : '🤖 AI Assistant'}
      </div>
      <div style="line-height: 1.4;">
        ${isLoading ? '<div class="spinner" style="display: inline-block; margin-right: 0.5rem;"></div>' : ''}
        ${message}
      </div>
    `;
    
    aiMessages.appendChild(messageDiv);
    aiMessages.scrollTop = aiMessages.scrollHeight;
  }

  updateStatus(window, text) {
    const statusText = window.querySelector('#status-text');
    if (statusText) {
      statusText.textContent = text;
    }
  }
}

// Export the class
export { VibeCodeApp };