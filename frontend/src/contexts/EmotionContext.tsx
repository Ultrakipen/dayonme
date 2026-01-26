// src/contexts/EmotionContext.tsx
import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import emotionService, { Emotion } from '../services/api/emotionService';

// EmotionLog 타입 정의
interface EmotionLog {
  log_id: number;
  user_id: number;
  emotion_id: number;
  note?: string;
  log_date: string;
  created_at: string;
  updated_at: string;
  emotion?: Emotion;
}

interface EmotionContextType {
  emotions: Emotion[];
  userEmotions: EmotionLog[];
  selectedEmotions: number[];
  isLoading: boolean;
  error: string | null;
  fetchEmotions: () => Promise<void>;
  fetchUserEmotions: () => Promise<void>;
  logEmotion: (emotionId: number, note?: string) => Promise<void>;
  selectEmotion: (emotionId: number) => void;
  unselectEmotion: (emotionId: number) => void;
  clearSelectedEmotions: () => void;
}

const EmotionContext = createContext<EmotionContextType | undefined>(undefined);

export const useEmotion = () => {
  const context = useContext(EmotionContext);
  if (context === undefined) {
    throw new Error('useEmotion must be used within an EmotionProvider');
  }
  return context;
};

interface EmotionProviderProps {
  children: ReactNode;
}

