import { encryptData, decryptData, sanitizeInput } from './security';
import { logger } from './logger';

export class SecureStorage {
  private static encrypt = true; // Enable encryption for sensitive data
  
  // Store user data securely
  static setUserData(username: string, data: any): void {
    try {
      const sanitizedData = this.sanitizeUserData(data);
      const userKey = `user_${username.toLowerCase()}`;
      
      if (this.encrypt) {
        const encryptedData = encryptData(JSON.stringify(sanitizedData));
        localStorage.setItem(userKey, encryptedData);
      } else {
        localStorage.setItem(userKey, JSON.stringify(sanitizedData));
      }
    } catch (error) {
      logger.error('Failed to store user data', error);
    }
  }
  
  // Retrieve user data securely
  static getUserData(username: string): any | null {
    try {
      const userKey = `user_${username.toLowerCase()}`;
      const storedData = localStorage.getItem(userKey);
      
      if (!storedData) return null;
      
      if (this.encrypt) {
        const decryptedData = decryptData(storedData);
        if (decryptedData) {
          try {
            return JSON.parse(decryptedData);
          } catch (parseError) {
            logger.error('Failed to parse decrypted data', parseError);
            
            // Try fallback parsing
            try {
              return JSON.parse(decryptedData);
            } catch (fallbackError) {
              logger.error('Fallback parsing also failed', fallbackError);
              return null;
            }
          }
        } else {
          // Try unencrypted fallback
          const fallbackData = localStorage.getItem(`leap_user_${username}`);
          if (fallbackData) {
            try {
              logger.warn('Using unencrypted fallback data');
              return JSON.parse(fallbackData);
            } catch (fallbackError) {
              logger.error('Both encrypted and unencrypted parsing failed', fallbackError);
              return null;
            }
          }
        }
      } else {
        return JSON.parse(storedData);
      }
    } catch (error) {
      logger.error('Failed to retrieve user data', error);
      return null;
    }
  }
  
  // Remove user data
  static removeUserData(username: string): void {
    const userKey = `user_${username.toLowerCase()}`;
    localStorage.removeItem(userKey);
  }
  
  // Sanitize user data before storage
  private static sanitizeUserData(data: any): any {
    if (typeof data === 'string') {
      return sanitizeInput(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeUserData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeUserData(value);
      }
      return sanitized;
    }
    
    return data;
  }
  
  // Clean up old data (for privacy)
  static cleanupOldData(): void {
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
    const now = Date.now();
    
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('user_')) {
        try {
          const userData = this.getUserData(key.replace('user_', ''));
          if (userData && userData.lastAccess && (now - userData.lastAccess > maxAge)) {
            localStorage.removeItem(key);
          }
        } catch (error) {
          logger.error('Error during cleanup', error);
        }
      }
    });
  }
  
  // Update last access time
  static updateLastAccess(username: string): void {
    const userData = this.getUserData(username);
    if (userData) {
      userData.lastAccess = Date.now();
      this.setUserData(username, userData);
    }
  }
}