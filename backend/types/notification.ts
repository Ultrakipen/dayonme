export enum NotificationType {
    LIKE = 'like',
    COMMENT = 'comment',
    ENCOURAGEMENT = 'encouragement',
    SYSTEM = 'system',
    CHALLENGE = 'challenge'
  }
  
  export interface NotificationAttributes {
    notification_id?: number;
    user_id: number;
    content: string;
    notification_type: NotificationType;
    related_id?: number;
    is_read: boolean;
    created_at?: Date;
  }