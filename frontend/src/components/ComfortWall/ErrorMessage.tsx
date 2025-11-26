// src/components/ComfortWall/ErrorMessage.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'network' | 'server' | 'validation' | 'auth' | 'general';
  onRetry?: () => void;
  onDismiss?: () => void;
  retryText?: string;
  dismissText?: string;
  style?: any;
  showIcon?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = 'general',
  onRetry,
  onDismiss,
  retryText = '다시 시도',
  dismissText = '닫기',
  style,
  showIcon = true
}) => {
  const theme = useTheme();

  const getErrorIcon = () => {
    switch (type) {
      case 'network':
        return 'wifi-off';
      case 'server':
        return 'server-network-off';
      case 'validation':
        return 'alert-circle-outline';
      case 'auth':
        return 'account-alert-outline';
      case 'general':
      default:
        return 'alert-circle-outline';
    }
  };

  const getErrorColor = () => {
    switch (type) {
      case 'network':
        return '#FF9800'; // Orange
      case 'server':
        return '#F44336'; // Red
      case 'validation':
        return '#FF5722'; // Deep Orange
      case 'auth':
        return '#9C27B0'; // Purple
      case 'general':
      default:
        return '#757575'; // Grey
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'network':
        return '연결 오류';
      case 'server':
        return '서버 오류';
      case 'validation':
        return '입력 오류';
      case 'auth':
        return '인증 오류';
      case 'general':
      default:
        return '오류 발생';
    }
  };

  const errorColor = getErrorColor();
  const iconName = getErrorIcon();
  const displayTitle = title || getDefaultTitle();

  return (
    <Card style={[styles.container, style]}>
      <Card.Content style={styles.content}>
        {showIcon && (
          <MaterialCommunityIcons 
            name={iconName}
            size={48}
            color={errorColor}
            style={styles.icon}
          />
        )}
        
        <Text style={[styles.title, { color: errorColor }]}>
          {displayTitle}
        </Text>
        
        <Text style={[styles.message, { color: theme.colors.onSurface }]}>
          {message}
        </Text>
        
        <View style={styles.buttonContainer}>
          {onRetry && (
            <Button
              mode="contained"
              onPress={onRetry}
              style={[styles.button, { backgroundColor: errorColor }]}
              labelStyle={styles.buttonLabel}
            >
              {retryText}
            </Button>
          )}
          
          {onDismiss && (
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={[styles.button, styles.dismissButton]}
              labelStyle={[styles.buttonLabel, { color: theme.colors.onSurface }]}
            >
              {dismissText}
            </Button>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};

// 특별한 경우를 위한 커스텀 에러 컴포넌트들
export const NetworkErrorMessage: React.FC<{
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ onRetry, onDismiss }) => (
  <ErrorMessage
    type="network"
    message="인터넷 연결을 확인하고 다시 시도해주세요."
    onRetry={onRetry}
    onDismiss={onDismiss}
  />
);

export const ServerErrorMessage: React.FC<{
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ onRetry, onDismiss }) => (
  <ErrorMessage
    type="server"
    message="서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
    onRetry={onRetry}
    onDismiss={onDismiss}
  />
);

export const AuthErrorMessage: React.FC<{
  onLogin?: () => void;
  onDismiss?: () => void;
}> = ({ onLogin, onDismiss }) => (
  <ErrorMessage
    type="auth"
    message="로그인이 필요한 서비스입니다. 로그인 후 이용해주세요."
    onRetry={onLogin}
    onDismiss={onDismiss}
    retryText="로그인"
  />
);

export const ValidationErrorMessage: React.FC<{
  message: string;
  onDismiss?: () => void;
}> = ({ message, onDismiss }) => (
  <ErrorMessage
    type="validation"
    message={message}
    onDismiss={onDismiss}
    showIcon={false}
  />
);

// 인라인 에러 메시지 (작은 공간용)
export const InlineErrorMessage: React.FC<{
  message: string;
  style?: any;
}> = ({ message, style }) => {
  const theme = useTheme();
  
  return (
    <View style={[styles.inlineContainer, style]}>
      <MaterialCommunityIcons 
        name="alert-circle-outline"
        size={16}
        color={theme.colors.error}
        style={styles.inlineIcon}
      />
      <Text style={[styles.inlineMessage, { color: theme.colors.error }]}>
        {message}
      </Text>
    </View>
  );
};

// 빈 상태 메시지
export const EmptyStateMessage: React.FC<{
  title?: string;
  message: string;
  iconName?: string;
  onAction?: () => void;
  actionText?: string;
  style?: any;
}> = ({ 
  title = '내용이 없습니다',
  message, 
  iconName = 'inbox-outline',
  onAction,
  actionText = '새로고침',
  style 
}) => {
  const theme = useTheme();
  
  return (
    <View style={[styles.emptyContainer, style]}>
      <MaterialCommunityIcons 
        name={iconName}
        size={64}
        color={theme.colors.outline}
        style={styles.emptyIcon}
      />
      
      <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      
      <Text style={[styles.emptyMessage, { color: theme.colors.onSurfaceVariant }]}>
        {message}
      </Text>
      
      {onAction && (
        <Button
          mode="outlined"
          onPress={onAction}
          style={styles.emptyButton}
        >
          {actionText}
        </Button>
      )}
    </View>
  );
};

// 게시물 관련 특별 에러 메시지들
export const PostNotFoundError: React.FC<{
  onGoBack?: () => void;
}> = ({ onGoBack }) => (
  <EmptyStateMessage
    title="게시물을 찾을 수 없습니다"
    message="삭제되었거나 존재하지 않는 게시물입니다."
    iconName="post-outline"
    onAction={onGoBack}
    actionText="돌아가기"
  />
);

export const NoPostsMessage: React.FC<{
  onRefresh?: () => void;
}> = ({ onRefresh }) => (
  <EmptyStateMessage
    title="게시물이 없습니다"
    message="아직 작성된 게시물이 없습니다. 첫 번째 게시물을 작성해보세요!"
    iconName="note-plus-outline"
    onAction={onRefresh}
    actionText="새로고침"
  />
);

export const NoCommentsMessage: React.FC = () => (
  <EmptyStateMessage
    title="댓글이 없습니다"
    message="첫 번째 댓글을 작성해보세요!"
    iconName="comment-plus-outline"
  />
);

export const SearchNoResultsMessage: React.FC<{
  query: string;
  onClearSearch?: () => void;
}> = ({ query, onClearSearch }) => (
  <EmptyStateMessage
    title="검색 결과가 없습니다"
    message={`"${query}"에 대한 검색 결과를 찾을 수 없습니다.`}
    iconName="magnify"
    onAction={onClearSearch}
    actionText="검색 초기화"
  />
);

const styles = StyleSheet.create({
  container: {
    margin: 16,
    elevation: 2,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    marginHorizontal: 4,
    marginVertical: 4,
    minWidth: 80,
  },
  dismissButton: {
    borderWidth: 1,
  },
  buttonLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // 인라인 에러 메시지 스타일
  inlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  inlineIcon: {
    marginRight: 6,
  },
  inlineMessage: {
    fontSize: 12,
    flex: 1,
  },
  
  // 빈 상태 메시지 스타일
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    opacity: 0.7,
  },
  emptyButton: {
    minWidth: 120,
  },
});

export default ErrorMessage;