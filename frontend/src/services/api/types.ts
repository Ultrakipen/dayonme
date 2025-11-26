export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
  }
  
  export interface RegisterData {
    username: string;
    email: string;
    password: string;
    nickname?: string;
    profile_image_url?: string;
  }
  
  export interface User {
    user_id: number;
    username: string;
    email: string;
    nickname?: string;
    profile_image_url?: string;
  }
  
  export interface AuthResponse {
    status: string;
    message: string;
    data: {
      token: string;
      user: User;
    };
  }