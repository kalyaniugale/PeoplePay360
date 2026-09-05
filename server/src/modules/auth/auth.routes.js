import { Router } from 'express';

import { asyncHandler } from '../../core/middleware/asyncHandler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { validateRequest } from '../../core/middleware/validateRequest.js';
import { changePassword, login, me } from './auth.controller.js';
import { validateChangePassword, validateLogin } from './auth.validation.js';

export const authRouter = Router();

authRouter.post('/login', validateRequest(validateLogin), asyncHandler(login));
authRouter.get('/me', asyncHandler(authenticate), me);
authRouter.post(
  '/change-password',
  asyncHandler(authenticate),
  validateRequest(validateChangePassword),
  asyncHandler(changePassword),
);
