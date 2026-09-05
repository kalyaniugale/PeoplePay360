import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

const normalizeError = (error) => {
  if (error instanceof AppError) return error;

  if (error?.code === 11000 && error?.keyPattern?.email) {
    return new AppError(ERROR_CODES.USER_DUPLICATE_EMAIL);
  }

  if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    return new AppError(ERROR_CODES.VALIDATION_ERROR);
  }

  if (error?.type === 'entity.parse.failed') {
    return new AppError({
      ...ERROR_CODES.VALIDATION_ERROR,
      message: 'Request body must contain valid JSON.',
    });
  }

  return new AppError(ERROR_CODES.INTERNAL_SERVER_ERROR);
};

export const errorHandler = (error, _req, res, _next) => {
  const normalized = normalizeError(error);

  if (!(error instanceof AppError)) console.error(error);

  res.status(normalized.statusCode).json({
    code: normalized.code,
    message: normalized.message,
    severity: normalized.severity,
    details: normalized.details,
  });
};
