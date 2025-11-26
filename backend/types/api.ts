export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
  }
  
  export interface ApiErrorResponse {
    success: false;
    error: string;
  }
  
  export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
  
  // 사용자 관련 타입
  export interface UserResponse {
    id: number;
    username: string;
    email: string;
    nickname?: string;
  }
  
  export interface AuthResponse {
    token: string;
    user: UserResponse;
  }
  
  // 응답 타입 예시
  export type RegisterResponse = ApiResponse<AuthResponse>;
  export type LoginResponse = ApiResponse<AuthResponse>;
  export type ProfileResponse = ApiResponse<UserResponse>;