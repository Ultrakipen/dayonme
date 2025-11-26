export const jwtConfig = {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRATION || '1h',
  };