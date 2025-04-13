/**
 * TypeScript implementation of Text Editor Tool functionality
 * Equivalent to Rust developer module text editing capabilities
 */

import { Tool, ToolRequest, ToolResult, createSuccessToolResult, createErrorToolResult } from '../mcp-core/tool';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);
const accessAsync = promisify(fs.access);
const mkdirAsync = promisify(fs.mkdir);

// Store history of edits for undo functionality
interface EditHistory {
  path: string;
  originalContent: string;
  editedContent: string;
  timestamp: number;
}

// A simple in-memory edit history storage
const editHistory: EditHistory[] = [];

/**
 * Text editor tool definition
 */
export const textEditorTool: Tool = {
  name: 'developer__text_editor',
  description: 'Perform text editing operations on files.',
  parameters: {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The operation to perform: view, write, str_replace, or undo_edit',
        enum: ['view', 'write', 'str_replace', 'undo_edit']
      },
      path: {
        type: 'string',
        description: 'Path to the file to operate on'
      },
      file_text: {
        type: 'string',
        description: 'The text to write to the file (for write command)'
      },
      old_str: {
        type: 'string',
        description: 'The string to replace (for str_replace command)'
      },
      new_str: {
        type: 'string',
        description: 'The replacement string (for str_replace command)'
      }
    },
    required: ['command', 'path']
  },
  enabledForAI: true
};

/**
 * Execute the text editor tool
 */
export async function executeTextEditor(request: ToolRequest): Promise<ToolResult> {
  const { command, path: filePath, file_text, old_str, new_str } = request.parameters;
  
  if (!command || !filePath) {
    return createErrorToolResult(
      request,
      'Missing required parameters: command and path must be provided',
      { required: ['command', 'path'] }
    );
  }
  
  try {
    switch (command) {
      case 'view':
        return await viewFile(request, filePath);
        
      case 'write':
        if (file_text === undefined) {
          return createErrorToolResult(
            request,
            'Missing required parameter: file_text must be provided for write command',
            { required: ['file_text'] }
          );
        }
        return await writeFile(request, filePath, file_text);
        
      case 'str_replace':
        if (old_str === undefined || new_str === undefined) {
          return createErrorToolResult(
            request,
            'Missing required parameters: old_str and new_str must be provided for str_replace command',
            { required: ['old_str', 'new_str'] }
          );
        }
        return await replaceInFile(request, filePath, old_str, new_str);
        
      case 'undo_edit':
        return await undoEdit(request, filePath);
        
      default:
        return createErrorToolResult(
          request,
          `Invalid command: ${command}. Valid commands are view, write, str_replace, and undo_edit.`,
          { valid: ['view', 'write', 'str_replace', 'undo_edit'] }
        );
    }
  } catch (error) {
    return createErrorToolResult(
      request,
      `Error executing text editor command: ${error.message}`,
      { stack: error.stack }
    );
  }
}

/**
 * View the contents of a file
 */
async function viewFile(request: ToolRequest, filePath: string): Promise<ToolResult> {
  try {
    // Check if file exists
    await accessAsync(filePath, fs.constants.R_OK);
    
    // Read the file
    const content = await readFileAsync(filePath, 'utf8');
    
    return createSuccessToolResult(request, content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return createErrorToolResult(
        request,
        `File not found: ${filePath}`,
        { code: 'ENOENT' }
      );
    }
    
    throw error;
  }
}

/**
 * Write content to a file
 */
async function writeFile(request: ToolRequest, filePath: string, content: string): Promise<ToolResult> {
  try {
    // Ensure directory exists
    const dirPath = path.dirname(filePath);
    await ensureDirectoryExists(dirPath);
    
    // Check if file exists to store original content for undo
    let originalContent = '';
    try {
      originalContent = await readFileAsync(filePath, 'utf8');
    } catch (error) {
      // File doesn't exist, which is fine for a write operation
    }
    
    // Write the file
    await writeFileAsync(filePath, content, 'utf8');
    
    // Store edit history
    editHistory.push({
      path: filePath,
      originalContent,
      editedContent: content,
      timestamp: Date.now()
    });
    
    return createSuccessToolResult(request, `Wrote ${content.length} bytes to ${filePath}`);
  } catch (error) {
    throw error;
  }
}

/**
 * Replace a string in a file
 */
async function replaceInFile(request: ToolRequest, filePath: string, oldStr: string, newStr: string): Promise<ToolResult> {
  try {
    // Check if file exists
    await accessAsync(filePath, fs.constants.R_OK | fs.constants.W_OK);
    
    // Read the file
    const content = await readFileAsync(filePath, 'utf8');
    
    // Check if oldStr exists in the file
    if (!content.includes(oldStr)) {
      return createErrorToolResult(
        request,
        `String not found in file: ${oldStr}`,
        { file: filePath }
      );
    }
    
    // Replace the string
    const newContent = content.replace(oldStr, newStr);
    
    // Store edit history
    editHistory.push({
      path: filePath,
      originalContent: content,
      editedContent: newContent,
      timestamp: Date.now()
    });
    
    // Write the file
    await writeFileAsync(filePath, newContent, 'utf8');
    
    return createSuccessToolResult(
      request,
      `Replaced '${oldStr}' with '${newStr}' in ${filePath}`
    );
  } catch (error) {
    if (error.code === 'ENOENT') {
      return createErrorToolResult(
        request,
        `File not found: ${filePath}`,
        { code: 'ENOENT' }
      );
    }
    
    throw error;
  }
}

/**
 * Undo the last edit to a file
 */
async function undoEdit(request: ToolRequest, filePath: string): Promise<ToolResult> {
  // Find the most recent edit for this file
  const edits = editHistory
    .filter(edit => edit.path === filePath)
    .sort((a, b) => b.timestamp - a.timestamp);
  
  if (edits.length === 0) {
    return createErrorToolResult(
      request,
      `No edit history found for: ${filePath}`,
      { file: filePath }
    );
  }
  
  try {
    // Get the most recent edit
    const lastEdit = edits[0];
    
    // Restore the original content
    await writeFileAsync(filePath, lastEdit.originalContent, 'utf8');
    
    // Remove this edit from history
    const index = editHistory.findIndex(
      edit => edit.path === filePath && edit.timestamp === lastEdit.timestamp
    );
    if (index !== -1) {
      editHistory.splice(index, 1);
    }
    
    return createSuccessToolResult(
      request,
      `Undid last edit to ${filePath}`
    );
  } catch (error) {
    throw error;
  }
}

/**
 * Ensure a directory exists
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await accessAsync(dirPath, fs.constants.F_OK);
  } catch (error) {
    // Directory doesn't exist, create it
    await mkdirAsync(dirPath, { recursive: true });
  }
}
