// src/services/api/goalService.ts

import apiClient from './client';

export interface Goal {
  goal_id: number;
  user_id: number;
  target_emotion_id: number;
  emotion_name: string;
  emotion_color: string;
  start_date: string;
  end_date: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface GoalCreateData {
  target_emotion_id: number;
  start_date: string;
  end_date: string;
}

const goalService = {
  getGoals: async (params?: { 
    active_only?: boolean;
    page?: number;
    limit?: number;
  }) => {
    return await apiClient.get<{ 
      status: string; 
      data: Goal[];
      pagination?: {
        total: number;
        page: number;
        limit: number;
      }
    }>('/goals', { params });
  },
  
  getGoalById: async (goalId: number) => {
    return await apiClient.get<{ status: string; data: Goal }>(
      `/goals/${goalId}`
    );
  },
  
  createGoal: async (data: GoalCreateData) => {
    return await apiClient.post<{ status: string; data: Goal }>(
      '/goals', 
      data
    );
  },
  
  updateGoalProgress: async (goalId: number, progress: number) => {
    return await apiClient.put<{ status: string; message: string }>(
      `/goals/${goalId}/progress`,
      { progress }
    );
  },
  
  deleteGoal: async (goalId: number) => {
    return await apiClient.delete<{ status: string; message: string }>(
      `/goals/${goalId}`
    );
  },
  
  getGoalStats: async (params?: { 
    start_date?: string;
    end_date?: string;
  }) => {
    return await apiClient.get<{ 
      status: string; 
      data: {
        completed_goals: number;
        active_goals: number;
        average_progress: number;
        most_targeted_emotion: {
          emotion_id: number;
          name: string;
          count: number;
        };
      }
    }>('/goals/stats', { params });
  }
};

export default goalService;