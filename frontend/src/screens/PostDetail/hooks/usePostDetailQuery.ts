import { useQuery } from '@tanstack/react-query';
import postService from '../../../services/api/postService';
import comfortWallService from '../../../services/api/comfortWallService';
import myDayService from '../../../services/api/myDayService';
import { tryMultipleApis, retryApiCall } from '../utils/apiHelper';
import logger from '../../../utils/logger';

export interface UsePostDetailQueryOptions {
  postId: number;
  postType?: 'myday' | 'comfort' | 'posts';
  enabled?: boolean;
}

export const usePostDetailQuery = ({
  postId,
  postType,
  enabled = true,
}: UsePostDetailQueryOptions) => {
  return useQuery({
    queryKey: ['post-detail', postId, postType],
    queryFn: async () => {
      logger.log('🔍 PostDetail 데이터 로드 시작:', { postId, postType });

      // postId 유효성 검사
      if (!postId || typeof postId !== 'number' || postId <= 0) {
        logger.error('❌ 유효하지 않은 postId:', postId);
        throw new Error('잘못된 게시물 ID입니다.');
      }

      // postType에 따라 API 호출
      const postResponse = await retryApiCall(() =>
        tryMultipleApis(postType, {
          myday: () => myDayService.getPostById(postId),
          comfort: () => comfortWallService.getPostDetail(postId),
          posts: () => postService.getPostById(postId)
        })
      );

      const responseData = postResponse.data;
      logger.log('🔍 PostDetail API 응답:', {
        hasResponseData: !!responseData,
        status: responseData?.status,
      });

      // 에러 응답 확인
      if (responseData && responseData.status === 'error') {
        logger.log('❌ 서버 에러 응답:', responseData.message);
        throw new Error(responseData.message || '게시물을 불러올 수 없습니다.');
      }

      // 데이터 추출
      let postData = null;

      if (responseData && responseData.status === 'success' && responseData.data) {
        postData = responseData.data;
      } else if (responseData && responseData.data && responseData.data.status === 'success' && responseData.data.data) {
        postData = responseData.data.data;
      } else if (responseData && typeof responseData === 'object' && responseData.post_id) {
        postData = responseData;
      }

      if (!postData) {
        throw new Error('게시물 데이터를 불러올 수 없습니다.');
      }

      // 날짜 정규화
      const normalizedPostData = {
        ...postData,
        created_at: postData.created_at || postData.createdAt || new Date().toISOString(),
        updated_at: postData.updated_at || postData.updatedAt || postData.created_at || postData.createdAt || new Date().toISOString()
      };

      logger.log('✅ 게시물 데이터 로드 완료:', normalizedPostData.post_id);

      return normalizedPostData;
    },
    enabled: enabled && !!postId && postId > 0,
    staleTime: 30 * 1000,      // 30초 캐싱
    gcTime: 5 * 60 * 1000,     // 5분
    retry: 2,                   // 자동 재시도
    refetchOnMount: false,
  });
};
