// src/components/StatisticsCard.tsx
import React from 'react';
import { View, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import { Card, Text, Surface, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface StatItem {
  id: string;
  label: string;
  value: number;
  icon: string;
  color: string;
  description?: string;
}

interface StatisticsCardProps {
  title: string;
  stats: StatItem[];
  onPress?: (statId: string) => void;
  showProgress?: boolean;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  stats,
  onPress,
  showProgress = false
}) => {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const getStatItemWidth = () => {
    const cardPadding = 32; // Card의 좌우 패딩
    const gaps = (stats.length - 1) * 8; // 아이템 사이 간격
    return (width - cardPadding - gaps) / stats.length;
  };

  return (
    <Card style={styles.card}>
      <Card.Title 
        title={title} 
        titleStyle={styles.cardTitle}
      />
      <Card.Content>
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <Surface
              key={stat.id}
              style={[
                styles.statItem,
                { width: getStatItemWidth() }
              ]}
              elevation={1}
            >
              <View 
                style={[
                  styles.statContent,
                  onPress && styles.clickableContent
                ]}
                {...(onPress && {
                  onTouchEnd: () => onPress(stat.id)
                })}
              >
                <View style={[styles.iconContainer, { backgroundColor: stat.color + '20' }]}>
                  <MaterialCommunityIcons
                    name={stat.icon}
                    size={24}
                    color={stat.color}
                  />
                </View>
                
                <Text style={styles.statNumber}>
                  {formatNumber(stat.value)}
                </Text>
                
                <Text style={styles.statLabel} numberOfLines={2}>
                  {stat.label}
                </Text>
                
                {stat.description && (
                  <Text style={styles.statDescription} numberOfLines={1}>
                    {stat.description}
                  </Text>
                )}
                
                {showProgress && stat.value > 0 && (
                  <View style={styles.progressContainer}>
                    <View 
                      style={[
                        styles.progressBar,
                        { 
                          backgroundColor: stat.color + '30',
                          width: `${Math.min(stat.value / 10, 100)}%`
                        }
                      ]} 
                    />
                  </View>
                )}
              </View>
            </Surface>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

// 미리 정의된 통계 템플릿들
export const ProfileStatsTemplate = (
  myDayPosts: number,
  someoneDayPosts: number,
  likesReceived: number,
  challenges: number
): StatItem[] => [
  {
    id: 'my_posts',
    label: '나의 하루',
    value: myDayPosts,
    icon: 'book-open-variant',
    color: '#4a0e4e',
    description: '작성한 글'
  },
  {
    id: 'someone_posts',
    label: '누군가의 하루',
    value: someoneDayPosts,
    icon: 'account-group',
    color: '#9c27b0',
    description: '공유한 글'
  },
  {
    id: 'likes',
    label: '받은 공감',
    value: likesReceived,
    icon: 'heart',
    color: '#e91e63',
    description: '총 공감 수'
  },
  {
    id: 'challenges',
    label: '챌린지',
    value: challenges,
    icon: 'trophy',
    color: '#ff9800',
    description: '참여 중'
  }
];

export const EmotionStatsTemplate = (
  happyDays: number,
  sadDays: number,
  angryDays: number,
  anxiousDays: number
): StatItem[] => [
  {
    id: 'happy',
    label: '행복한 날',
    value: happyDays,
    icon: 'emoticon-happy',
    color: '#4caf50'
  },
  {
    id: 'sad',
    label: '우울한 날',
    value: sadDays,
    icon: 'emoticon-sad',
    color: '#2196f3'
  },
  {
    id: 'angry',
    label: '화난 날',
    value: angryDays,
    icon: 'emoticon-angry',
    color: '#f44336'
  },
  {
    id: 'anxious',
    label: '불안한 날',
    value: anxiousDays,
    icon: 'emoticon-confused',
    color: '#ff9800'
  }
];

export const WeeklyStatsTemplate = (
  postsThisWeek: number,
  likesThisWeek: number,
  commentsThisWeek: number,
  streakDays: number
): StatItem[] => [
  {
    id: 'weekly_posts',
    label: '이번 주 글',
    value: postsThisWeek,
    icon: 'calendar-week',
    color: '#6c5ce7'
  },
  {
    id: 'weekly_likes',
    label: '이번 주 공감',
    value: likesThisWeek,
    icon: 'heart-multiple',
    color: '#fd79a8'
  },
  {
    id: 'weekly_comments',
    label: '이번 주 댓글',
    value: commentsThisWeek,
    icon: 'comment-multiple',
    color: '#00b894'
  },
  {
    id: 'streak',
    label: '연속 기록',
    value: streakDays,
    icon: 'fire',
    color: '#e17055',
    description: '일 연속'
  }
];

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    color: '#4a0e4e',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statItem: {
    borderRadius: 12,
    backgroundColor: '#fafafa',
    minHeight: 120,
  },
  statContent: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  clickableContent: {
    borderRadius: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Pretendard-Bold',
    color: '#4a0e4e',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  statDescription: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    marginTop: 2,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

export default StatisticsCard;