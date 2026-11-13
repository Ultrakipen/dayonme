// screens/PostDetail/PostDetailRouter.tsx
// PostDetail 라우터: enableSwipe 파라미터에 따라 적절한 컴포넌트 렌더링
import React from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types/navigation';
import PostDetailScreen from './index';
import PostDetailSwipeWrapper from './PostDetailSwipeWrapper';
import PostDetailErrorBoundary from '../../components/PostDetailErrorBoundary';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;

/**
 * PostDetail 라우터
 * - enableSwipe가 true이면 스와이프 기능 포함
 * - enableSwipe가 false 또는 undefined이면 기존 화면
 */
const PostDetailRouter: React.FC = () => {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation();
  const { enableSwipe } = route.params;

  const handleRetry = () => {
    // 화면 리로드를 위해 navigation state 리셋
    navigation.setParams({ ...route.params });
  };

  // 스와이프 기능 활성화 시
  if (enableSwipe) {
    return (
      <PostDetailErrorBoundary onRetry={handleRetry}>
        <PostDetailSwipeWrapper />
      </PostDetailErrorBoundary>
    );
  }

  // 기존 방식 (뒤로가기 목록으로 복귀)
  return (
    <PostDetailErrorBoundary onRetry={handleRetry}>
      <PostDetailScreen />
    </PostDetailErrorBoundary>
  );
};

export default PostDetailRouter;
