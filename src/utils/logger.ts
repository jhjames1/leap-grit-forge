type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    // In production, only show errors and warnings
    const isDev = import.meta.env.DEV;
    this.config = {
      level: isDev ? 'debug' : 'error',
      enableConsole: isDev
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const requestedLevelIndex = levels.indexOf(level);
    
    return requestedLevelIndex >= currentLevelIndex && this.config.enableConsole;
  }

  private sanitizeData(data: any): any {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      
      // Remove sensitive fields
      const sensitiveFields = ['password', 'token', 'email', 'phone', 'firstName', 'lastName'];
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      });
      
      return sanitized;
    }
    return data;
  }

  debug(message: string, data?: any): void {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  info(message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  warn(message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, data ? this.sanitizeData(data) : '');
    }
  }

  error(message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error);
    }
  }
}

export const logger = new Logger();