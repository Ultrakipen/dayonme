// types/utils.d.ts

// 에러 처리를 위한 타입 가드
export function isError(error: any): error is Error {
  return error && typeof error === 'object' && 'message' in error;
}

export function isAppError(error: any): error is AppError {
  return isError(error) && 'message' in error;
}

// 응답 타입 가드
export function hasData(response: any): response is { data: any } {
  return response && typeof response === 'object' && 'data' in response;
}