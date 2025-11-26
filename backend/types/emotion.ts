export interface EmotionCreateDTO {
  emotion_ids: number[];
  note?: string;
}

export interface EmotionLogDTO {
  log_id?: number;
  user_id: number;
  emotion_id: number;
  log_date: Date;
  note?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export interface EmotionStatDTO {
  date: string;
  emotions: Array<{
    name: string;
    icon: string;
    count: number;
    emotion_ids: number[];
    note?: string;
  }>;
}