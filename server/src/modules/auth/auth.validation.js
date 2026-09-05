import { AppError } from '../../core/errors/AppError.js';
import { ERROR_CODES } from '../../core/errors/errorCodes.js';
import { PASSWORD_MIN_LENGTH } from '../../core/security/password.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fail = (definition, field, message = definition.message) => {
  throw new AppError({ ...definition, message, details: { field } });
};

const requireExactKeys = (body, keys) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    fail(ERROR_CODES.VALIDATION_ERROR, 'body');
  }
  const unknown = Object.keys(body).find((key) => !keys.includes(key));
  if (unknown) fail(ERROR_CODES.VALIDATION_ERROR, unknown, 'Unexpected request field.');
};

export const validateLogin = ({ body }) => {
  requireExactKeys(body, ['email', 'password']);
  if (typeof body.email !== 'string' || !EMAIL_PATTERN.test(body.email.trim())) {
    fail(ERROR_CODES.VALIDATION_ERROR, 'email', 'A valid email is required.');
  }
  if (typeof body.password !== 'string' || body.password.length === 0) {
    fail(ERROR_CODES.VALIDATION_ERROR, 'password', 'Password is required.');
  }
  return { body: { email: body.email.trim().toLowerCase(), password: body.password } };
};

export const validateChangePassword = ({ body }) => {
  requireExactKeys(body, ['currentPassword', 'newPassword']);
  if (typeof body.currentPassword !== 'string' || body.currentPassword.length === 0) {
    fail(ERROR_CODES.VALIDATION_ERROR, 'currentPassword', 'Current password is required.');
  }
  if (typeof body.newPassword !== 'string' || body.newPassword.length < PASSWORD_MIN_LENGTH) {
    fail(
      ERROR_CODES.USER_INVALID_PASSWORD,
      'newPassword',
      `New password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
    );
  }
  return { body: { currentPassword: body.currentPassword, newPassword: body.newPassword } };
};
