export const ERROR_CODES = Object.freeze({
  AUTH_INVALID_CREDENTIALS: Object.freeze({
    code: 'AUTH-001', message: 'Invalid email or password.', statusCode: 401,
  }),
  AUTH_INVALID_TOKEN: Object.freeze({
    code: 'AUTH-002', message: 'Authentication token is missing or invalid.', statusCode: 401,
  }),
  AUTH_FORBIDDEN: Object.freeze({
    code: 'AUTH-003', message: 'You do not have permission to perform this action.', statusCode: 403,
  }),
  AUTH_INACTIVE: Object.freeze({
    code: 'AUTH-004', message: 'User account is inactive.', statusCode: 403,
  }),
  AUTH_MUST_CHANGE_PASSWORD: Object.freeze({
    code: 'AUTH-005', message: 'Password change is required.', statusCode: 403,
  }),
  USER_DUPLICATE_EMAIL: Object.freeze({
    code: 'USR-001', message: 'A user with this email already exists.', statusCode: 409,
  }),
  USER_INVALID_ROLE: Object.freeze({
    code: 'USR-002', message: 'Role must be a canonical PeoplePay360 role.', statusCode: 400,
  }),
  USER_INVALID_PASSWORD: Object.freeze({
    code: 'USR-003', message: 'Password does not meet the password policy.', statusCode: 400,
  }),
  USER_PASSWORD_FORBIDDEN: Object.freeze({
    code: 'USR-004', message: 'Existing passwords cannot be retrieved.', statusCode: 403,
  }),
  USER_DUPLICATE_BOOTSTRAP: Object.freeze({
    code: 'USR-005', message: 'A bootstrap Admin already exists.', statusCode: 409,
  }),
  VALIDATION_ERROR: Object.freeze({
    code: 'VALIDATION_ERROR', message: 'Request validation failed.', statusCode: 400,
  }),
  RESOURCE_NOT_FOUND: Object.freeze({
    code: 'RESOURCE_NOT_FOUND', message: 'Resource not found.', statusCode: 404,
  }),
  INTERNAL_SERVER_ERROR: Object.freeze({
    code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.', statusCode: 500,
  }),
});
