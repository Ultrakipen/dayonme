import { Request } from 'express';

interface EmotionTrendQuery {
  start_date: string;
  end_date: string;
}

interface AuthRequest<
  P = never,
  Q = never,
  B = never
> extends Request<P, any, B, Q> {
  userId?: number;
}

export { EmotionTrendQuery, AuthRequest };