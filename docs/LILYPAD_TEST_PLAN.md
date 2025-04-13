# Lilypad Integration Test Plan

This document outlines the comprehensive testing plan for the Lilypad provider integration in the swissknife application.

## 1. Test Objectives

- Verify the successful integration of Lilypad as a provider
- Validate API key handling and environment variable support
- Ensure proper model fetching and selection
- Confirm chat completions functionality
- Verify image generation capabilities
- Validate error handling for various failure scenarios

## 2. Test Environment

### 2.1. Requirements

- Node.js version 16 or higher
- NPM or Yarn package manager
- Local development environment with swissknife codebase
- Valid Lilypad API key for testing

### 2.2. Setup Instructions

1. Clone the swissknife repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables:
   ```
   LILYPAD_API_KEY=your_valid_api_key
   ```
4. Build and run the application:
   ```
   npm run build
   npm run dev
   ```

## 3. Test Cases

### 3.1. Provider Configuration Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|----------------|
| TC-L-001 | Verify Lilypad appears in providers list | 1. Open swissknife<br>2. Check providers list | Lilypad should appear in the providers dropdown |
| TC-L-002 | Verify Lilypad base URL configuration | 1. Inspect network requests when using Lilypad | Requests should be sent to `https://anura-testnet.lilypad.tech/api/v1` |
| TC-L-003 | Verify Lilypad appears in ProviderType | 1. Check TypeScript type definitions<br>2. Verify provider type includes 'lilypad' | 'lilypad' should be included in the ProviderType definition |

### 3.2. API Key Handling Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|----------------|
| TC-L-004 | Verify manual API key input | 1. Select Lilypad provider<br>2. Enter valid API key<br>3. Continue | Key should be accepted and models should load |
| TC-L-005 | Test LILYPAD_API_KEY environment variable | 1. Set LILYPAD_API_KEY env var<br>2. Select Lilypad provider | Key should be auto-populated from environment variable |
| TC-L-006 | Test ANURA_API_KEY environment variable | 1. Remove LILYPAD_API_KEY env var<br>2. Set ANURA_API_KEY env var<br>3. Select Lilypad provider | Key should be auto-populated from ANURA_API_KEY |
| TC-L-007 | Verify API key instructions | 1. Select Lilypad provider<br>2. Navigate to API key screen | Instructions should mention Anura API and link to get a key |
| TC-L-008 | Test invalid API key error handling | 1. Select Lilypad provider<br>2. Enter invalid API key<br>3. Continue | Appropriate error message should display with link to get a valid key |

### 3.3. Model Fetching Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|----------------|
| TC-L-009 | Verify models list is populated | 1. Select Lilypad with valid key<br>2. Navigate to model selection | Models list should be populated with Lilypad models |
| TC-L-010 | Verify model properties | 1. Inspect models in UI<br>2. Check model properties | Models should have correct IDs, token limits, and capabilities |
| TC-L-011 | Verify chat models appear correctly | 1. Filter for chat models | Chat models should appear with correct mode and capabilities |
| TC-L-012 | Verify image models appear correctly | 1. Filter for image models | sdxl-turbo should appear with correct mode |
| TC-L-013 | Test model filtering | 1. Apply various filters | Filters should work correctly with Lilypad models |

### 3.4. Chat Completion Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|----------------|
| TC-L-014 | Test basic chat completion | 1. Select a Lilypad chat model<br>2. Enter a prompt<br>3. Submit | Model should respond with appropriate completion |
| TC-L-015 | Test system message handling | 1. Set a system message<br>2. Submit a prompt | Response should respect system message instructions |
| TC-L-016 | Test temperature parameter | 1. Adjust temperature<br>2. Submit identical prompts | Responses at different temperatures should vary in creativity |
| TC-L-017 | Test max tokens parameter | 1. Set max tokens to a low value<br>2. Submit a prompt requiring longer response | Response should be truncated at specified token limit |
| TC-L-018 | Test function calling | 1. Select model with function calling support<br>2. Define functions<br>3. Submit relevant prompt | Model should properly call the defined functions |
| TC-L-019 | Test conversation history | 1. Have multi-turn conversation<br>2. Reference earlier messages | Model should maintain context across conversation turns |

### 3.5. Image Generation Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|----------------|
| TC-L-020 | Test basic image generation | 1. Select sdxl-turbo model<br>2. Enter image prompt<br>3. Submit | Image should be generated and displayed |
| TC-L-021 | Test image size parameter | 1. Set different sizes<br>2. Generate images | Images should be generated at specified sizes |
| TC-L-022 | Test multiple images generation | 1. Set n parameter > 1<br>2. Generate images | Multiple variations should be generated |
| TC-L-023 | Test image prompt handling | 1. Test various prompt types<br>2. Include detailed descriptions | Generated images should reflect prompt content |

### 3.6. Error Handling Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|----------------|
| TC-L-024 | Test network error handling | 1. Disconnect from network<br>2. Attempt to use Lilypad | Appropriate network error message should display |
| TC-L-025 | Test model not found error | 1. Request non-existent model | Appropriate error message should display |
| TC-L-026 | Test rate limit handling | 1. Rapidly submit multiple requests | Rate limit errors should be handled gracefully |
| TC-L-027 | Test timeout handling | 1. Set short timeout<br>2. Submit complex prompt | Timeout should be handled gracefully |
| TC-L-028 | Test invalid request handling | 1. Submit invalid parameters | Appropriate error message should display |

