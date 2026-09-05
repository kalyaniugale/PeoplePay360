import { getBootstrapAdminConfig } from '../../config/env.js';
import { hashPassword, PASSWORD_MIN_LENGTH } from '../../core/security/password.js';
import { UserService } from './user.service.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateBootstrapConfig = (config) => {
  const hasAllValues = config.email && config.password && config.firstName && config.lastName;
  const hasValidEmail = hasAllValues && EMAIL_PATTERN.test(config.email.trim());
  if (!hasValidEmail || config.password.length < PASSWORD_MIN_LENGTH) {
    throw new Error('Bootstrap Admin configuration is missing or invalid.');
  }
};

const provision = async () => {
  const existingAdmin = await UserService.findAdmin();
  if (existingAdmin) return { created: false };

  const config = getBootstrapAdminConfig();
  validateBootstrapConfig(config);
  const passwordHash = await hashPassword(config.password);
  const user = await UserService.createBootstrapAdmin({ ...config, passwordHash });

  console.info('Bootstrap Admin created.');
  return { created: true, user: UserService.serializeUser(user) };
};

export const BootstrapAdminService = Object.freeze({ provision });
