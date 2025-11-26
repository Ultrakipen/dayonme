import jwt from 'jsonwebtoken';
import { config } from '../config/env';

const JWT_SECRET = config.jwt.secret;

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (process.env.NODE_ENV === 'development') {
      console.log('Decoded Token:', decoded);
    }
    return decoded;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      if (error instanceof Error) {
        console.error('Invalid token:', error.message);
      } else {
        console.error('Invalid token:', error);
      }
    }
    return null;
  }
};
