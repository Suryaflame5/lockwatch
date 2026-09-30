export interface LogContext {
  requestId?: string;
  userId?: string;
  institutionId?: string;
  sessionId?: string;
  deviceId?: string;
  operation?: string;
  result?: string;
  [key: string]: unknown;
}

export class Logger {
  private static formatLog(level: string, message: string, context?: LogContext) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context
    });
  }

  static info(message: string, context?: LogContext) {
    console.log(this.formatLog('INFO', message, context));
  }

  static warn(message: string, context?: LogContext) {
    console.warn(this.formatLog('WARN', message, context));
  }

  static error(message: string, context?: LogContext) {
    console.error(this.formatLog('ERROR', message, context));
  }

  static audit(message: string, context?: LogContext) {
    console.log(this.formatLog('AUDIT', message, context));
  }
}
