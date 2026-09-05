import mongoose from 'mongoose';

import { ROLE_VALUES } from '../../core/constants/roles.js';
import { ACCOUNT_STATUS_VALUES, ACCOUNT_STATUSES } from '../../core/constants/statuses.js';

const userSchema = new mongoose.Schema(
  {
    uniqueId: { type: String, required: true, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ROLE_VALUES },
    accountStatus: {
      type: String,
      required: true,
      enum: ACCOUNT_STATUS_VALUES,
      default: ACCOUNT_STATUSES.ACTIVE,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    mustChangePassword: { type: Boolean, required: true, default: true },
    lastLogin: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_document, value) => {
        value.id = String(value._id);
        delete value._id;
        delete value.__v;
        delete value.passwordHash;
        return value;
      },
    },
  },
);

userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.model('User', userSchema);
