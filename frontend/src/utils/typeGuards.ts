// src/utils/typeGuards.ts

// API 응답 타입 가드
export function hasDataProperty(response: any): response is { data: any } {
  return response && typeof response === 'object' && 'data' in response;
}

export function hasNestedData(response: any): response is { data: { data: any } } {
  return hasDataProperty(response) && 
         typeof response.data === 'object' && 
         'data' in response.data;
}

// 에러 타입 가드
export function isError(error: any): error is Error {
  return error && typeof error === 'object' && 'message' in error;
}

export function isAppError(error: any): error is { message: string } {
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string';
}

// 태그 응답 타입 가드
export function isTagResponse(response: any): response is { 
  data: { 
    data: { 
      tag_id: number; 
      name: string; 
    } 
  } 
} {
  return hasNestedData(response) &&
         typeof response.data.data === 'object' &&
         'tag_id' in response.data.data &&
         'name' in response.data.data;
}