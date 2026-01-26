// src/utils/anonymousNickname.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AnonymousPersona {
  name: string;
  icon: string;
  color: string;
}

export interface AnonymousUser {
  postId: number;
  userId: number | string;  // commentId 포함 시 "userId_commentId" 형태
  anonymousNickname: string;  // "기쁨이_01"
  anonymousIcon: string;      // "😊"
  anonymousColor: string;     // "#10b981"
  assignedAt: string;         // 할당 시간
}

export interface AnonymousMapping {
  [postId: number]: {
    [userId: string]: AnonymousUser  // string으로 변경 (number 또는 "userId_commentId" 형태)
  }
}

// 익명 페르소나 풀 - 친근한 Inside Out 스타일 17개 감정들
export const ANONYMOUS_PERSONAS: AnonymousPersona[] = [
  { name: "기쁨이", icon: "😊", color: "#FFD700" },
  { name: "행복이", icon: "😄", color: "#FFA500" },
  { name: "슬픔이", icon: "😢", color: "#4682B4" },
  { name: "우울이", icon: "😞", color: "#708090" },
  { name: "지루미", icon: "😑", color: "#A9A9A9" },
  { name: "버럭이", icon: "😠", color: "#FF4500" },
  { name: "불안이", icon: "😰", color: "#DDA0DD" },
  { name: "걱정이", icon: "😟", color: "#FFA07A" },
  { name: "감동이", icon: "🥺", color: "#FF6347" },
  { name: "황당이", icon: "🤨", color: "#20B2AA" },
  { name: "당황이", icon: "😲", color: "#FF8C00" },
  { name: "짜증이", icon: "😤", color: "#DC143C" },
  { name: "무섭이", icon: "😨", color: "#9370DB" },
  { name: "추억이", icon: "🥹", color: "#87CEEB" },
  { name: "설렘이", icon: "🤗", color: "#FF69B4" },
  { name: "편안이", icon: "😌", color: "#98FB98" },
  { name: "궁금이", icon: "🤔", color: "#DAA520" }
];

const STORAGE_KEY = 'anonymous_mappings';

class AnonymousNicknameManager {
  private mappings: AnonymousMapping = {};
  private initialized = false;

