// src/screens/AnonymousSettingsScreen.tsx
import React, { useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import {
  Surface,
  Switch,
  Divider,
  Button
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { Box, Text, HStack, VStack, Pressable } from '../components/ui';
import { FONT_SIZES } from '../constants';

interface AnonymousSettingsScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
    setOptions: (options: any) => void;
  };
}

const AnonymousSettingsScreen: React.FC<AnonymousSettingsScreenProps> = ({ navigation }) => {
  const { user, updateUserSettings } = useAuth();
  const { theme, isDark } = useModernTheme();

  const [defaultAnonymous, setDefaultAnonymous] = useState(user?.default_anonymous_comment || false);
  const [alwaysAnonymous, setAlwaysAnonymous] = useState(user?.always_anonymous_comment || false);
  const [anonymousInReplies, setAnonymousInReplies] = useState(user?.anonymous_in_replies || false);
  const [isLoading, setIsLoading] = useState(false);

  // 헤더 설정
  React.useEffect(() => {
    navigation.setOptions({
      title: '익명 설정',
      headerStyle: {
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: theme.colors.text.primary,
      headerTitleStyle: {
        fontSize: FONT_SIZES.h2,
        fontWeight: '700',
        color: theme.colors.text.primary,
      },
      headerLeft: () => (
        <Pressable
          onPress={() => navigation.goBack()}
          className="p-2 ml-2 rounded-full"
          style={{
            backgroundColor: theme.colors.surface,
            shadowColor: isDark ? '#000' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.text.secondary}
          />
        </Pressable>
      ),
    });
  }, [navigation, theme, isDark]);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      await updateUserSettings({
        default_anonymous_comment: defaultAnonymous,
        always_anonymous_comment: alwaysAnonymous,
        anonymous_in_replies: anonymousInReplies,
      });
      
      Alert.alert('저장 완료', '익명 설정이 저장되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('설정 저장 오류:', error);
      Alert.alert('오류', '설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlwaysAnonymousChange = (value: boolean) => {
    setAlwaysAnonymous(value);
    if (value) {
      // 항상 익명이 켜지면 기본값도 켜짐
      setDefaultAnonymous(true);
    }
  };

  return (
    <Box className="flex-1" style={{ backgroundColor: theme.colors.background }}>
      <ScrollView>
        <Box className="py-6 px-4">
          {/* 설명 섹션 */}
          <Surface
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: theme.colors.border
            }}
          >
            <HStack className="items-center mb-3">
              <MaterialCommunityIcons name="information" size={20} color={theme.colors.primary} />
              <Text
                style={{
                  fontSize: FONT_SIZES.bodyLarge,
                  fontWeight: '700',
                  color: theme.colors.text.primary,
                  marginLeft: 8,
                  fontFamily: 'Pretendard-Bold'
                }}
              >
                익명 댓글 설정
              </Text>
            </HStack>
            <Text
              style={{
                fontSize: FONT_SIZES.bodySmall,
                color: theme.colors.text.secondary,
                lineHeight: 20,
                fontFamily: 'Pretendard-Medium'
              }}
            >
              댓글 작성 시 익명으로 표시되는 방식을 설정할 수 있습니다. 익명 댓글은 닉네임이 숨겨지고 '익명'으로 표시됩니다.
            </Text>
          </Surface>

          {/* 설정 옵션들 */}
          <Surface
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 16,
              marginBottom: 24,
              borderWidth: 1,
              borderColor: theme.colors.border
            }}
          >
            {/* 기본 익명 설정 */}
            <Box style={{ padding: 20 }}>
              <HStack className="justify-between items-center">
                <VStack className="flex-1" style={{ gap: 4 }}>
                  <HStack className="items-center" style={{ gap: 8 }}>
                    <MaterialCommunityIcons name="comment-text" size={20} color={theme.colors.primary} />
                    <Text
                      style={{
                        fontSize: FONT_SIZES.bodyLarge,
                        fontWeight: '600',
                        color: theme.colors.text.primary,
                        fontFamily: 'Pretendard-SemiBold'
                      }}
                    >
                      기본 익명 댓글
                    </Text>
                  </HStack>
                  <Text
                    style={{
                      fontSize: FONT_SIZES.caption,
                      color: theme.colors.text.secondary,
                      lineHeight: 18,
                      fontFamily: 'Pretendard-Medium'
                    }}
                  >
                    댓글 작성 시 기본적으로 익명으로 설정됩니다
                  </Text>
                </VStack>
                <Switch
                  value={defaultAnonymous}
                  onValueChange={setDefaultAnonymous}
                  disabled={alwaysAnonymous}
                  thumbColor={defaultAnonymous ? theme.colors.primary : theme.colors.border}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                />
              </HStack>
            </Box>

            <Divider style={{ backgroundColor: theme.colors.border }} />
            
            {/* 항상 익명 설정 */}
            <Box style={{ padding: 20 }}>
              <HStack className="justify-between items-center">
                <VStack className="flex-1" style={{ gap: 4 }}>
                  <HStack className="items-center" style={{ gap: 8 }}>
                    <MaterialCommunityIcons name="incognito" size={20} color={theme.colors.primary} />
                    <Text
                      style={{
                        fontSize: FONT_SIZES.bodyLarge,
                        fontWeight: '600',
                        color: theme.colors.text.primary,
                        fontFamily: 'Pretendard-SemiBold'
                      }}
                    >
                      항상 익명 댓글
                    </Text>
                  </HStack>
                  <Text
                    style={{
                      fontSize: FONT_SIZES.caption,
                      color: theme.colors.text.secondary,
                      lineHeight: 18,
                      fontFamily: 'Pretendard-Medium'
                    }}
                  >
                    모든 댓글이 강제로 익명으로 작성됩니다
                  </Text>
                </VStack>
                <Switch
                  value={alwaysAnonymous}
                  onValueChange={handleAlwaysAnonymousChange}
                  thumbColor={alwaysAnonymous ? theme.colors.primary : theme.colors.border}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                />
              </HStack>
            </Box>

            <Divider style={{ backgroundColor: theme.colors.border }} />

            {/* 답글에서도 익명 유지 */}
            <Box style={{ padding: 20 }}>
              <HStack className="justify-between items-center">
                <VStack className="flex-1" style={{ gap: 4 }}>
                  <HStack className="items-center" style={{ gap: 8 }}>
                    <MaterialCommunityIcons name="reply" size={20} color={theme.colors.primary} />
                    <Text
                      style={{
                        fontSize: FONT_SIZES.bodyLarge,
                        fontWeight: '600',
                        color: theme.colors.text.primary,
                        fontFamily: 'Pretendard-SemiBold'
                      }}
                    >
                      답글에서도 익명 유지
                    </Text>
                  </HStack>
                  <Text
                    style={{
                      fontSize: FONT_SIZES.caption,
                      color: theme.colors.text.secondary,
                      lineHeight: 18,
                      fontFamily: 'Pretendard-Medium'
                    }}
                  >
                    답글 작성 시에도 익명 설정을 유지합니다
                  </Text>
                </VStack>
                <Switch
                  value={anonymousInReplies}
                  onValueChange={setAnonymousInReplies}
                  thumbColor={anonymousInReplies ? theme.colors.primary : theme.colors.border}
                  trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                />
              </HStack>
            </Box>
          </Surface>

          {/* 저장 버튼 */}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isLoading}
            disabled={isLoading}
            style={{
              borderRadius: 12,
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.5 : 0.3,
              shadowRadius: 8,
              elevation: 6
            }}
            contentStyle={{
              paddingVertical: 12
            }}
            labelStyle={{
              fontSize: FONT_SIZES.bodyLarge,
              fontWeight: '700',
              color: isDark ? theme.colors.text.primary : theme.colors.background,
              fontFamily: 'Pretendard-Bold'
            }}
          >
            설정 저장
          </Button>
        </Box>
      </ScrollView>
    </Box>
  );
};

export default AnonymousSettingsScreen;