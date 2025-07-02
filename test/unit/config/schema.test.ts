import { ConfigSchema } from '../../../src/config/schema.ts';
import { z } from 'zod';

describe('ConfigSchema', () => {
  it('should define a schema for basic config properties', () => {
    const schema = ConfigSchema.configSchema;
    expect(schema).toBeDefined();
    // Test some basic properties
    expect(schema.shape.defaultLanguage).toBeDefined();
    expect(schema.shape.logLevel).toBeDefined();
    expect(schema.shape.maxRetries).toBeDefined();
  });

  it('should define a schema for AI models and providers', () => {
    const schema = ConfigSchema.configSchema;
    expect(schema.shape.ai).toBeDefined();
    const aiSchema = schema.shape.ai as z.ZodObject<any>;
    expect(aiSchema.shape.models).toBeDefined();
    expect(aiSchema.shape.providers).toBeDefined();
  });

  it('should define a schema for tools', () => {
    const schema = ConfigSchema.configSchema;
    expect(schema.shape.tools).toBeDefined();
    const toolsSchema = schema.shape.tools as z.ZodObject<any>;
    expect(toolsSchema.shape.enabled).toBeDefined();
    expect(toolsSchema.shape.disabled).toBeDefined();
  });

  it('should define a schema for integrations', () => {
    const schema = ConfigSchema.configSchema;
    expect(schema.shape.integrations).toBeDefined();
    const integrationsSchema = schema.shape.integrations as z.ZodObject<any>;
    expect(integrationsSchema.shape.goose).toBeDefined();
    expect(integrationsSchema.shape.ipfs_accelerate).toBeDefined();
    expect(integrationsSchema.shape.swissknife_old).toBeDefined();
  });

  it('should define a schema for storage', () => {
    const schema = ConfigSchema.configSchema;
    expect(schema.shape.storage).toBeDefined();
    const storageSchema = schema.shape.storage as z.ZodObject<any>;
    expect(storageSchema.shape.default).toBeDefined();
    expect(storageSchema.shape.ipfs).toBeDefined();
    expect(storageSchema.shape.file).toBeDefined();
  });

  it('should define a schema for telemetry', () => {
    const schema = ConfigSchema.configSchema;
    expect(schema.shape.telemetry).toBeDefined();
    const telemetrySchema = schema.shape.telemetry as z.ZodObject<any>;
    expect(telemetrySchema.shape.enabled).toBeDefined();
  });

  it('should define a schema for updates', () => {
    const schema = ConfigSchema.configSchema;
    expect(schema.shape.updates).toBeDefined();
    const updatesSchema = schema.shape.updates as z.ZodObject<any>;
    expect(updatesSchema.shape.autoCheck).toBeDefined();
  });

  it('should define a schema for security', () => {
    const schema = ConfigSchema.configSchema;
    expect(schema.shape.security).toBeDefined();
    const securitySchema = schema.shape.security as z.ZodObject<any>;
    expect(securitySchema.shape.apiKeys).toBeDefined();
  });

  it('should define a schema for logging', () => {
    const schema = ConfigSchema.configSchema;
    expect(schema.shape.logging).toBeDefined();
    const loggingSchema = schema.shape.logging as z.ZodObject<any>;
    expect(loggingSchema.shape.level).toBeDefined();
    expect(loggingSchema.shape.filePath).toBeDefined();
  });

  it('should define a schema for cli', () => {
    const schema = ConfigSchema.configSchema;
    expect(schema.shape.cli).toBeDefined();
    const cliSchema = schema.shape.cli as z.ZodObject<any>;
    expect(cliSchema.shape.historySize).toBeDefined();
  });

  it('should define a schema for experimental features', () => {
    const schema = ConfigSchema.configSchema;
    expect(schema.shape.experimental).toBeDefined();
    const experimentalSchema = schema.shape.experimental as z.ZodObject<any>;
    expect(experimentalSchema.shape.featureFlags).toBeDefined();
  });
});
