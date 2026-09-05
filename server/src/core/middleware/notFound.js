import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

export const notFound = (_req, _res, next) => {
  next(new AppError(ERROR_CODES.RESOURCE_NOT_FOUND));
};
