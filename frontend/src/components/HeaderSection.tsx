import React, { useEffect, useState } from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Surface } from 'react-native-paper';
import { Box, Text, VStack, HStack } from './ui';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import ProfileImage from './common/ProfileImage';

const HeaderSection: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { profileData } = useProfile();
  const [greeting, setGreeting] = useState('');

  // 시간대별 인사말 생성
  useEffect(() => {
    const getGreeting = () => {
      const hour = new Date().getHours();
      const name = profileData.nickname || user?.nickname || user?.username || '사용자';

      if (hour >= 5 && hour < 12) {
        return `안녕하세요, ${name}님! 🌅`;
      } else if (hour >= 12 && hour < 18) {
        return `안녕하세요, ${name}님! ☀️`;
      } else if (hour >= 18 && hour < 22) {
        return `안녕하세요, ${name}님! 🌆`;
      } else {
        return `안녕하세요, ${name}님! 🌙`;
      }
    };

    setGreeting(getGreeting());
  }, [profileData.nickname, user?.nickname, user?.username]);

  // 오늘 날짜 포맷
  const getTodayDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    };
    return today.toLocaleDateString('ko-KR', options);
  };

  const handleProfilePress = () => {
    // @ts-ignore - navigation type issue
    navigation.navigate('Profile', {
      screen: 'ProfileMain'
    });
  };

  const handleSettingsPress = () => {
    // @ts-ignore - navigation type issue
    navigation.navigate('Profile', {
      screen: 'ProfileEdit'
    });
  };

  return (
    <Surface style={styles.container} elevation={2}>
      {/* 상단 그라데이션 라인 */}
      <Box style={styles.gradientLine} />

      <Box style={styles.content}>
        <HStack style={styles.topRow}>
          {/* 프로필 이미지 */}
          <TouchableOpacity
            onPress={handleProfilePress}
            style={styles.profileContainer}
            activeOpacity={0.7}
          >
            <ProfileImage
              imageUrl={profileData.profile_image_url}
              size="large"
              showBorder={true}
              style={styles.profileImage}
            />
            <Box style={styles.onlineDot} />
          </TouchableOpacity>

          {/* 인사말 및 날짜 */}
          <VStack style={styles.textContainer}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.date}>{getTodayDate()}</Text>
          </VStack>

          {/* 설정 버튼 */}
          <TouchableOpacity
            onPress={handleSettingsPress}
            style={styles.settingsButton}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="cog"
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </HStack>

        {/* 하단 감정 상태 */}
        {profileData.emotion_preferences.length > 0 && (
          <Box style={styles.emotionSection}>
            <Text style={styles.emotionLabel}>오늘의 기분</Text>
            <HStack style={styles.emotionTags}>
              {profileData.emotion_preferences.slice(0, 3).map((emotionId, index) => {
                // 감정 이모지 매핑
                const getEmotionEmoji = (id: string) => {
                  const emojiMap: { [key: string]: string } = {
                    happy: '😊', excited: '🤩', peaceful: '😌',
                    grateful: '🙏', hopeful: '🌟', confident: '💪',
                    sad: '😢', anxious: '😰', angry: '😠',
                    tired: '😴', confused: '😕', proud: '😌'
                  };
                  return emojiMap[id] || '😊';
                };

                return (
                  <Box key={index} style={styles.emotionTag}>
                    <Text style={styles.emotionEmoji}>
                      {getEmotionEmoji(emotionId)}
                    </Text>
                  </Box>
                );
              })}
            </HStack>
          </Box>
        )}
      </Box>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 50 : 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  gradientLine: {
    height: 4,
    backgroundColor: '#4a0e4e',
    background: 'linear-gradient(90deg, #4a0e4e, #7c3aed, #a855f7)',
  },
  content: {
    padding: 20,
  },
  topRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileContainer: {
    position: 'relative',
  },
  profileImage: {
    borderWidth: 3,
    borderColor: '#4a0e4e20',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emotionSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  emotionLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emotionTags: {
    gap: 8,
  },
  emotionTag: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  emotionEmoji: {
    fontSize: 18,
  },
});

export default HeaderSection;