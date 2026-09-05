export class AppError extends Error {
  constructor({ code, message, statusCode = 500, severity = 'ERROR', details = {} }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.severity = severity;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, AppError);
  }
}
