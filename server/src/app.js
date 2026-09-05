import cors from 'cors';
import express from 'express';

import { errorHandler } from './core/middleware/errorHandler.js';
import { notFound } from './core/middleware/notFound.js';
import { apiRouter } from './routes/index.js';

const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use('/api/v1', apiRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
