import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface ProfileData {
  nickname: string;
  favorite_quote: string;
  theme_preference: 'light' | 'dark' | 'system';
  profile_image_url?: string;
  background_image_url?: string;
  privacy_settings: {
    show_profile: boolean;
    show_emotions: boolean;
    show_posts: boolean;
    show_challenges: boolean;
  };
  notification_settings: {
    like_notifications: boolean;
    comment_notifications: boolean;
    challenge_notifications: boolean;
    encouragement_notifications: boolean;
  };
  emotion_preferences: string[];
  activity_stats: {
    total_posts: number;
    total_likes_received: number;
    total_comments: number;
    active_challenges: number;
  };
}

interface ProfileContextType {
  profileData: ProfileData;
  isLoading: boolean;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  loadProfile: () => Promise<void>;
  resetProfile: () => Promise<void>;
}

const defaultProfileData: ProfileData = {
  nickname: '',
  favorite_quote: '',
  theme_preference: 'system',
  profile_image_url: undefined,
  background_image_url: undefined,
  privacy_settings: {
    show_profile: true,
    show_emotions: true,
    show_posts: true,
    show_challenges: true,
  },
  notification_settings: {
    like_notifications: true,
    comment_notifications: true,
    challenge_notifications: true,
    encouragement_notifications: true,
  },
  emotion_preferences: [],
  activity_stats: {
    total_posts: 0,
    total_likes_received: 0,
    total_comments: 0,
    active_challenges: 0,
  },
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const PROFILE_STORAGE_KEY = '@iexist_profile_data';

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profileData, setProfileData] = useState<ProfileData>(defaultProfileData);
  const [isLoading, setIsLoading] = useState(true);

  // 프로필 데이터 로드
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const savedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfileData(prev => ({
          ...defaultProfileData,
          ...parsedProfile,
          // 중첩 객체는 따로 병합
          privacy_settings: {
            ...defaultProfileData.privacy_settings,
            ...(parsedProfile.privacy_settings || {}),
          },
          notification_settings: {
            ...defaultProfileData.notification_settings,
            ...(parsedProfile.notification_settings || {}),
          },
          activity_stats: {
            ...defaultProfileData.activity_stats,
            ...(parsedProfile.activity_stats || {}),
          },
        }));
      }
    } catch (error) {
      if (__DEV__) console.error('프로필 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 프로필 데이터 업데이트
  const updateProfile = async (data: Partial<ProfileData>) => {
    try {
      const updatedProfile = {
        ...profileData,
        ...data,
        // 중첩 객체 병합 처리
        privacy_settings: {
          ...profileData.privacy_settings,
          ...(data.privacy_settings || {}),
        },
        notification_settings: {
          ...profileData.notification_settings,
          ...(data.notification_settings || {}),
        },
        activity_stats: {
          ...profileData.activity_stats,
          ...(data.activity_stats || {}),
        },
      };

      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      setProfileData(updatedProfile);
    } catch (error) {
      if (__DEV__) console.error('프로필 업데이트 실패:', error);
      Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
      throw error;
    }
  };

  // 프로필 초기화
  const resetProfile = async () => {
    try {
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      setProfileData(defaultProfileData);
    } catch (error) {
      if (__DEV__) console.error('프로필 초기화 실패:', error);
      Alert.alert('오류', '프로필 초기화에 실패했습니다.');
    }
  };

  // 컴포넌트 마운트 시 프로필 로드
  useEffect(() => {
    loadProfile();
  }, []);

  const value: ProfileContextType = {
    profileData,
    isLoading,
    updateProfile,
    loadProfile,
    resetProfile,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export default ProfileContext;