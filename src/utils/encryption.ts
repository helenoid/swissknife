// src/utils/encryption.ts

import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync, generateKeyPairSync } from 'crypto';

/**
 * Encryption utility functions for the SwissKnife application
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;

/**
 * Generate a random encryption key
 */
export function generateKey(): string {
  return randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Derive a key from a password using PBKDF2
 */
export function deriveKey(password: string, salt?: Buffer): { key: Buffer; salt: Buffer } {
  const saltBuffer = salt || randomBytes(SALT_LENGTH);
  const key = pbkdf2Sync(password, saltBuffer, 100000, KEY_LENGTH, 'sha512');
  return { key, salt: saltBuffer };
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(data: string, key?: string): string {
  try {
    const keyBuffer = key ? Buffer.from(key, 'hex') : randomBytes(KEY_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    
    const cipher = createCipheriv(ALGORITHM, keyBuffer, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine key (if generated), iv, tag, and encrypted data
    const result = {
      key: key || keyBuffer.toString('hex'),
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      data: encrypted
    };
    
    return Buffer.from(JSON.stringify(result)).toString('base64');
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(encryptedData: string, providedKey?: string): string {
  try {
    const parsed = JSON.parse(Buffer.from(encryptedData, 'base64').toString());
    const { key: storedKey, iv, tag, data } = parsed;
    
    const keyBuffer = Buffer.from(providedKey || storedKey, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const tagBuffer = Buffer.from(tag, 'hex');
    
    const decipher = createDecipheriv(ALGORITHM, keyBuffer, ivBuffer);
    decipher.setAuthTag(tagBuffer);
    
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Generate an RSA key pair
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  return {
    publicKey,
    privateKey
  };
}

/**
 * Hash a password using PBKDF2
 */
export function hashPassword(password: string, salt?: Buffer): { hash: string; salt: string } {
  const saltBuffer = salt || randomBytes(SALT_LENGTH);
  const hash = pbkdf2Sync(password, saltBuffer, 100000, KEY_LENGTH, 'sha512');
  
  return {
    hash: hash.toString('hex'),
    salt: saltBuffer.toString('hex')
  };
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const saltBuffer = Buffer.from(salt, 'hex');
  const { hash: newHash } = hashPassword(password, saltBuffer);
  return newHash === hash;
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
  return randomBytes(length).toString('hex');
}

/**
 * Simple encryption for less sensitive data (backwards compatible)
 */
export function simpleEncrypt(data: string): string {
  return Buffer.from(data).toString('base64');
}

/**
 * Simple decryption for less sensitive data (backwards compatible)
 */
export function simpleDecrypt(data: string): string {
  return Buffer.from(data, 'base64').toString('utf8');
}
