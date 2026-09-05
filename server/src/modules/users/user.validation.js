import mongoose from 'mongoose';

import { isCanonicalRole } from '../../core/constants/roles.js';
import { ACCOUNT_STATUS_VALUES } from '../../core/constants/statuses.js';
import { AppError } from '../../core/errors/AppError.js';
import { ERROR_CODES } from '../../core/errors/errorCodes.js';
import { DEFAULT_LIMIT, DEFAULT_PAGE, MAX_LIMIT } from '../../core/http/pagination.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fail = (definition, field, message = definition.message) => {
  throw new AppError({ ...definition, message, details: { field } });
};

const requireObject = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    fail(ERROR_CODES.VALIDATION_ERROR, 'body');
  }
};

const rejectUnknownKeys = (value, allowed) => {
  const unknown = Object.keys(value).find((key) => !allowed.includes(key));
  if (unknown) fail(ERROR_CODES.VALIDATION_ERROR, unknown, 'Unexpected request field.');
};

const requireName = (value, field) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    fail(ERROR_CODES.VALIDATION_ERROR, field, `${field} is required.`);
  }
  return value.trim();
};

const requireEmail = (value) => {
  if (typeof value !== 'string' || !EMAIL_PATTERN.test(value.trim())) {
    fail(ERROR_CODES.VALIDATION_ERROR, 'email', 'A valid email is required.');
  }
  return value.trim().toLowerCase();
};

const parseEmployeeId = (value) => {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'string' || !mongoose.isObjectIdOrHexString(value)) {
    fail(ERROR_CODES.VALIDATION_ERROR, 'employeeId', 'employeeId must be a valid identifier.');
  }
  return value;
};

const parsePositiveInteger = (value, fallback, field, maximum = Number.MAX_SAFE_INTEGER) => {
  if (value === undefined) return fallback;
  if (!/^\d+$/.test(String(value))) fail(ERROR_CODES.VALIDATION_ERROR, field);
  const parsed = Number(value);
  if (parsed < 1 || parsed > maximum) fail(ERROR_CODES.VALIDATION_ERROR, field);
  return parsed;
};

export const validateUserId = ({ params }) => {
  if (!mongoose.isObjectIdOrHexString(params.id)) {
    fail(ERROR_CODES.VALIDATION_ERROR, 'id', 'id must be a valid identifier.');
  }
  return { params: { id: params.id } };
};

export const validateListUsers = ({ query }) => {
  rejectUnknownKeys(query, ['role', 'accountStatus', 'q', 'page', 'limit']);
  if (query.role !== undefined && !isCanonicalRole(query.role)) {
    fail(ERROR_CODES.VALIDATION_ERROR, 'role');
  }
  if (query.accountStatus !== undefined && !ACCOUNT_STATUS_VALUES.includes(query.accountStatus)) {
    fail(ERROR_CODES.VALIDATION_ERROR, 'accountStatus');
  }

  const page = parsePositiveInteger(query.page, DEFAULT_PAGE, 'page');
  const limit = parsePositiveInteger(query.limit, DEFAULT_LIMIT, 'limit', MAX_LIMIT);
  const q = typeof query.q === 'string' ? query.q.trim() : undefined;
  if (query.q !== undefined && !q) fail(ERROR_CODES.VALIDATION_ERROR, 'q');

  return {
    query: {
      role: query.role,
      accountStatus: query.accountStatus,
      q,
      page,
      limit,
      skip: (page - 1) * limit,
    },
  };
};

export const validateCreateUser = ({ body }) => {
  requireObject(body);
  rejectUnknownKeys(body, ['firstName', 'lastName', 'email', 'role', 'employeeId']);
  if (!isCanonicalRole(body.role)) fail(ERROR_CODES.USER_INVALID_ROLE, 'role');

  return {
    body: {
      firstName: requireName(body.firstName, 'firstName'),
      lastName: requireName(body.lastName, 'lastName'),
      email: requireEmail(body.email),
      role: body.role,
      employeeId: parseEmployeeId(body.employeeId),
    },
  };
};

export const validateUpdateUser = ({ body, params }) => {
  const validatedParams = validateUserId({ params }).params;
  requireObject(body);
  rejectUnknownKeys(body, ['firstName', 'lastName', 'email', 'employeeId']);
  if (Object.keys(body).length === 0) fail(ERROR_CODES.VALIDATION_ERROR, 'body');

  const validatedBody = {};
  if (body.firstName !== undefined) validatedBody.firstName = requireName(body.firstName, 'firstName');
  if (body.lastName !== undefined) validatedBody.lastName = requireName(body.lastName, 'lastName');
  if (body.email !== undefined) validatedBody.email = requireEmail(body.email);
  if (body.employeeId !== undefined) validatedBody.employeeId = parseEmployeeId(body.employeeId);

  return { params: validatedParams, body: validatedBody };
};

export const validateChangeRole = ({ body, params }) => {
  const validatedParams = validateUserId({ params }).params;
  requireObject(body);
  rejectUnknownKeys(body, ['role']);
  if (!isCanonicalRole(body.role)) fail(ERROR_CODES.USER_INVALID_ROLE, 'role');
  return { params: validatedParams, body: { role: body.role } };
};
