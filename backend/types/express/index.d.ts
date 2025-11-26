import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: number;
        email: string;
        nickname: string;
        is_active: boolean;
      };
    }
  }
}

export interface AuthRequest extends Request {
  user?: {
    user_id: number;
    email: string;
    nickname: string;
    is_active: boolean;
  };
}