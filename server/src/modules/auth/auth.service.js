import { ACCOUNT_STATUSES } from '../../core/constants/statuses.js';
import { AppError } from '../../core/errors/AppError.js';
import { ERROR_CODES } from '../../core/errors/errorCodes.js';
import { comparePassword, hashPassword } from '../../core/security/password.js';
import { signAccessToken } from '../../core/security/token.js';
import { UserService } from '../users/user.service.js';

const assertActive = (user) => {
  if (user.accountStatus !== ACCOUNT_STATUSES.ACTIVE) {
    console.info('Authentication login rejected for inactive account.');
    throw new AppError(ERROR_CODES.AUTH_INACTIVE);
  }
};

const login = async ({ email, password }) => {
  const user = await UserService.findByEmailWithPassword(email);
  const passwordMatches = user && (await comparePassword(password, user.passwordHash));

  if (!passwordMatches) {
    console.info('Authentication login failed.');
    throw new AppError(ERROR_CODES.AUTH_INVALID_CREDENTIALS);
  }

  assertActive(user);
  await UserService.updateLastLogin(user._id);
  console.info(`Authentication login succeeded for ${user.uniqueId}.`);

  return {
    token: signAccessToken(user._id),
    user: UserService.serializeUser(user),
  };
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await UserService.findByIdWithPassword(userId);
  if (!user) throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN);
  assertActive(user);

  if (!(await comparePassword(currentPassword, user.passwordHash))) {
    throw new AppError({
      ...ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      message: 'Invalid current password.',
    });
  }

  if (await comparePassword(newPassword, user.passwordHash)) {
    throw new AppError({
      ...ERROR_CODES.USER_INVALID_PASSWORD,
      message: 'New password must be different from the current password.',
      statusCode: 422,
    });
  }

  const updated = await UserService.replaceOwnPassword(user._id, await hashPassword(newPassword));
  return { changed: true, user: UserService.serializeUser(updated) };
};

export const AuthService = Object.freeze({ changePassword, login });
