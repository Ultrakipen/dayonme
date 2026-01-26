import axios from 'axios';

// API의 기본 URL을 설정합니다.
const BASE_URL = 'https://dayonme.com/api';

// axios 인스턴스를 생성합니다.
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 요청 제한 시간을 10초로 설정
  headers: {
    'Content-Type': 'application/json',
  },
});

// 인증 토큰을 설정하는 함수
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

// API 엔드포인트들을 정의합니다.
export const endpoints = {
  // 사용자 관리 API
  register: '/api/users/register',
  login: '/api/users/login',
  getUserProfile: (id) => `/api/users/${id}`,
  updateUserProfile: (id) => `/api/users/${id}`,

  // 감정 공유 API
  createEmotion: '/api/emotions',
  getEmotions: '/api/emotions',
  updateEmotion: (id) => `/api/emotions/${id}`,
  getEmotionStats: '/api/emotions/stats',

  // 일상 공유 API
  createPost: '/api/posts',
  getPosts: '/api/posts',
  getPost: (id) => `/api/posts/${id}`,
  updatePost: (id) => `/api/posts/${id}`,
  deletePost: (id) => `/api/posts/${id}`,
  createComment: (id) => `/api/posts/${id}/comments`,

  // 위로의 벽 API
  createComfortWallPost: '/api/comfort-wall',
  getComfortWallPosts: '/api/comfort-wall',
  createComfortMessage: (id) => `/api/comfort-wall/${id}/messages`,

  // 챌린지 시스템 API
  createChallenge: '/api/challenges',
  getChallenges: '/api/challenges',
  getChallenge: (id) => `/api/challenges/${id}`,
  participateInChallenge: (id) => `/api/challenges/${id}/participate`,
  updateChallengeProgress: (id) => `/api/challenges/${id}/progress`,
};

// API 호출 함수들을 정의합니다.
export const apiCalls = {
  // 사용자 관리 API 호출
  register: (userData) => api.post(endpoints.register, userData),
  login: (credentials) => api.post(endpoints.login, credentials),
  getUserProfile: (id) => api.get(endpoints.getUserProfile(id)),
  updateUserProfile: (id, userData) => api.put(endpoints.updateUserProfile(id), userData),

  // 감정 공유 API 호출
  createEmotion: (emotionData) => api.post(endpoints.createEmotion, emotionData),
  getEmotions: () => api.get(endpoints.getEmotions),
  updateEmotion: (id, emotionData) => api.put(endpoints.updateEmotion(id), emotionData),
  getEmotionStats: () => api.get(endpoints.getEmotionStats),

  // 일상 공유 API 호출
  createPost: (postData) => api.post(endpoints.createPost, postData),
  getPosts: () => api.get(endpoints.getPosts),
  getPost: (id) => api.get(endpoints.getPost(id)),
  updatePost: (id, postData) => api.put(endpoints.updatePost(id), postData),
  deletePost: (id) => api.delete(endpoints.deletePost(id)),
  createComment: (id, commentData) => api.post(endpoints.createComment(id), commentData),

  // 위로의 벽 API 호출
  createComfortWallPost: (postData) => api.post(endpoints.createComfortWallPost, postData),
  getComfortWallPosts: () => api.get(endpoints.getComfortWallPosts),
  createComfortMessage: (id, messageData) => api.post(endpoints.createComfortMessage(id), messageData),

  // 챌린지 시스템 API 호출
  createChallenge: (challengeData) => api.post(endpoints.createChallenge, challengeData),
  getChallenges: () => api.get(endpoints.getChallenges),
  getChallenge: (id) => api.get(endpoints.getChallenge(id)),
  participateInChallenge: (id) => api.post(endpoints.participateInChallenge(id)),
  updateChallengeProgress: (id, progressData) => api.post(endpoints.updateChallengeProgress(id), progressData),
};

export default api;