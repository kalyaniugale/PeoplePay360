import { sendData, sendList } from '../../core/http/response.js';
import { ACCOUNT_STATUSES } from '../../core/constants/statuses.js';
import { UserService } from './user.service.js';

export const listUsers = async (req, res) => {
  const { users, meta } = await UserService.listUsers(req.validatedQuery);
  return sendList(res, users, meta);
};

export const createUser = async (req, res) => sendData(res, await UserService.createUser(req.body), 201);

export const getUser = async (req, res) => sendData(res, await UserService.getUser(req.params.id));

export const updateUser = async (req, res) =>
  sendData(res, await UserService.updateUser(req.params.id, req.body));

export const changeRole = async (req, res) =>
  sendData(res, await UserService.changeRole(req.params.id, req.body.role));

export const activateUser = async (req, res) =>
  sendData(res, await UserService.setAccountStatus(req.params.id, ACCOUNT_STATUSES.ACTIVE));

export const deactivateUser = async (req, res) =>
  sendData(res, await UserService.setAccountStatus(req.params.id, ACCOUNT_STATUSES.INACTIVE));

export const resetPassword = async (req, res) =>
  sendData(res, await UserService.resetPassword(req.params.id));
