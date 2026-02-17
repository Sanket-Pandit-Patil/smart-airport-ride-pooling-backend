/**
 * Structured logging utility.
 * Provides consistency in log output across the application.
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogContext {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatLog(context: LogContext): string {
    if (this.isDevelopment) {
      return JSON.stringify(context, null, 2);
    }
    return JSON.stringify(context);
  }

  private log(level: LogLevel, message: string, extra: Record<string, any> = {}): void {
    const context: LogContext = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...extra,
    };
    
    const formatted = this.formatLog(context);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.ERROR:
        console.error(formatted);
        break;
    }
  }

  debug(message: string, extra?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, extra);
  }

  info(message: string, extra?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, extra);
  }

  warn(message: string, extra?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, extra);
  }

  error(message: string, extra?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, extra);
  }
}

export const logger = new Logger();
