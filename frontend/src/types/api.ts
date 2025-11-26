// API 응답 기본 형식
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
    statusCode?: number;
  }
  
  // 페이지네이션 메타 데이터
  export interface PaginationMeta {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }
  
  // 페이지네이션 응답 형식
  export interface PaginatedResponse<T> extends ApiResponse<T> {
    meta: PaginationMeta;
  }
  
  // 로그인 요청 형식
  export interface LoginRequest {
    email: string;
    password: string;
  }
  
  // 로그인 응답 형식
  export interface LoginResponse {
    token: string;
    user: any;
  }
  
  // 회원가입 요청 형식
  export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    nickname?: string;
  }
  
  // 게시물 생성 요청 형식
  export interface CreatePostRequest {
    content: string;
    emotion_ids?: number[];
    image_url?: string;
    is_anonymous?: boolean;
  }
  
  // API 오류 코드
  export enum ApiErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
    RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
    SERVER_ERROR = 'SERVER_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
  }
  
  // API 오류 타입
  export interface ApiError {
    code: ApiErrorCode;
    message: string;
    details?: any;
  }