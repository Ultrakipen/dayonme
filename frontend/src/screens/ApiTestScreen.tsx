import React, { useState } from 'react';
import { Button, ScrollView } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useModernTheme } from '../contexts/ModernThemeContext';
import apiClient from '../services/api/client';
import { Box, Text, VStack, HStack } from '../components/ui';

const ApiTestScreen: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme, isDark } = useModernTheme();
  const [results, setResults] = useState<Array<{ title: string; result: string }>>([]);

  const addResult = (title: string, result: string) => {
    setResults(prev => [...prev, { title, result }]);
  };

  const testApi = async (title: string, apiCall: () => Promise<any>) => {
    try {
      const response = await apiCall();
      addResult(title, JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      addResult(title, `Error: ${error.message}`);
    }
  };

  // 테스트할 API 엔드포인트들
  const testEndpoints = [
    { title: '사용자 프로필 조회', call: () => apiClient.get('/api/users/profile') },
    { title: '감정 목록 조회', call: () => apiClient.get('/api/emotions') },
    { title: '내 게시물 조회', call: () => apiClient.get('/api/my-day/posts/me') },
    // 필요한 다른 엔드포인트 추가
  ];

  return (
    <Box
      className="flex-1 p-5"
      style={{ backgroundColor: theme.colors.background }}
    >
      <VStack className="space-y-4">
        <Text
          className="text-xl text-center my-2 font-semibold"
          style={{ color: theme.colors.text.primary }}
        >
          API Test Screen
        </Text>
        <Text style={{ color: theme.colors.text.primary }}>
          인증 상태: {isAuthenticated ? '로그인됨' : '로그아웃'}
        </Text>
        {user && (
          <Text style={{ color: theme.colors.text.primary }}>
            사용자: {user.username}
          </Text>
        )}

        <VStack className="my-4 space-y-2">
          {testEndpoints.map((endpoint, index) => (
            <Button
              key={index}
              title={endpoint.title}
              onPress={() => testApi(endpoint.title, endpoint.call)}
            />
          ))}
          <Button
            title="결과 초기화"
            onPress={() => setResults([])}
            color="#888"
          />
        </VStack>

        <ScrollView className="flex-1 mt-2">
          <VStack className="space-y-2">
            {results.map((item: any, index: number) => (
              <Box
                key={index}
                className="mb-2 p-2 rounded"
                style={{
                  backgroundColor: theme.colors.card,
                  shadowColor: isDark ? '#000' : '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              >
                <Text
                  className="font-bold mb-1"
                  style={{ color: theme.colors.text.primary }}
                >
                  {item.title}
                </Text>
                <Text
                  className="font-mono text-sm"
                  style={{ color: theme.colors.textSecondary }}
                >
                  {item.result}
                </Text>
              </Box>
            ))}
          </VStack>
        </ScrollView>
      </VStack>
    </Box>
  );
};


export default ApiTestScreen;