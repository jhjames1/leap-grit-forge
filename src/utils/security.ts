import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';
import { logger } from './logger';
import DOMPurify from 'dompurify';

// Security configuration
const SALT_ROUNDS = 12;
// Use environment variable or generate secure key in production
const ENCRYPTION_KEY = typeof window !== 'undefined' ? 
  (window.crypto?.getRandomValues ? 
    Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0')).join('') 
    : 'fallback-key-please-set-environment-variable'
  ) : 'server-side-fallback-key';

// Password hashing utilities
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Data encryption utilities
export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

export const decryptData = (encryptedData: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
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
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
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

// Rate limiting for login attempts
export const checkRateLimit = (identifier: string): { allowed: boolean; timeLeft?: number } => {
  const rateLimitKey = `rate_limit_${identifier}`;
  const attempts = JSON.parse(localStorage.getItem(rateLimitKey) || '[]');
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;
  
  // Filter attempts within the time window
  const recentAttempts = attempts.filter((time: number) => now - time < windowMs);
  
  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = Math.min(...recentAttempts);
    const timeLeft = windowMs - (now - oldestAttempt);
    return { allowed: false, timeLeft };
  }
  
  return { allowed: true };
};

export const recordAttempt = (identifier: string): void => {
  const rateLimitKey = `rate_limit_${identifier}`;
  const attempts = JSON.parse(localStorage.getItem(rateLimitKey) || '[]');
  attempts.push(Date.now());
  localStorage.setItem(rateLimitKey, JSON.stringify(attempts));
};

// Security logging
export const logSecurityEvent = (event: string, details?: any): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  const logs = JSON.parse(localStorage.getItem('security_logs') || '[]');
  logs.push(logEntry);
  
  // Keep only last 100 logs
  if (logs.length > 100) {
    logs.splice(0, logs.length - 100);
  }
  
  localStorage.setItem('security_logs', JSON.stringify(logs));
};
