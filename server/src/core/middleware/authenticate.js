import { ACCOUNT_STATUSES } from '../constants/statuses.js';
import { AppError } from '../errors/AppError.js';
import { ERROR_CODES } from '../errors/errorCodes.js';
import { verifyAccessToken } from '../security/token.js';
import { UserService } from '../../modules/users/user.service.js';

export const authenticate = async (req, _res, next) => {
  try {
    const authorization = req.get('authorization');
    const match = authorization?.match(/^Bearer\s+(\S+)$/i);
    if (!match) throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN);

    let payload;
    try {
      payload = verifyAccessToken(match[1]);
    } catch {
      throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN);
    }

    if (!payload.sub) throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN);
    const user = await UserService.findById(payload.sub);
    if (!user) throw new AppError(ERROR_CODES.AUTH_INVALID_TOKEN);
    if (user.accountStatus !== ACCOUNT_STATUSES.ACTIVE) {
      throw new AppError(ERROR_CODES.AUTH_INACTIVE);
    }

    req.user = UserService.serializeUser(user);
    next();
  } catch (error) {
    next(error);
  }
};
