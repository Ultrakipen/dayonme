// screens/PostDetail/PostDetailRouter.tsx
// PostDetail 라우터
import React from 'react';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types/navigation';
import PostDetailScreen from './index';
import PostDetailErrorBoundary from '../../components/PostDetailErrorBoundary';

type PostDetailRouteProp = RouteProp<RootStackParamList, 'PostDetail'>;
type PostDetailNavigationProp = StackNavigationProp<RootStackParamList, 'PostDetail'>;

/**
 * PostDetail 라우터
 */
const PostDetailRouter: React.FC = () => {
  const route = useRoute<PostDetailRouteProp>();
  const navigation = useNavigation<PostDetailNavigationProp>();

  const handleRetry = () => {
    // 화면 리로드를 위해 navigation state 리셋
    navigation.setParams({ ...route.params });
  };

  return (
    <PostDetailErrorBoundary onRetry={handleRetry}>
      <PostDetailScreen navigation={navigation} route={route} />
    </PostDetailErrorBoundary>
  );
};

export default PostDetailRouter;
