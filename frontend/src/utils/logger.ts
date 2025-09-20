// ============================================================================
// LOGGING UTILITY
// Centralized logging with configurable levels and formatting
// ============================================================================

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogConfig {
  level: LogLevel;
  enableTimestamp: boolean;
  enableColors: boolean;
  prefix?: string;
}

const defaultLogConfig: LogConfig = {
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
  enableTimestamp: true,
  enableColors: true,
  prefix: 'DocumentAI'
};

class Logger {
  private config: LogConfig;
  private levels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  constructor(config: Partial<LogConfig> = {}) {
    this.config = { ...defaultLogConfig, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] <= this.levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string): string {
    let formattedMessage = '';
    
    if (this.config.enableTimestamp) {
      const timestamp = new Date().toISOString();
      formattedMessage += `[${timestamp}] `;
    }
    
    if (this.config.prefix) {
      formattedMessage += `[${this.config.prefix}] `;
    }
    
    formattedMessage += `[${level.toUpperCase()}] ${message}`;
    
    return formattedMessage;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  // Convenience method for development debugging
  devLog(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      this.debug(message, ...args);
    }
  }
}

// Create default logger instance
export const logger = new Logger();

// Create specialized loggers for different modules
export const mtLogger = new Logger({ prefix: 'MT-Service' });
export const uiLogger = new Logger({ prefix: 'UI' });
export const apiLogger = new Logger({ prefix: 'API' });

// Utility functions for backward compatibility
export function configuredLog(level: LogLevel, message: string, ...args: any[]): void {
  logger[level](message, ...args);
}

export default logger;