import { randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';

export const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_SALT_ROUNDS = 12;

export const hashPassword = (password) => bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

export const comparePassword = (password, passwordHash) =>
  bcrypt.compare(password, passwordHash);

export const generateTemporaryPassword = () => randomBytes(18).toString('base64url');
