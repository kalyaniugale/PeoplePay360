import mongoose from 'mongoose';

import { env } from './env.js';

export const connectDatabase = () => mongoose.connect(env.mongodbUri);

export const disconnectDatabase = () => mongoose.disconnect();
