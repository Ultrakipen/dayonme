import React from 'react';
import { View, Text as RNText, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text } from './ui';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../contexts/NotificationContext';

// 아이콘 컴포넌트 - 실제 구현에 맞게 수정 필요
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// NotificationContext에서 정의된 타입 사용
interface Notification {
  id: number;
  user_id: number;
  content: string;
  notification_type: 'like' | 'comment' | 'challenge' | 'system';
  related_id?: number;
  is_read: boolean;
  created_at: string;
}

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const navigation = useNavigation<any>(); // any 타입으로 변경
  const { markAsRead, deleteNotification } = useNotification();
  
  // 알림 유형에 따른 아이콘 결정
  const getIcon = () => {
    switch (notification.notification_type) {
      case 'like':
        return 'heart-outline';
      case 'comment':
        return 'comment-outline';
      case 'challenge':
        return 'trophy-outline';
      case 'system':
        return 'bell-outline';
      default:
        return 'bell-outline';
    }
  };
  
  // 알림 시간 포맷팅 - 직접 구현으로 변경
  const formattedTime = formatRelativeTime(notification.created_at);
  
 // 알림 클릭 처리
 const handlePress = async () => {
  // onPress 콜백을 먼저 호출
  if (onPress) {
    onPress();
  }

  if (!notification.is_read) {
    await markAsRead(notification.id);
  }
  
  // 알림 유형에 따라 다른 화면으로 이동
  if (notification.related_id) {
    switch (notification.notification_type) {
      case 'like':
      case 'comment':
        navigation.navigate('PostDetail', { postId: notification.related_id, postType: 'myday' });
        break;
      case 'challenge':
        navigation.navigate('ChallengeDetailScreen', { challengeId: notification.related_id });
        break;
    }
  }
};
  // 알림 삭제 확인
  const confirmDelete = () => {
    Alert.alert(
      '알림 삭제',
      '이 알림을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          onPress: () => deleteNotification(notification.id),
          style: 'destructive'
        }
      ]
    );
  };
  
  return (
    <TouchableOpacity
      testID="notification-item"
      style={[
        styles.container,
        !notification.is_read && styles.unread
      ]}
      onPress={handlePress}
      onLongPress={confirmDelete}
    >
      <View style={styles.iconContainer}>
        <Icon name={getIcon()} size={24} color="#4A6572" />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.content}>{notification.content}</Text>
        <Text style={styles.time}>{formattedTime}</Text>
      </View>
      {!notification.is_read && <View testID="unread-indicator" style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

// date-fns 대신 직접 포맷팅 함수 구현
const formatRelativeTime = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  
  // 분 단위 차이 계산
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  
  // 시간 단위 차이 계산
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  
  // 일 단위 차이 계산
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}일 전`;
  
  // 주 단위 차이 계산
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks}주 전`;
  
  // 월 단위 차이 계산
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}개월 전`;
  
  // 년 단위 차이 계산
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}년 전`;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
    backgroundColor: 'white'
  },
  unread: {
    backgroundColor: '#F5F8FA'
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8EDF0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  content: {
    fontSize: 14,
    color: '#14171A',
    marginBottom: 4
  },
  time: {
    fontSize: 12,
    color: '#657786'
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1DA1F2',
    alignSelf: 'center',
    marginLeft: 8
  }
});

export default NotificationItem;