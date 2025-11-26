import { Request } from 'express';

export interface User {
  user_id: number;
  username: string;
  email: string;
  nickname?: string;
  is_active: boolean;
}

declare global {
  namespace Express {
    interface User {
      user_id: number;
      username: string;
      email: string;
      nickname?: string;
      is_active: boolean;
    }
    interface Request {
      user?: User;
    }
  }
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface AuthRequestGeneric<
  ReqBody = any,
  QueryString = any,
  Params = any
> extends Request<Params, any, ReqBody, QueryString> {
  user?: User;
}