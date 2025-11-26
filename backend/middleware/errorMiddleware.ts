import { Request, Response, NextFunction } from 'express';

interface ErrorResponse extends Error {
  statusCode?: number;
  status?: string;
}

const errorHandler = (err: ErrorResponse, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  
  // 표준 에러 응답 형식으로 통일
  res.status(statusCode).json({
    status: 'error',
    message: err.message || '서버 오류가 발생했습니다.',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

export default errorHandler;