export const EmotionProvider: React.FC<EmotionProviderProps> = ({ children }) => {
  const [emotions, setEmotions] = useState<Emotion[]>([]);
  const [userEmotions, setUserEmotions] = useState<EmotionLog[]>([]);
  const [selectedEmotions, setSelectedEmotions] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 중복 호출 방지를 위한 ref
  const isFetchingRef = useRef<boolean>(false);
  const hasInitializedRef = useRef<boolean>(false);

  // 감정 목록 조회 (백엔드 /api/emotions)
  const fetchEmotions = async () => {
    // 이미 조회 중이거나 초기화 완료된 경우 스킵
    if (isFetchingRef.current || hasInitializedRef.current) {
      if (__DEV__) console.log('⏭️ 감정 목록 조회 스킵 (이미 진행 중 또는 완료)');
      return;
    }

    isFetchingRef.current = true;
    try {
      setIsLoading(true);
      setError(null);
      if (__DEV__) console.log('🔄 감정 목록 조회 시작');
      
      const response = await emotionService.getAllEmotions();
      
      // 백엔드 응답 구조에 맞춰 데이터 추출
      if (response.data && response.data.status === 'success') {
        setEmotions(response.data.data);
        if (__DEV__) console.log(`✅ 감정 목록 조회 성공: ${response.data.data.length}개`);
      } else {
        throw new Error('감정 목록 조회 실패');
      }
    } catch (err: unknown) {
      const errorMessage = err.message || '감정 목록을 불러오는데 실패했습니다.';
      setError(errorMessage);
      if (__DEV__) console.error('❌ 감정 목록 불러오기 오류:', err);
      
      // 기본 감정 데이터로 fallback
      setEmotions([
        { emotion_id: 1, name: '행복', icon: 'emoticon-happy-outline', color: '#FFD700' },
        { emotion_id: 2, name: '감사', icon: 'hand-heart', color: '#FF69B4' },
        { emotion_id: 3, name: '위로', icon: 'hand-peace', color: '#87CEEB' },
        { emotion_id: 4, name: '감동', icon: 'heart-outline', color: '#FF6347' },
        { emotion_id: 5, name: '슬픔', icon: 'emoticon-sad-outline', color: '#4682B4' },
        { emotion_id: 6, name: '불안', icon: 'alert-outline', color: '#DDA0DD' },
        { emotion_id: 7, name: '화남', icon: 'emoticon-angry-outline', color: '#FF4500' },
        { emotion_id: 8, name: '지침', icon: 'emoticon-neutral-outline', color: '#A9A9A9' },
        { emotion_id: 9, name: '우울', icon: 'weather-cloudy', color: '#708090' },
        { emotion_id: 10, name: '고독', icon: 'account-outline', color: '#8B4513' },
        { emotion_id: 11, name: '충격', icon: 'lightning-bolt', color: '#9932CC' },
        { emotion_id: 12, name: '편함', icon: 'sofa-outline', color: '#32CD32' }
      ]);
      if (__DEV__) console.log('⚠️ 기본 감정 데이터로 설정됨');
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
      hasInitializedRef.current = true;
    }
  };

// 사용자 감정 기록 조회 - 수정된 버전
const fetchUserEmotions = async () => {
  try {
    setIsLoading(true);
    setError(null);
    if (__DEV__) console.log('🔄 사용자 감정 기록 조회 시작');
    
    // 현재 백엔드에 /emotions/logs 엔드포인트가 없으므로 
    // 임시로 빈 배열로 설정하거나 다른 API 사용
    setUserEmotions([]);
    if (__DEV__) console.log(`✅ 사용자 감정 기록 조회 완료 (임시)`);
    
    // 대안: 일일 감정 체크 API 사용 (존재하는 경우)
    // const response = await emotionService.getDailyEmotionCheck();
    // if (response.data && response.data.status === 'success') {
    //   setUserEmotions(response.data.data || []);
    // }
    
  } catch (err: unknown) {
    const errorMessage = err.message || '사용자 감정 기록을 불러오는데 실패했습니다.';
    setError(errorMessage);
    if (__DEV__) console.error('❌ 사용자 감정 기록 불러오기 오류:', err);
    setUserEmotions([]);
  } finally {
    setIsLoading(false);
  }
};

// 감정 기록 (백엔드 /api/emotions) - 성공 조건 수정
const logEmotion = async (emotionId: number, note?: string) => {
  try {
    setIsLoading(true);
    setError(null);
    if (__DEV__) console.log('🔄 감정 기록 시작:', { emotionId, note });
    
    const response = await emotionService.recordEmotions({
      emotion_ids: [emotionId],
      note: note
    });
    
    // HTTP 상태코드가 2xx이면 성공으로 처리
    if (response.status === 200 || response.status === 201) {
      if (__DEV__) console.log('✅ 감정 기록 성공');
      // 기록 후 사용자 감정 목록 새로고침
      await fetchUserEmotions();
      return; // 성공 시 함수 종료
    }
    
    // status 필드 체크 (백업)
    if (response.data && response.data.status === 'success') {
      if (__DEV__) console.log('✅ 감정 기록 성공');
      await fetchUserEmotions();
      return;
    }
    
    // 여기까지 오면 예상치 못한 응답
    throw new Error('예상치 못한 서버 응답입니다.');
    
  } catch (err: unknown) {
    const errorMessage = err.message || '감정 기록에 실패했습니다.';
    setError(errorMessage);
    if (__DEV__) console.error('❌ 감정 기록 오류:', err);
    throw err;
  } finally {
    setIsLoading(false);
  }
};
// 감정 선택 (추가할 부분)
const selectEmotion = (emotionId: number) => {
  if (!selectedEmotions.includes(emotionId)) {
    setSelectedEmotions([...selectedEmotions, emotionId]);
    if (__DEV__) console.log('✅ 감정 선택:', emotionId);
  }
};

// 감정 선택 해제 (기존)
const unselectEmotion = (emotionId: number) => {
  setSelectedEmotions(selectedEmotions.filter(id => id !== emotionId));
  if (__DEV__) console.log('❌ 감정 선택 해제:', emotionId);
};

  // 선택된 감정 모두 해제
  const clearSelectedEmotions = () => {
    setSelectedEmotions([]);
    if (__DEV__) console.log('🧹 선택된 감정 모두 해제');
  };

  // 컴포넌트 마운트 시 감정 목록 로드
  useEffect(() => {
    fetchEmotions();
  }, []);

  return (
    <EmotionContext.Provider
      value={{
        emotions,
        userEmotions,
        selectedEmotions,
        isLoading,
        error,
        fetchEmotions,
        fetchUserEmotions,
        logEmotion,
        selectEmotion,
        unselectEmotion,
        clearSelectedEmotions,
      }}
    >
      {children}
    </EmotionContext.Provider>
  );
};