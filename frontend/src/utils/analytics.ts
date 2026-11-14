// utils/analytics.ts
// 애널리틱스 이벤트 추적
import logger from './logger';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

class Analytics {
  private enabled: boolean = !__DEV__; // 프로덕션에서만 활성화
  private events: AnalyticsEvent[] = [];

  /**
   * 이벤트 로깅
   */
  logEvent(name: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
    };

    this.events.push(event);

    if (__DEV__) {
      logger.log(`📊 [Analytics] ${name}`, properties);
    }

    // TODO: 실제 애널리틱스 서비스에 전송
    // - Firebase Analytics
    // - Amplitude
    // - Mixpanel
    // - Google Analytics
    // this.sendToAnalyticsService(event);
  }

  /**
   * 화면 조회 추적
   */
  logScreenView(screenName: string, properties?: Record<string, any>): void {
    this.logEvent('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * 사용자 속성 설정
   */
  setUserProperties(properties: Record<string, any>): void {
    if (__DEV__) {
      logger.log('👤 [Analytics] User Properties', properties);
    }

    // TODO: 실제 애널리틱스 서비스에 사용자 속성 설정
    // firebase.analytics().setUserProperties(properties);
  }

  /**
   * 사용자 ID 설정
   */
  setUserId(userId: string): void {
    if (__DEV__) {
      logger.log('👤 [Analytics] User ID', userId);
    }

    // TODO: 실제 애널리틱스 서비스에 사용자 ID 설정
    // firebase.analytics().setUserId(userId);
  }

  /**
   * 이벤트 기록 가져오기
   */
  getEvents(): AnalyticsEvent[] {
    return this.events;
  }

  /**
   * 이벤트 초기화
   */
  clear(): void {
    this.events = [];
  }

  /**
   * 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.log(`🔧 [Analytics] ${enabled ? '활성화' : '비활성화'}`);
  }
}

// 싱글톤 인스턴스
const analytics = new Analytics();

// ============================================
// PostDetail 관련 애널리틱스 이벤트
// ============================================

/**
 * 게시물 조회 이벤트
 */
export const logPostView = (postId: number, postType: string, source: string) => {
  analytics.logEvent('post_view', {
    post_id: postId,
    post_type: postType,
    source_screen: source,
  });
};

/**
 * 게시물 스와이프 이벤트
 */
export const logPostSwipe = (direction: 'up' | 'down', postId: number) => {
  analytics.logEvent('post_swipe', {
    direction,
    post_id: postId,
  });
};

/**
 * 게시물 좋아요 이벤트
 */
export const logPostLike = (postId: number, isLiked: boolean) => {
  analytics.logEvent('post_like', {
    post_id: postId,
    action: isLiked ? 'like' : 'unlike',
  });
};

/**
 * 댓글 작성 이벤트
 */
export const logCommentCreate = (postId: number, isAnonymous: boolean) => {
  analytics.logEvent('comment_create', {
    post_id: postId,
    is_anonymous: isAnonymous,
  });
};

/**
 * 게시물 공유 이벤트
 */
export const logPostShare = (postId: number, method: string) => {
  analytics.logEvent('post_share', {
    post_id: postId,
    method,
  });
};

/**
 * 게시물 북마크 이벤트
 */
export const logPostBookmark = (postId: number, isBookmarked: boolean) => {
  analytics.logEvent('post_bookmark', {
    post_id: postId,
    action: isBookmarked ? 'add' : 'remove',
  });
};

/**
 * 게시물 신고 이벤트
 */
export const logPostReport = (postId: number, reason: string) => {
  analytics.logEvent('post_report', {
    post_id: postId,
    reason,
  });
};

/**
 * 사용자 차단 이벤트
 */
export const logUserBlock = (userId: number, reason: string) => {
  analytics.logEvent('user_block', {
    blocked_user_id: userId,
    reason,
  });
};

/**
 * 게시물 로딩 시간 추적
 */
export const logPostLoadTime = (postId: number, duration: number) => {
  analytics.logEvent('post_load_time', {
    post_id: postId,
    duration_ms: duration,
  });
};

/**
 * API 에러 추적
 */
export const logApiError = (endpoint: string, statusCode: number, message: string) => {
  analytics.logEvent('api_error', {
    endpoint,
    status_code: statusCode,
    error_message: message,
  });
};

/**
 * 화면 진입 이벤트
 */
export const logScreenEnter = (screenName: string, params?: Record<string, any>) => {
  analytics.logScreenView(screenName, params);
};

/**
 * 사용자 로그인 이벤트
 */
export const logUserLogin = (method: string) => {
  analytics.logEvent('user_login', {
    method,
  });
};

/**
 * 사용자 로그아웃 이벤트
 */
export const logUserLogout = () => {
  analytics.logEvent('user_logout');
};

// ============================================
// 성능 지표 추적
// ============================================

/**
 * FPS 추적
 */
export const logFPS = (fps: number, screenName: string) => {
  analytics.logEvent('performance_fps', {
    fps,
    screen_name: screenName,
  });
};

/**
 * 메모리 사용량 추적
 */
export const logMemoryUsage = (usedMB: number, totalMB: number) => {
  analytics.logEvent('performance_memory', {
    used_mb: usedMB,
    total_mb: totalMB,
  });
};

/**
 * 네트워크 속도 추적
 */
export const logNetworkSpeed = (downloadSpeed: number, uploadSpeed: number) => {
  analytics.logEvent('performance_network', {
    download_speed: downloadSpeed,
    upload_speed: uploadSpeed,
  });
};

export default analytics;
