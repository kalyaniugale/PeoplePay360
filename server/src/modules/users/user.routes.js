import { Router } from 'express';

import { ROLES } from '../../core/constants/roles.js';
import { asyncHandler } from '../../core/middleware/asyncHandler.js';
import { authenticate } from '../../core/middleware/authenticate.js';
import { authorize } from '../../core/middleware/authorize.js';
import { validateRequest } from '../../core/middleware/validateRequest.js';
import {
  activateUser,
  changeRole,
  createUser,
  deactivateUser,
  getUser,
  listUsers,
  resetPassword,
  updateUser,
} from './user.controller.js';
import {
  validateChangeRole,
  validateCreateUser,
  validateListUsers,
  validateUpdateUser,
  validateUserId,
} from './user.validation.js';

export const userRouter = Router();

userRouter.use(asyncHandler(authenticate), authorize(ROLES.ADMIN));
userRouter.get('/', validateRequest(validateListUsers), asyncHandler(listUsers));
userRouter.post('/', validateRequest(validateCreateUser), asyncHandler(createUser));
userRouter.get('/:id', validateRequest(validateUserId), asyncHandler(getUser));
userRouter.patch('/:id', validateRequest(validateUpdateUser), asyncHandler(updateUser));
userRouter.patch('/:id/role', validateRequest(validateChangeRole), asyncHandler(changeRole));
userRouter.post('/:id/activate', validateRequest(validateUserId), asyncHandler(activateUser));
userRouter.post('/:id/deactivate', validateRequest(validateUserId), asyncHandler(deactivateUser));
userRouter.post('/:id/reset-password', validateRequest(validateUserId), asyncHandler(resetPassword));
