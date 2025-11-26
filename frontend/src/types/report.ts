// src/types/report.ts

export type ReportType = 'spam' | 'inappropriate' | 'harassment' | 'violence' | 'misinformation' | 'copyright' | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed' | 'escalated';

export type ReportableItemType = 'post' | 'comment' | 'user' | 'message';

export interface ReportData {
  item_type: ReportableItemType;
  item_id: number;
  report_type: ReportType;
  reason: string;
  details?: string;
  additional_info?: {
    screenshots?: string[];
    related_items?: number[];
    severity_level?: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface Report {
  report_id: number;
  item_type: ReportableItemType;
  item_id: number;
  reporter_id: number;
  report_type: ReportType;
  reason: string;
  details?: string;
  status: ReportStatus;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string;
  resolved_at?: string;
  reviewer_id?: number;
  resolution_note?: string;
  additional_info?: {
    screenshots?: string[];
    related_items?: number[];
    severity_level?: 'low' | 'medium' | 'high' | 'critical';
  };
  reporter?: {
    user_id: number;
    nickname: string;
    is_anonymous?: boolean;
  };
  reviewer?: {
    user_id: number;
    nickname: string;
    role: string;
  };
}

export interface ReportStats {
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  dismissed_reports: number;
  reports_by_type: Record<ReportType, number>;
  reports_by_status: Record<ReportStatus, number>;
  average_resolution_time: number; // in hours
  this_week_reports: number;
  last_week_reports: number;
}

export interface ReportFilters {
  page?: number;
  limit?: number;
  item_type?: ReportableItemType;
  report_type?: ReportType;
  status?: ReportStatus;
  date_from?: string;
  date_to?: string;
  reporter_id?: number;
  reviewer_id?: number;
  sort_by?: 'created_at' | 'updated_at' | 'severity';
  sort_order?: 'asc' | 'desc';
}

export interface BlockData {
  blocked_user_id: number;
  reason?: string;
  block_type?: 'temporary' | 'permanent';
  duration_days?: number;
}

export interface BlockedUser {
  block_id: number;
  blocked_user_id: number;
  blocker_user_id: number;
  reason?: string;
  block_type: 'temporary' | 'permanent';
  duration_days?: number;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  blocked_user: {
    user_id: number;
    nickname: string;
    profile_image_url?: string;
  };
}

export interface ModerationAction {
  action_id: number;
  target_type: ReportableItemType;
  target_id: number;
  action_type: 'warning' | 'temporary_ban' | 'permanent_ban' | 'content_removal' | 'content_edit';
  reason: string;
  details?: string;
  moderator_id: number;
  created_at: string;
  expires_at?: string;
  is_active: boolean;
  moderator: {
    user_id: number;
    nickname: string;
    role: string;
  };
}

export interface ReportResponse {
  report_id: number;
  status: ReportStatus;
  message: string;
  estimated_review_time?: string;
}