// src/screens/NaverLoginWebView.tsx - 네이버 로그인 WebView
import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Text } from '../components/ui';
import { useModernTheme } from '../contexts/ModernThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/api/apiClient';
import { showAlert } from '../contexts/AlertContext';
import { FONT_SIZES } from '../constants';

interface NaverLoginWebViewProps {
  navigation: {
    goBack: () => void;
  };
}

interface NaverAuthResponse {
  status: 'success' | 'error';
  message?: string;
  data?: {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
      nickname?: string;
      profileImage?: string;
    };
  };
}

const NaverLoginWebView: React.FC<NaverLoginWebViewProps> = ({ navigation }) => {
  const { theme, isDark } = useModernTheme();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false); // 중복 처리 방지

  // 네이버 OAuth 설정
  const NAVER_CLIENT_ID = 'sdlZLc5BdOEm6UuMuGnH';
  const NAVER_REDIRECT_URI = 'http://localhost:3001/auth/callback';
  const state = Math.random().toString(36).substring(7);

  const authUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(NAVER_REDIRECT_URI)}&state=${state}`;

  // WebView에서 주입할 스크립트 (URL 변경 감지)
  const injectedJavaScript = `
    (function() {
      // viewport 메타 태그 추가
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);

      // 스타일 조정
      document.body.style.fontSize = '16px';

      // URL 변경 감지 (redirect 감지)
      const checkUrl = () => {
        const currentUrl = window.location.href;
        if (currentUrl.includes('localhost:3001/auth/callback')) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'CALLBACK_URL',
            url: currentUrl
          }));
          // redirect 막기
          window.stop();
        }
      };

      // 주기적으로 URL 체크 (100ms마다)
      setInterval(checkUrl, 100);

      // 즉시 한 번 체크
      checkUrl();

      true;
    })();
  `;

  // 콜백 URL 처리 함수
  const handleCallbackUrl = async (url: string) => {
    // 이미 처리 중이면 무시
    if (isProcessing) {
      console.log('⏸️ 이미 처리 중입니다. 무시합니다.');
      return;
    }

    setIsProcessing(true);

    try {
      console.log('📥 콜백 URL 처리:', url);

      // URL에서 code와 state 추출
      const urlParams = new URL(url);
      const code = urlParams.searchParams.get('code');
      const returnedState = urlParams.searchParams.get('state');
      const error = urlParams.searchParams.get('error');

      // 사용자가 취소한 경우
      if (error === 'access_denied') {
        console.log('ℹ️ 사용자가 네이버 로그인을 취소했습니다.');
        navigation.goBack();
        return;
      }

      if (!code) {
        throw new Error('인증 코드를 받지 못했습니다.');
      }

      console.log('🔄 네이버 액세스 토큰 요청 중...');

      // code를 access_token으로 교환 (네이버 API 직접 호출)
      const NAVER_CLIENT_SECRET = 'TpnwOsEK61';
      const tokenResponse = await fetch(
        `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${NAVER_CLIENT_ID}&client_secret=${NAVER_CLIENT_SECRET}&code=${code}&state=${returnedState}`
      );

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        throw new Error('액세스 토큰을 받지 못했습니다.');
      }

      console.log('✅ 네이버 액세스 토큰 획득');

      // 백엔드로 액세스 토큰 전송하여 JWT 받기
      const response = await apiClient.post<NaverAuthResponse>('/auth/naver', {
        access_token: tokenData.access_token,
      });

      if (response.data.status === 'success' && response.data.data) {
        const { token, user } = response.data.data;

        // JWT 토큰과 사용자 정보 저장
        await AsyncStorage.multiSet([
          ['authToken', token],
          ['user', JSON.stringify(user)],
        ]);

        showAlert.success('로그인 성공', `${user.nickname || user.username}님 환영합니다!`);
        navigation.goBack();
      } else {
        throw new Error(response.data.message || '로그인에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('❌ 네이버 로그인 오류:', error);
      showAlert.error('로그인 실패', error.message || '로그인 중 오류가 발생했습니다.');
      navigation.goBack();
    }
  };

  // WebView에서 메시지 수신 (postMessage)
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'CALLBACK_URL') {
        console.log('📨 WebView로부터 콜백 URL 수신:', data.url);
        handleCallbackUrl(data.url);
      }
    } catch (error) {
      console.error('❌ 메시지 파싱 오류:', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? theme.bg.primary : '#fff' }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? theme.bg.primary : '#fff'} />

      {/* 헤더 */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: isDark ? theme.bg.card : '#fff',
        borderBottomWidth: 1,
        borderBottomColor: isDark ? theme.bg.border : '#e0e0e0',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            padding: 8,
            borderRadius: 12,
            backgroundColor: theme.bg.secondary,
          }}
        >
          <Text style={{ fontSize: FONT_SIZES.h3, fontWeight: '600', color: isDark ? theme.text.primary : '#333' }}>✕</Text>
        </TouchableOpacity>

        <Text style={{
          fontSize: FONT_SIZES.h4,
          fontWeight: '700',
          color: isDark ? theme.text.primary : '#333',
          letterSpacing: -0.3,
        }}>
          네이버 로그인
        </Text>

        <View style={{ width: 34 }} />
      </View>

      {/* WebView */}
      {!isProcessing && (
        <WebView
          source={{ uri: authUrl }}
          onMessage={handleMessage}
          originWhitelist={['*']}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          // 모바일 최적화 설정
          style={{ flex: 1 }}
          // User-Agent를 모바일로 설정
          userAgent="Mozilla/5.0 (Linux; Android 11; SM-G991N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
        />
      )}

      {/* 로딩 인디케이터 */}
      {loading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        }}>
          <ActivityIndicator size="large" color="#03C75A" />
          <Text style={{
            marginTop: 16,
            fontSize: FONT_SIZES.body,
            fontWeight: '600',
            color: isDark ? theme.text.secondary : '#666',
          }}>
            네이버 로그인 페이지 로딩 중...
          </Text>
        </View>
      )}
    </View>
  );
};

export default NaverLoginWebView;
