import React from 'react';
import { View, Text as RNText, StyleSheet } from 'react-native';
import { Text } from './ui';
import { useNotification } from '../contexts/NotificationContext';

interface NotificationBadgeProps {
  style?: object;
  showZero?: boolean;
  maxCount?: number;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  style,
  showZero = false,
  maxCount = 99
}) => {
  const { unreadCount } = useNotification();
  
  // 표시할 카운트 계산 (maxCount 초과 시 "+")
  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString();
  
  // 카운트가 0이고 showZero가 false이면 렌더링하지 않음
  if (unreadCount === 0 && !showZero) {
    return null;
  }
  
  return (
    <View 
      style={[
        styles.badge,
        style,
        unreadCount > 9 && styles.wideBadge,
        unreadCount > 99 && styles.extraWideBadge
      ]}
    >
      <Text style={styles.count}>{displayCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  wideBadge: {
    minWidth: 22,
    borderRadius: 11
  },
  extraWideBadge: {
    minWidth: 28
  },
  count: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center'
  }
});

export default NotificationBadge;