import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';

const getJwtSecret = () => {
  if (!env.jwtSecret) throw new Error('JWT configuration is missing.');
  return env.jwtSecret;
};

export const signAccessToken = (userId) =>
  jwt.sign({}, getJwtSecret(), {
    subject: String(userId),
    expiresIn: env.jwtExpiresIn,
  });

export const verifyAccessToken = (token) => jwt.verify(token, getJwtSecret());
