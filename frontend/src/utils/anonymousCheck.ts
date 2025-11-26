// src/utils/anonymousCheck.ts

export interface User {
  user_id?: number;
  nickname?: string;
  profile_image_url?: string;
  is_author?: boolean;
  is_active?: boolean;
}

export interface Post {
  post_id: number;
  user_id?: number;
  is_anonymous: boolean;
  user?: User | null;
}

export interface Comment {
  comment_id: number;
  user_id?: number;
  is_anonymous: boolean;
  user?: User | null;
}

// 익명 사용자 표시 정보
export const ANONYMOUS_USER = {
  nickname: '익명',
  profile_image_url: undefined,
  avatar_letter: '익',
} as const;

// 현재 사용자가 게시물/댓글의 작성자인지 확인
export function isCurrentUserAuthor(
  item: Post | Comment,
  currentUserId?: number
): boolean {
  if (!currentUserId) return false;
  
  // user_id가 직접 있는 경우
  if (item.user_id) {
    return item.user_id === currentUserId;
  }
  
  // user 객체 안에 있는 경우
  if (item.user?.user_id) {
    return item.user.user_id === currentUserId;
  }
  
  return false;
}

// 익명 게시물/댓글인지 확인
export function isAnonymous(item: Post | Comment): boolean {
  return item.is_anonymous || !item.user;
}

// 사용자 정보 표시용 데이터 생성
export function getUserDisplayInfo(
  item: Post | Comment,
  currentUserId?: number,
  showAuthorBadge: boolean = true
) {
  const isAuthor = isCurrentUserAuthor(item, currentUserId);
  const anonymous = isAnonymous(item);
  
  if (anonymous) {
    return {
      ...ANONYMOUS_USER,
      isAuthor,
      showAuthorBadge: showAuthorBadge && isAuthor,
      displayName: isAuthor ? '나 (익명)' : ANONYMOUS_USER.nickname,
    };
  }
  
  const user = item.user;
  return {
    nickname: user?.nickname || '사용자',
    profile_image_url: user?.profile_image_url,
    avatar_letter: user?.nickname?.[0] || '사',
    isAuthor,
    showAuthorBadge: showAuthorBadge && isAuthor,
    displayName: isAuthor ? '나' : user?.nickname || '사용자',
  };
}

// 아바타 표시용 문자 생성
export function getAvatarLetter(nickname?: string): string {
  if (!nickname) return ANONYMOUS_USER.avatar_letter;
  
  // 한글인 경우 첫 글자
  if (/[가-힣]/.test(nickname[0])) {
    return nickname[0];
  }
  
  // 영문인 경우 대문자로 변환
  if (/[a-zA-Z]/.test(nickname[0])) {
    return nickname[0].toUpperCase();
  }
  
  // 숫자나 특수문자인 경우
  return nickname[0];
}

// 게시물/댓글 권한 확인
export interface UserPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canReport: boolean;
  canLike: boolean;
  canComment: boolean;
  canShare: boolean;
}

export function getUserPermissions(
  item: Post | Comment,
  currentUserId?: number,
  currentUserRole?: 'user' | 'admin' | 'moderator'
): UserPermissions {
  const isAuthor = isCurrentUserAuthor(item, currentUserId);
  const isLoggedIn = !!currentUserId;
  const isAdmin = currentUserRole === 'admin';
  const isModerator = currentUserRole === 'moderator' || isAdmin;
  
  return {
    canEdit: isAuthor,
    canDelete: isAuthor || isModerator,
    canReport: isLoggedIn && !isAuthor,
    canLike: isLoggedIn,
    canComment: isLoggedIn,
    canShare: true, // 모든 사용자가 공유 가능
  };
}

// 사용자 차단 여부 확인 (실제로는 API에서 확인해야 함)
export function isUserBlocked(
  userId?: number,
  blockedUserIds: number[] = []
): boolean {
  if (!userId) return false;
  return blockedUserIds.includes(userId);
}

// 익명 설정 검증
export function validateAnonymousSettings(
  isAnonymous: boolean,
  userSettings?: {
    allowAnonymousPosts?: boolean;
    allowAnonymousComments?: boolean;
  }
): { isValid: boolean; message?: string } {
  if (!isAnonymous) {
    return { isValid: true };
  }
  
  // 사용자 설정에서 익명 게시를 허용하지 않는 경우
  if (userSettings && !userSettings.allowAnonymousPosts) {
    return {
      isValid: false,
      message: '익명 게시가 비활성화되어 있습니다. 설정에서 활성화해주세요.',
    };
  }
  
  return { isValid: true };
}

// 민감한 정보 마스킹 (익명화 처리)
export function maskSensitiveInfo(
  data: any,
  isAnonymous: boolean,
  fieldsToMask: string[] = ['user_id', 'email', 'phone']
): any {
  if (!isAnonymous) return data;
  
  const masked = { ...data };
  fieldsToMask.forEach(field => {
    if (masked[field]) {
      delete masked[field];
    }
  });
  
  return masked;
}

// 익명 게시물 통계 (개인정보 보호)
export function getAnonymousStats(posts: Post[]) {
  const totalPosts = posts.length;
  const anonymousPosts = posts.filter(post => post.is_anonymous).length;
  const identifiedPosts = totalPosts - anonymousPosts;
  
  return {
    total: totalPosts,
    anonymous: anonymousPosts,
    identified: identifiedPosts,
    anonymousPercentage: totalPosts > 0 ? Math.round((anonymousPosts / totalPosts) * 100) : 0,
  };
}

// 작성자 배지 설정
export interface AuthorBadgeConfig {
  showForAnonymous: boolean;
  showForIdentified: boolean;
  badgeText: string;
  badgeColor: string;
}

export function getAuthorBadgeConfig(
  isAnonymous: boolean,
  isAuthor: boolean
): AuthorBadgeConfig | null {
  if (!isAuthor) return null;
  
  return {
    showForAnonymous: true,
    showForIdentified: true,
    badgeText: '작성자',
    badgeColor: '#FF6B6B',
  };
}

// 사용자 프로필 이미지 URL 처리
export function getProfileImageUrl(
  user?: User | null,
  isAnonymous: boolean = false
): string | undefined {
  if (isAnonymous || !user?.profile_image_url) {
    return undefined;
  }
  
  return user.profile_image_url;
}

// 닉네임 표시 처리
export function getDisplayNickname(
  user?: User | null,
  isAnonymous: boolean = false,
  isCurrentUser: boolean = false
): string {
  if (isAnonymous) {
    return isCurrentUser ? '나 (익명)' : ANONYMOUS_USER.nickname;
  }
  
  if (isCurrentUser) {
    return '나';
  }
  
  return user?.nickname || '사용자';
}

// 개인정보 보호 레벨 확인
export enum PrivacyLevel {
  PUBLIC = 'public',
  FRIENDS = 'friends',
  PRIVATE = 'private',
  ANONYMOUS = 'anonymous',
}

export function getContentPrivacyLevel(
  isAnonymous: boolean,
  userPrivacySettings?: { profileVisibility?: PrivacyLevel }
): PrivacyLevel {
  if (isAnonymous) {
    return PrivacyLevel.ANONYMOUS;
  }
  
  return userPrivacySettings?.profileVisibility || PrivacyLevel.PUBLIC;
}