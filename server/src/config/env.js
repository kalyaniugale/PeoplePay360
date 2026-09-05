import 'dotenv/config';

const asPort = (value) => {
  const port = Number(value ?? 5000);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: asPort(process.env.PORT),
  mongodbUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
});

export const assertRuntimeEnvironment = () => {
  if (!env.port || !env.mongodbUri || !env.jwtSecret) {
    throw new Error('Required server environment configuration is missing or invalid.');
  }
};

export const getBootstrapAdminConfig = () => ({
  email: process.env.BOOTSTRAP_ADMIN_EMAIL,
  password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
  firstName: process.env.BOOTSTRAP_ADMIN_FIRST_NAME,
  lastName: process.env.BOOTSTRAP_ADMIN_LAST_NAME,
});
