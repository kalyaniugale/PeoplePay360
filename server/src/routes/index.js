import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.routes.js';
import { userRouter } from '../modules/users/user.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => res.status(200).json({ data: { status: 'ok' } }));
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