  // 로컬 저장소에서 매핑 정보 로드
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        this.mappings = JSON.parse(storedData);
        if (__DEV__) console.log('🎭 익명 매핑 정보 로드 완료:', Object.keys(this.mappings).length, '개 게시물');
      }
    } catch (error) {
      if (__DEV__) console.error('❌ 익명 매핑 정보 로드 실패:', error);
      this.mappings = {};
    }
    
    this.initialized = true;
  }

  // 매핑 정보를 로컬 저장소에 저장
  private async saveMappings(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.mappings));
      if (__DEV__) console.log('💾 익명 매핑 정보 저장 완료');
    } catch (error) {
      if (__DEV__) console.error('❌ 익명 매핑 정보 저장 실패:', error);
    }
  }

  // 사용자의 익명 정보 조회 또는 생성 (commentId 포함하여 매번 다른 익명 정보 생성)
  async getOrCreateAnonymousUser(postId: number, userId: number, commentId?: number): Promise<AnonymousUser> {
    await this.initialize();

    // commentId가 있으면 매번 새로운 익명 정보 생성 (댓글마다 다른 아바타/닉네임)
    if (commentId !== undefined) {
      const uniqueKey = `${userId}_${commentId}`;
      if (this.mappings[postId]?.[uniqueKey]) {
        const existing = this.mappings[postId][uniqueKey];
        if (__DEV__) console.log(`🎭 기존 익명 사용자 조회: ${existing.anonymousNickname} (게시물 ${postId}, 댓글 ${commentId})`);
        return existing;
      }

      const anonymousUser = await this.createAnonymousUser(postId, uniqueKey);
      if (__DEV__) console.log(`🎭 새 익명 사용자 생성: ${anonymousUser.anonymousNickname} (게시물 ${postId}, 댓글 ${commentId})`);
      return anonymousUser;
    }

    // 기존 로직 유지 (commentId 없으면 사용자당 하나의 익명 정보)
    if (this.mappings[postId]?.[userId]) {
      const existing = this.mappings[postId][userId];
      if (__DEV__) console.log(`🎭 기존 익명 사용자 조회: ${existing.anonymousNickname} (게시물 ${postId})`);
      return existing;
    }

    const anonymousUser = await this.createAnonymousUser(postId, String(userId));
    if (__DEV__) console.log(`🎭 새 익명 사용자 생성: ${anonymousUser.anonymousNickname} (게시물 ${postId})`);

    return anonymousUser;
  }

  // 새로운 익명 사용자 생성
  private async createAnonymousUser(postId: number, userId: number | string): Promise<AnonymousUser> {
    // 해당 게시물에서 이미 사용된 닉네임들 수집
    const postMappings = this.mappings[postId] || {};
    const usedNicknames = new Set(
      Object.values(postMappings).map(user => user.anonymousNickname)
    );

    // 사용 가능한 닉네임 찾기
    let selectedPersona: AnonymousPersona;
    let finalNickname: string;
    let attempts = 0;
    const maxAttempts = 100; // 무한 루프 방지

    do {
      // 랜덤하게 페르소나 선택
      const randomIndex = Math.floor(Math.random() * ANONYMOUS_PERSONAS.length);
      selectedPersona = ANONYMOUS_PERSONAS[randomIndex];
      
      // 중복 확인 및 번호 추가
      let counter = 0;
      let testNickname = selectedPersona.name;
      
      while (usedNicknames.has(testNickname)) {
        counter++;
        testNickname = `${selectedPersona.name}_${counter.toString().padStart(2, '0')}`;
        
        // 너무 많은 중복 방지 (한 닉네임당 최대 99개)
        if (counter >= 99) break;
      }
      
      finalNickname = testNickname;
      attempts++;
      
    } while (usedNicknames.has(finalNickname) && attempts < maxAttempts);

    // 매핑 정보에 추가
    if (!this.mappings[postId]) {
      this.mappings[postId] = {};
    }

    const anonymousUser: AnonymousUser = {
      postId,
      userId,
      anonymousNickname: finalNickname,
      anonymousIcon: selectedPersona.icon,
      anonymousColor: selectedPersona.color,
      assignedAt: new Date().toISOString()
    };

    this.mappings[postId][userId] = anonymousUser;
    
    // 로컬 저장소에 저장
    await this.saveMappings();

    return anonymousUser;
  }

  // 특정 게시물의 모든 익명 사용자 조회
  async getPostAnonymousUsers(postId: number): Promise<{ [userId: string]: AnonymousUser }> {
    await this.initialize();
    return this.mappings[postId] || {};
  }

  // 매핑 정보 초기화 (개발/테스트용)
  async clearAllMappings(): Promise<void> {
    this.mappings = {};
    await AsyncStorage.removeItem(STORAGE_KEY);
    if (__DEV__) console.log('🗑️ 모든 익명 매핑 정보 삭제 완료');
  }

  // 특정 게시물의 매핑 정보 삭제
  async clearPostMappings(postId: number): Promise<void> {
    await this.initialize();
    delete this.mappings[postId];
    await this.saveMappings();
    if (__DEV__) console.log(`🗑️ 게시물 ${postId}의 익명 매핑 정보 삭제 완료`);
  }

  // 통계 정보 조회
  async getStats(): Promise<{ totalPosts: number; totalUsers: number }> {
    await this.initialize();
    
    const totalPosts = Object.keys(this.mappings).length;
    const totalUsers = Object.values(this.mappings)
      .reduce((sum, postMapping) => sum + Object.keys(postMapping).length, 0);
    
    return { totalPosts, totalUsers };
  }
}

// 싱글톤 인스턴스 생성
export const anonymousManager = new AnonymousNicknameManager();

// 헬퍼 함수들
export const getAnonymousDisplayName = (anonymousUser: AnonymousUser, isMyComment: boolean): string => {
  return isMyComment ? `${anonymousUser.anonymousNickname}` : anonymousUser.anonymousNickname;
};

export const getAnonymousAvatarStyle = (anonymousUser: AnonymousUser, isMyComment: boolean) => ({
  backgroundColor: anonymousUser.anonymousColor,
  shadowColor: anonymousUser.anonymousColor,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 4,
  ...(isMyComment && {
    borderWidth: 2,
    borderColor: '#22c55e'
  })
});

export const getAnonymousBadgeStyle = (anonymousUser: AnonymousUser) => ({
  backgroundColor: `${anonymousUser.anonymousColor}20`,
  borderColor: `${anonymousUser.anonymousColor}80`,
  borderWidth: 1
});

export default AnonymousNicknameManager;