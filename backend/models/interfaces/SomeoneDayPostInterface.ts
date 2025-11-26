// backend/models/interfaces/SomeoneDayPostInterface.ts
export interface SomeoneDayPostInterface {
    post_id: number;
    user_id: number;
    title: string;
    content: string;
    summary?: string;
    image_url?: string;
    is_anonymous: boolean;
    character_count?: number;
    like_count: number;
    comment_count: number;
    created_at?: Date;
    updated_at?: Date;
    
    // Sequelize의 get 메소드도 포함하여 실제 모델과 호환되도록 함
    get: (key?: string) => any;
  }