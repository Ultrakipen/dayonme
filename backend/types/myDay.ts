export interface MyDayQuery {
  page?: string;
  limit?: string;
  emotion?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: 'latest' | 'popular';
 }
 
 export interface MyDayPost {
  content: string;
  emotion_summary?: string;
  image_url?: string;
  is_anonymous?: boolean;
  emotion_ids?: number[];
 }
 
 export interface MyDayComment {
  content: string;
  is_anonymous?: boolean;
 }
 export interface PostParams {
  id: string;
 }
 