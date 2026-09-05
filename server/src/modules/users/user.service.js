import mongoose from 'mongoose';

import { isCanonicalRole, ROLES } from '../../core/constants/roles.js';
import { ACCOUNT_STATUSES } from '../../core/constants/statuses.js';
import { AppError } from '../../core/errors/AppError.js';
import { ERROR_CODES } from '../../core/errors/errorCodes.js';
import { getPaginationMeta } from '../../core/http/pagination.js';
import { generateTemporaryPassword, hashPassword } from '../../core/security/password.js';
import { User } from './user.model.js';

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeEmail = (email) => email.trim().toLowerCase();

const serializeUser = (user) => ({
  id: String(user._id),
  uniqueId: user.uniqueId,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  accountStatus: user.accountStatus,
  mustChangePassword: user.mustChangePassword,
  employeeId: user.employeeId ? String(user.employeeId) : null,
});

const assertValidId = (id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND);
  }
};

const findByIdOrThrow = async (id, includePassword = false) => {
  assertValidId(id);
  const query = User.findById(id);
  if (includePassword) query.select('+passwordHash');
  const user = await query;
  if (!user) throw new AppError(ERROR_CODES.RESOURCE_NOT_FOUND);
  return user;
};

const createUniqueId = (id) => `PP360-U-${id.toHexString().slice(-8).toUpperCase()}`;

const isDuplicateEmailError = (error) => error?.code === 11000 && error?.keyPattern?.email;

const findByEmailWithPassword = (email) =>
  User.findOne({ email: normalizeEmail(email) }).select('+passwordHash');

const findById = (id) => {
  if (!mongoose.isObjectIdOrHexString(id)) return null;
  return User.findById(id);
};

const findByIdWithPassword = (id) => {
  if (!mongoose.isObjectIdOrHexString(id)) return null;
  return User.findById(id).select('+passwordHash');
};

const findAdmin = () => User.findOne({ role: ROLES.ADMIN });

const createBootstrapAdmin = ({ firstName, lastName, email, passwordHash }) =>
  User.findOneAndUpdate(
    { uniqueId: 'PP360-U-000001' },
    {
      $setOnInsert: {
        uniqueId: 'PP360-U-000001',
        firstName,
        lastName,
        email: normalizeEmail(email),
        passwordHash,
        role: ROLES.ADMIN,
        accountStatus: ACCOUNT_STATUSES.ACTIVE,
        mustChangePassword: true,
      },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );

const updateLastLogin = (id, date = new Date()) =>
  User.findByIdAndUpdate(id, { $set: { lastLogin: date } }, { new: true });

const replaceOwnPassword = (id, passwordHash) =>
  User.findByIdAndUpdate(
    id,
    { $set: { passwordHash, mustChangePassword: false } },
    { new: true, runValidators: true },
  );

const listUsers = async ({ role, accountStatus, q, page, limit, skip }) => {
  const filter = {};
  if (role) filter.role = role;
  if (accountStatus) filter.accountStatus = accountStatus;
  if (q) {
    const search = new RegExp(escapeRegex(q), 'i');
    filter.$or = [
      { firstName: search },
      { lastName: search },
      { email: search },
      { uniqueId: search },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map(serializeUser),
    meta: getPaginationMeta({ page, limit, total }),
  };
};

const getUser = async (id) => serializeUser(await findByIdOrThrow(id));

const createUser = async ({ firstName, lastName, email, role, employeeId = null }) => {
  if (!isCanonicalRole(role)) throw new AppError(ERROR_CODES.USER_INVALID_ROLE);

  const normalizedEmail = normalizeEmail(email);
  if (await User.exists({ email: normalizedEmail })) {
    throw new AppError(ERROR_CODES.USER_DUPLICATE_EMAIL);
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const _id = new mongoose.Types.ObjectId();

  try {
    const user = await User.create({
      _id,
      uniqueId: createUniqueId(_id),
      firstName,
      lastName,
      email: normalizedEmail,
      passwordHash,
      role,
      accountStatus: ACCOUNT_STATUSES.ACTIVE,
      employeeId,
      mustChangePassword: true,
    });

    return { user: serializeUser(user), temporaryPassword };
  } catch (error) {
    if (isDuplicateEmailError(error)) throw new AppError(ERROR_CODES.USER_DUPLICATE_EMAIL);
    throw error;
  }
};

const updateUser = async (id, changes) => {
  const user = await findByIdOrThrow(id);

  if (changes.email !== undefined) {
    const email = normalizeEmail(changes.email);
    if (await User.exists({ email, _id: { $ne: user._id } })) {
      throw new AppError(ERROR_CODES.USER_DUPLICATE_EMAIL);
    }
    user.email = email;
  }

  for (const field of ['firstName', 'lastName', 'employeeId']) {
    if (changes[field] !== undefined) user[field] = changes[field];
  }

  try {
    await user.save();
  } catch (error) {
    if (isDuplicateEmailError(error)) throw new AppError(ERROR_CODES.USER_DUPLICATE_EMAIL);
    throw error;
  }

  return serializeUser(user);
};

const changeRole = async (id, role) => {
  if (!isCanonicalRole(role)) throw new AppError(ERROR_CODES.USER_INVALID_ROLE);
  const user = await findByIdOrThrow(id);
  user.role = role;
  await user.save();
  return serializeUser(user);
};

const setAccountStatus = async (id, accountStatus) => {
  const user = await findByIdOrThrow(id);
  user.accountStatus = accountStatus;
  await user.save();
  return serializeUser(user);
};

const resetPassword = async (id) => {
  const user = await findByIdOrThrow(id);
  const temporaryPassword = generateTemporaryPassword();
  user.passwordHash = await hashPassword(temporaryPassword);
  user.mustChangePassword = true;
  await user.save();
  return { user: serializeUser(user), temporaryPassword };
};

export const UserService = Object.freeze({
  changeRole,
  createBootstrapAdmin,
  createUser,
  findAdmin,
  findByEmailWithPassword,
  findById,
  findByIdWithPassword,
  getUser,
  listUsers,
  normalizeEmail,
  replaceOwnPassword,
  resetPassword,
  serializeUser,
  setAccountStatus,
  updateLastLogin,
  updateUser,
});
