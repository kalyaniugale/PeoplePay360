import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';

export const authorize = (...allowedRoles) => (req, _res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new AppError(ERROR_CODES.AUTH_FORBIDDEN));
  }

  if (req.user.mustChangePassword) {
    return next(new AppError(ERROR_CODES.AUTH_MUST_CHANGE_PASSWORD));
  }

  return next();
};
