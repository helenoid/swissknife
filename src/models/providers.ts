// src/models/providers.ts

import { Provider } from './registry.js';

/**
 * OpenAI provider configuration
 */
export const openAIProvider: Provider = {
  id: 'openai',
  name: 'OpenAI',
  envVar: 'OPENAI_API_KEY',
  baseURL: 'https://api.openai.com/v1',
  defaultModel: 'gpt-4o',
  models: [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      maxTokens: 128000,
      capabilities: {
        streaming: true,
        images: true,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'current'
    },
    {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      maxTokens: 128000,
      capabilities: {
        streaming: true,
        images: true,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'current'
    },
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'openai',
      maxTokens: 8192,
      capabilities: {
        streaming: true,
        images: false,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'current'
    },
    {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      maxTokens: 4096,
      capabilities: {
        streaming: true,
        images: false,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'current'
    }
  ]
};

/**
 * Anthropic provider configuration
 */
export const anthropicProvider: Provider = {
  id: 'anthropic',
  name: 'Anthropic',
  envVar: 'ANTHROPIC_API_KEY',
  baseURL: 'https://api.anthropic.com/v1',
  defaultModel: 'claude-3-opus',
  models: [
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      maxTokens: 200000,
      capabilities: {
        streaming: true,
        images: true,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'current'
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      maxTokens: 200000,
      capabilities: {
        streaming: true,
        images: true,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'current'
    },
    {
      id: 'claude-3-haiku',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      maxTokens: 200000,
      capabilities: {
        streaming: true,
        images: true,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'current'
    }
  ]
};

/**
 * Google provider configuration
 */
export const googleProvider: Provider = {
  id: 'google',
  name: 'Google',
  envVar: 'GOOGLE_API_KEY',
  baseURL: 'https://generativelanguage.googleapis.com/v1',
  defaultModel: 'gemini-pro',
  models: [
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'google',
      maxTokens: 32000,
      capabilities: {
        streaming: true,
        images: false,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'current'
    },
    {
      id: 'gemini-pro-vision',
      name: 'Gemini Pro Vision',
      provider: 'google',
      maxTokens: 32000,
      capabilities: {
        streaming: true,
        images: true,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'current'
    }
  ]
};

/**
 * Mistral provider configuration
 */
export const mistralProvider: Provider = {
  id: 'mistral',
  name: 'Mistral AI',
  envVar: 'MISTRAL_API_KEY',
  baseURL: 'https://api.mistral.ai/v1',
  defaultModel: 'mistral-large',
  models: [
    {
      id: 'mistral-large',
      name: 'Mistral Large',
      provider: 'mistral',
      maxTokens: 32000,
      capabilities: {
        streaming: true,
        images: false,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'current'
    },
    {
      id: 'mistral-medium',
      name: 'Mistral Medium',
      provider: 'mistral',
      maxTokens: 32000,
      capabilities: {
        streaming: true,
        images: false,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'current'
    },
    {
      id: 'mistral-small',
      name: 'Mistral Small',
      provider: 'mistral',
      maxTokens: 32000,
      capabilities: {
        streaming: true,
        images: false,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'current'
    }
  ]
};

/**
 * Goose provider configuration
 */
export const gooseProvider: Provider = {
  id: 'goose',
  name: 'Goose',
  envVar: 'GOOSE_API_KEY',
  defaultModel: 'goose-default',
  models: [
    {
      id: 'goose-default',
      name: 'Goose Default',
      provider: 'goose',
      capabilities: {
        streaming: true,
        images: false,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'goose'
    },
    {
      id: 'goose-vision',
      name: 'Goose Vision',
      provider: 'goose',
      capabilities: {
        streaming: true,
        images: true,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'goose'
    }
  ]
};

/**
 * Legacy SwissKnife provider configuration
 */
export const legacyProvider: Provider = {
  id: 'legacy',
  name: 'SwissKnife Legacy',
  envVar: 'SWISSKNIFE_API_KEY',
  defaultModel: 'legacy-model-1',
  models: [
    {
      id: 'legacy-model-1',
      name: 'Legacy Model 1',
      provider: 'legacy',
      capabilities: {
        streaming: false,
        images: false,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'swissknife_old'
    },
    {
      id: 'legacy-model-2',
      name: 'Legacy Model 2',
      provider: 'legacy',
      capabilities: {
        streaming: false,
        images: true,
        audio: false,
        video: false,
        vectors: false
      },
      source: 'swissknife_old'
    }
  ]
};

/**
 * List of all standard providers
 */
export const standardProviders = [
  openAIProvider,
  anthropicProvider,
  googleProvider,
  mistralProvider,
  gooseProvider,
  legacyProvider
];