## 4. Performance Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|----------------|
| TC-L-029 | Measure response time | 1. Submit typical prompts<br>2. Measure time to first token and complete response | Response times should be within acceptable limits |
| TC-L-030 | Test token usage calculation | 1. Submit prompts with known token counts<br>2. Check reported token usage | Token usage should be accurately calculated and reported |
| TC-L-031 | Test concurrent requests | 1. Submit multiple requests concurrently | Requests should be handled properly without errors |

## 5. Integration Tests

| Test ID | Description | Steps | Expected Result |
|---------|-------------|-------|----------------|
| TC-L-032 | Test provider switching | 1. Switch between Lilypad and other providers | Application should handle provider switching smoothly |
| TC-L-033 | Test chat history persistence | 1. Have conversation with Lilypad model<br>2. Switch models<br>3. Return to previous model | Chat history should persist correctly |
| TC-L-034 | Test configuration persistence | 1. Configure Lilypad settings<br>2. Restart application | Settings should be persisted correctly |

## 6. Automated Testing

### 6.1. Unit Tests

The following unit tests should be implemented:

```typescript
// Example unit tests for Lilypad integration
describe('Lilypad Provider Integration', () => {
  describe('API Key Handling', () => {
    it('should accept valid API key', async () => {
      // Test implementation
    });
    
    it('should reject invalid API key with appropriate error', async () => {
      // Test implementation
    });
    
    it('should use ANURA_API_KEY environment variable as fallback', async () => {
      // Test implementation
    });
  });
  
  describe('Model Fetching', () => {
    it('should fetch models successfully with valid key', async () => {
      // Test implementation
    });
    
    it('should transform API response into correct model format', async () => {
      // Test implementation
    });
  });
  
  describe('Chat Completions', () => {
    it('should successfully complete chat prompts', async () => {
      // Test implementation
    });
    
    it('should handle function calling correctly', async () => {
      // Test implementation
    });
  });
  
  describe('Image Generation', () => {
    it('should generate images with sdxl-turbo model', async () => {
      // Test implementation
    });
  });
});
```

### 6.2. Integration Tests

```typescript
// Example integration tests
describe('Lilypad End-to-End Tests', () => {
  it('should complete full user flow from provider selection to chat', async () => {
    // Test implementation
  });
  
  it('should handle provider switching without errors', async () => {
    // Test implementation
  });
});
```

## 7. Test Data

### 7.1. Test API Keys

- Valid API key: [Obtain from Anura dashboard]
- Invalid format API key: "invalid-key-format"
- Expired/revoked API key: [Obtain expired key for testing]

### 7.2. Test Prompts

#### Chat Test Prompts

- Basic information request: "Tell me about the solar system"
- Creative writing: "Write a short story about a robot learning to paint"
- Function calling test: "What's the weather in San Francisco?"
- Multi-turn conversation: 
  1. "Who was Albert Einstein?"
  2. "When was he born?"
  3. "What were his major contributions?"

#### Image Generation Test Prompts

- Basic image: "A cat sitting on a windowsill"
- Detailed image: "A futuristic cityscape with flying cars and neon lights, photorealistic style"
- Abstract concept: "Visualization of happiness"

## 8. Test Schedule

| Phase | Start Date | End Date | Focus Areas |
|-------|------------|----------|-------------|
| Unit Testing | TBD | TBD | API key handling, model fetching |
| Integration Testing | TBD | TBD | Provider selection, chat completions |
| Manual Testing | TBD | TBD | UI verification, error handling |
| Performance Testing | TBD | TBD | Response times, concurrent requests |
| Final Verification | TBD | TBD | Full end-to-end testing |

## 9. Test Reporting

### 9.1. Test Results Template

For each test case, record the following information:

- Test ID
- Test Date
- Tester Name
- Pass/Fail Status
- Actual Result
- Notes/Issues
- Screenshots (if applicable)

### 9.2. Issue Reporting

For any failures, create an issue with the following information:

- Issue Title: [Test ID] - Brief description
- Description: Detailed description of the issue
- Steps to Reproduce: Numbered steps to reproduce the issue
- Expected Result: What should happen
- Actual Result: What actually happened
- Environment: Browser, OS, etc.
- Severity: Critical/High/Medium/Low
- Screenshots/Videos: Visual evidence if applicable

## 10. Test Completion Criteria

The Lilypad integration testing will be considered complete when:

1. All test cases have been executed
2. All critical and high-severity issues have been resolved
3. 95% of all test cases pass
4. Performance metrics meet acceptable thresholds
5. All documentation has been updated to reflect the final implementation

## Appendix A: Testing Tools

- Jest: For unit and integration testing
- React Testing Library: For UI component testing
- Cypress: For end-to-end testing
- Chrome DevTools: For network and performance monitoring
- Postman: For direct API testing

## Appendix B: Test Environment Setup Script

```bash
#!/bin/bash
# Setup script for Lilypad integration testing

# Install dependencies
npm install

# Set up environment variables
export LILYPAD_API_KEY="your_test_key_here"

# Build the application
npm run build

# Start the application in test mode
npm run dev
