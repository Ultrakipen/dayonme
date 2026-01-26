// src/services/api/unifiedPostService.ts
// 4가지 메뉴의 게시물을 통합 관리하는 서비스

import apiClient from './client';
import myDayService from './myDayService';
import comfortWallService from './comfortWallService';
import postService from './postService';
import challengeService from './challengeService';
import statsService from './statsService';

interface UnifiedPost {
  post_id: number;
  content: string;
  title?: string;
  created_at: string;
  updated_at: string;
  like_count: number;
  comment_count: number;
  is_anonymous: boolean;
  user_id: number;
  user?: {
    nickname: string;
    profile_image_url?: string;
  };
  source: 'myday' | 'comfort' | 'posts' | 'challenge' | 'reflection';
  post_type: string;
  image_url?: string;
  tags?: string[];
  emotions?: Array<{
    emotion_id: number;
    name: string;
    icon: string;
  }>;
}

const unifiedPostService = {
  // 모든 소스에서 내 게시물 조회
  getAllMyPosts: async (params?: {
    page?: number;
    limit?: number;
    sort_by?: 'latest' | 'popular';
    include_sources?: ('myday' | 'comfort' | 'posts' | 'challenge' | 'reflection')[];
  }) => {
    try {
      if (__DEV__) console.log('🚀 통합 내 게시물 조회 시작:', params);
      
      const includeSources = params?.include_sources || ['myday', 'comfort', 'challenge', 'reflection'];
      const results: UnifiedPost[] = [];
      const errors: any[] = [];

      // 1. 나의 하루 게시물
      if (includeSources.includes('myday')) {
        try {
          if (__DEV__) console.log('📅 MyDay 게시물 조회 중...');
          const myDayData = await myDayService.getMyPosts(params);
          if (__DEV__) console.log('📅 MyDay API 응답:', {
            hasData: !!myDayData,
            hasPosts: !!myDayData?.posts,
            postsLength: myDayData?.posts?.length || 0,
            첫번째게시물: myDayData?.posts?.[0]
          });
          if (myDayData?.posts) {
            const myDayPosts: UnifiedPost[] = myDayData.posts.map((post: any) => ({
              ...post,
              source: 'myday',
              post_type: 'myday'
            }));
            results.push(...myDayPosts);
            if (__DEV__) console.log('✅ MyDay 게시물:', myDayPosts.length, '개');
          }
        } catch (error: unknown) {
          if (__DEV__) console.log('⚠️ MyDay 게시물 조회 실패:', {
            message: error?.message,
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            data: error?.response?.data,
            code: error?.code,
            config: {
              url: error?.config?.url,
              baseURL: error?.config?.baseURL,
              headers: error?.config?.headers
            }
          });
          errors.push({ source: 'myday', error });
        }
      }

      // 2. 위로와 공감 게시물 (내가 작성한 것만)
      if (includeSources.includes('comfort')) {
        try {
          if (__DEV__) console.log('💝 위로와 공감 내 게시물 조회 중...');
          const comfortData = await comfortWallService.getPosts({
            ...params,
            author_only: true
          });
          if (__DEV__) console.log('💝 위로와공감 API 응답:', {
            hasData: !!comfortData,
            hasDataPosts: !!comfortData?.data?.posts,
            postsLength: comfortData?.data?.posts?.length || 0,
            전체응답구조: Object.keys(comfortData || {}),
            첫번째게시물: comfortData?.data?.posts?.[0]
          });
          if (comfortData?.data?.posts) {
            const comfortPosts: UnifiedPost[] = comfortData.data.posts.map((post: any) => ({
              ...post,
              source: 'comfort',
              post_type: 'comfort'
            }));
            results.push(...comfortPosts);
            if (__DEV__) console.log('✅ 위로와 공감 내 게시물:', comfortPosts.length, '개');
          }
        } catch (error: unknown) {
          if (__DEV__) console.log('⚠️ 위로와 공감 게시물 조회 실패:', {
            message: error?.message,
            status: error?.response?.status,
            statusText: error?.response?.statusText,
            data: error?.response?.data,
            code: error?.code,
            networkErrorType: error?.networkErrorType,
            config: {
              url: error?.config?.url,
              baseURL: error?.config?.baseURL,
              method: error?.config?.method
            }
          });
          errors.push({ source: 'comfort', error });
        }
      }

      // 3. 일반 게시물 - postService는 통합 관리에서 제외 (별도 독립 서비스)
      if (includeSources.includes('posts')) {
        if (__DEV__) console.log('📝 일반 게시물은 postService로 별도 관리 - 현재 통합에서 제외');
      }

      // 4. 챌린지 게시물 (안전한 처리)
      if (includeSources.includes('challenge')) {
        try {
          if (__DEV__) console.log('🎯 챌린지 내 게시물 조회 중...');
          
          // 타임아웃 설정 (3초로 더 단축하여 빠른 fallback)
          const challengeTimeout = (promise: Promise<any>, timeoutMs: number = 3000) => {
            return Promise.race([
              promise,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('CHALLENGE_API_TIMEOUT')), timeoutMs)
              )
            ]);
          };
          
          // 내가 생성한 챌린지와 참여한 챌린지 모두 가져오기 (타임아웃 적용)
          const [myCreated, myParticipations] = await Promise.allSettled([
            challengeTimeout(challengeService.getMyChallenges(params)),
            challengeTimeout(challengeService.getMyParticipations(params))
          ]);
          
          let challengePosts: any[] = [];
          
          // 내가 생성한 챌린지
          if (myCreated.status === 'fulfilled' && myCreated.value?.data) {
            challengePosts.push(...myCreated.value.data.map((challenge: any) => ({
              ...challenge,
              source: 'challenge',
              post_type: 'challenge_created'
            })));
            if (__DEV__) console.log('✅ 내가 생성한 챌린지:', myCreated.value.data.length, '개');
          } else if (myCreated.status === 'rejected') {
            const error = myCreated.reason;
            if (error?.message === 'CHALLENGE_API_TIMEOUT') {
              if (__DEV__) console.log('⚠️ 챌린지 API 타임아웃 - 생성한 챌린지 조회 건너뜀');
            } else if (error?.message?.includes('401') || error?.response?.status === 401) {
              if (__DEV__) console.log('⚠️ 인증 오류 - 챌린지 API 접근 권한 없음');
            } else {
              if (__DEV__) console.log('⚠️ 내가 생성한 챌린지 조회 실패:', error?.message || 'Unknown error');
            }
          }
          
          // 내가 참여한 챌린지  
          if (myParticipations.status === 'fulfilled' && myParticipations.value?.data) {
            challengePosts.push(...myParticipations.value.data.map((challenge: any) => ({
              ...challenge,
              source: 'challenge', 
              post_type: 'challenge_participated'
            })));
            if (__DEV__) console.log('✅ 내가 참여한 챌린지:', myParticipations.value.data.length, '개');
          } else if (myParticipations.status === 'rejected') {
            const error = myParticipations.reason;
            if (error?.message === 'CHALLENGE_API_TIMEOUT') {
              if (__DEV__) console.log('⚠️ 챌린지 API 타임아웃 - 참여한 챌린지 조회 건너뜀');
            } else if (error?.message?.includes('401') || error?.response?.status === 401) {
              if (__DEV__) console.log('⚠️ 인증 오류 - 챌린지 참여 정보 접근 권한 없음');
            } else {
              if (__DEV__) console.log('⚠️ 내가 참여한 챌린지 조회 실패:', error?.message || 'Unknown error');
            }
          }
          
          if (challengePosts.length > 0) {
            const processedPosts: UnifiedPost[] = challengePosts.map((challenge: any) => ({
              ...challenge,
              source: 'challenge',
              post_type: challenge.post_type || 'challenge'
            }));
            results.push(...processedPosts);
            if (__DEV__) console.log('✅ 챌린지 내 게시물:', processedPosts.length, '개');
          }
        } catch (error: unknown) {
          if (__DEV__) console.log('⚠️ 챌린지 게시물 조회 치명적 실패:', {
            message: error?.message,
            name: error?.name,
            stack: error?.stack?.split('\n')[0] // 스택의 첫 번째 라인만
          });
          errors.push({ source: 'challenge', error, severity: 'low' }); // 낮은 중요도로 표시
        }
      }

      // 5. 일상 돌아보기 (통계 기반)
      if (includeSources.includes('reflection')) {
        try {
          if (__DEV__) console.log('📊 일상 돌아보기 데이터 조회 중...');
          
          // 타임아웃 설정 (5초)
          const reflectionTimeout = (promise: Promise<any>, timeoutMs: number = 5000) => {
            return Promise.race([
              promise,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('REFLECTION_TIMEOUT')), timeoutMs)
              )
            ]);
          };
          
          // 통계 서비스에서 사용자 통계와 감정 트렌드 가져오기 (타임아웃 적용)
          const [userStats, emotionTrends] = await Promise.allSettled([
            reflectionTimeout(statsService.getUserStats()),
            reflectionTimeout(statsService.getEmotionTrends({ type: 'weekly' }))
          ]);
          
          let reflectionData: any[] = [];
          
          // 사용자 통계를 게시물 형태로 변환
          if (userStats.status === 'fulfilled' && userStats.value?.data) {
            reflectionData.push({
              post_id: `reflection_stats_${Date.now()}`,
              content: '나의 감정 통계 및 활동 요약',
              title: '일상 돌아보기 - 감정 통계',
              created_at: new Date().toISOString(),
              source: 'reflection',
              post_type: 'user_stats',
              stats_data: userStats.value.data
            });
            if (__DEV__) console.log('✅ 사용자 통계 데이터 로드 성공');
          } else if (userStats.status === 'rejected') {
            if (__DEV__) console.log('⚠️ 사용자 통계 조회 실패:', userStats.reason?.message || 'Unknown error');
          }
          
          // 감정 트렌드를 게시물 형태로 변환
          if (emotionTrends.status === 'fulfilled' && emotionTrends.value?.data) {
            reflectionData.push({
              post_id: `reflection_trends_${Date.now()}`,
              content: '나의 감정 변화 트렌드',
              title: '일상 돌아보기 - 감정 트렌드',
              created_at: new Date().toISOString(),
              source: 'reflection',
              post_type: 'emotion_trends',
              trends_data: emotionTrends.value.data
            });
            if (__DEV__) console.log('✅ 감정 트렌드 데이터 로드 성공');
          } else if (emotionTrends.status === 'rejected') {
            if (__DEV__) console.log('⚠️ 감정 트렌드 조회 실패:', emotionTrends.reason?.message || 'Unknown error');
          }
          
          if (reflectionData.length > 0) {
            const processedPosts: UnifiedPost[] = reflectionData.map((reflection: any) => ({
              ...reflection,
              source: 'reflection',
              like_count: 0,
              comment_count: 0,
              is_anonymous: false
            }));
            results.push(...processedPosts);
            if (__DEV__) console.log('✅ 일상 돌아보기 데이터:', processedPosts.length, '개');
          }
        } catch (error) {
          if (__DEV__) console.log('⚠️ 일상 돌아보기 조회 실패:', error);
          errors.push({ source: 'reflection', error });
        }
      }

      // 날짜순 정렬 (최신순)
      results.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      });

      const summary = {
        totalPosts: results.length,
        sources: results.reduce((acc: Record<string, number>, post) => {
          acc[post.source] = (acc[post.source] || 0) + 1;
          return acc;
        }, {}),
        errors: errors.length
      };

      if (__DEV__) console.log('📊 통합 게시물 조회 결과:', summary);

      return {
        status: 'success',
        posts: results,
        total: results.length,
        summary,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error: unknown) {
      if (__DEV__) console.log('⚠️ 통합 게시물 조회 치명적 오류:', error?.message);
      throw new Error('게시물을 불러오는 중 오류가 발생했습니다.');
    }
  },

  // 특정 소스의 게시물만 조회
  getPostsBySource: async (
    source: 'myday' | 'comfort' | 'posts' | 'challenge' | 'reflection',
    params?: any
  ) => {
    if (__DEV__) console.log(`🎯 ${source} 게시물 조회:`, params);

    switch (source) {
      case 'myday':
        return await myDayService.getMyPosts(params);
      case 'comfort':
        return await comfortWallService.getPosts({
          ...params,
          author_only: true
        });
      case 'posts':
        return await postService.getMyPosts(params);
      case 'challenge':
        // 생성한 챌린지와 참여한 챌린지 모두 반환
        const [created, participated] = await Promise.allSettled([
          challengeService.getMyChallenges(params),
          challengeService.getMyParticipations(params)
        ]);
        const challenges: any[] = [];
        if (created.status === 'fulfilled') challenges.push(...(created.value?.data || []));
        if (participated.status === 'fulfilled') challenges.push(...(participated.value?.data || []));
        return { data: challenges, status: 'success' };
      case 'reflection':
        // 통계 데이터 반환
        const [stats, trends] = await Promise.allSettled([
          statsService.getUserStats(),
          statsService.getEmotionTrends({ type: 'weekly' })
        ]);
        const reflections: any[] = [];
        if (stats.status === 'fulfilled') reflections.push(stats.value?.data);
        if (trends.status === 'fulfilled') reflections.push(trends.value?.data);
        return { data: reflections, status: 'success' };
      default:
        throw new Error(`지원하지 않는 소스: ${source}`);
    }
  },

  // 게시물 검색 (모든 소스에서)
  searchMyPosts: async (query: string, params?: any) => {
    if (__DEV__) console.log('🔍 통합 게시물 검색:', { query, params });
    
    // 각 소스에서 검색한 후 통합
    const results = await unifiedPostService.getAllMyPosts({
      ...params,
      search: query
    });

    // 검색어와 매칭되는 게시물 필터링
    if (query && results.posts) {
      const filteredPosts = results.posts.filter((post: UnifiedPost) => 
        post.content?.toLowerCase().includes(query.toLowerCase()) ||
        post.title?.toLowerCase().includes(query.toLowerCase())
      );

      return {
        ...results,
        posts: filteredPosts,
        total: filteredPosts.length
      };
    }

    return results;
  }
};

export default unifiedPostService;