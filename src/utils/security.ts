import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import { logger } from './logger';
import DOMPurify from 'dompurify';

// Security configuration
const SALT_ROUNDS = 12;

// Use a consistent encryption key derived from a stable source
// In production, this should come from environment variables via an edge function
const getEncryptionKey = (): string => {
  const storedKey = localStorage.getItem('_app_encryption_key');
  if (storedKey) {
    return storedKey;
  }
  
  // Generate and store a new key only once per device
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    const newKey = Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('_app_encryption_key', newKey);
    return newKey;
  }
  
  // Fallback for environments without crypto
  return 'fallback-key-for-non-crypto-env';
};

// Lazy initialize the encryption key
let ENCRYPTION_KEY: string | null = null;
const getKey = (): string => {
  if (!ENCRYPTION_KEY) {
    ENCRYPTION_KEY = getEncryptionKey();
  }
  return ENCRYPTION_KEY;
};

// Password hashing utilities
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Data encryption utilities
export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, getKey()).toString();
};

export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, getKey());
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    // If decryption results in empty string, it likely failed
    if (!decrypted) {
      logger.warn('Decryption resulted in empty string, possible data corruption');
      return '';
    }
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption failed', error);
    return '';
  }
};

// Input sanitization with enhanced security
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Remove any potential XSS vectors and excessive whitespace
  const cleaned = DOMPurify.sanitize(input.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    FORBID_CONTENTS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'link'],
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur']
  });
  
  // Additional protection against SQL injection patterns
  const sqlPatterns = /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi;
  if (sqlPatterns.test(cleaned)) {
    logger.warn('Potential SQL injection attempt detected', { input: input.substring(0, 50) });
    return ''; // Return empty string for suspicious input
  }
  
  return cleaned;
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Increased minimum length for better security
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Password must not contain repeating characters');
  }
  
  // Check against common weak passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    errors.push('Password must not contain common words');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Session management
export const createSessionToken = (): string => {
  return CryptoJS.lib.WordArray.random(32).toString();
};

export const setSecureSession = (username: string, token: string): void => {
  const sessionData = {
    username,
    token,
    timestamp: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  
  localStorage.setItem('recovery_session', encryptData(JSON.stringify(sessionData)));
};

export const getSecureSession = (): { username: string; token: string } | null => {
  try {
    const encryptedSession = localStorage.getItem('recovery_session');
    if (!encryptedSession) return null;
    
    const decryptedSession = decryptData(encryptedSession);
    if (!decryptedSession) return null;
    
    const sessionData = JSON.parse(decryptedSession);
    
    // Check if session is expired
    if (sessionData.expiresAt < Date.now()) {
      clearSession();
      return null;
    }
    
    return { username: sessionData.username, token: sessionData.token };
  } catch (error) {
    logger.error('Session retrieval failed', error);
    return null;
  }
};

export const clearSession = (): void => {
  localStorage.removeItem('recovery_session');
  localStorage.removeItem('currentUser');
};

// Security logging - stored server-side via edge function in production
export const logSecurityEvent = (event: string, details?: Record<string, unknown>): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Security event:', logEntry);
  }
  
  // In production, security events should be logged server-side
  // This is just a local backup for debugging
  const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
  logs.push(logEntry);
  
  // Keep only last 100 logs
  if (logs.length > 100) {
    logs.splice(0, logs.length - 100);
  }
  
  localStorage.setItem('security_logs', JSON.stringify(logs));
};
