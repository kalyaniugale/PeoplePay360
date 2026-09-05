import { sendData } from '../../core/http/response.js';
import { AuthService } from './auth.service.js';

export const login = async (req, res) => sendData(res, await AuthService.login(req.body));

export const me = (req, res) => sendData(res, req.user);

export const changePassword = async (req, res) =>
  sendData(
    res,
    await AuthService.changePassword({ userId: req.user.id, ...req.body }),
  );
