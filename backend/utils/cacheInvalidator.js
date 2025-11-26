// 🔥 캐시 무효화 유틸리티
const cacheHelper = require('./cacheHelper');
const cacheConfig = require('../config/cache.config');

/**
 * 챌린지 관련 캐시 무효화
 */
const invalidateChallengeCache = async (challengeId = null) => {
  try {
    // 모든 챌린지 목록 캐시 삭제
    await cacheHelper.delPattern(cacheConfig.INVALIDATE_PATTERNS.CHALLENGES);

    // 특정 챌린지 상세 캐시 삭제
    if (challengeId) {
      await cacheHelper.del(cacheConfig.KEYS.CHALLENGE_DETAIL(challengeId));
    }

    console.log(`✅ 챌린지 캐시 무효화 완료 ${challengeId ? `(ID: ${challengeId})` : ''}`);
  } catch (error) {
    console.error('❌ 챌린지 캐시 무효화 실패:', error);
  }
};

/**
 * 사용자 관련 캐시 무효화
 */
const invalidateUserCache = async (userId) => {
  try {
    await cacheHelper.delPattern(cacheConfig.INVALIDATE_PATTERNS.USER(userId));
    console.log(`✅ 사용자 캐시 무효화 완료 (ID: ${userId})`);
  } catch (error) {
    console.error('❌ 사용자 캐시 무효화 실패:', error);
  }
};

/**
 * 게시물 관련 캐시 무효화
 */
const invalidatePostsCache = async () => {
  try {
    await cacheHelper.delPattern(cacheConfig.INVALIDATE_PATTERNS.POSTS);
    console.log('✅ 게시물 캐시 무효화 완료');
  } catch (error) {
    console.error('❌ 게시물 캐시 무효화 실패:', error);
  }
};

/**
 * 알림 관련 캐시 무효화
 */
const invalidateNotificationsCache = async (userId) => {
  try {
    await cacheHelper.delPattern(cacheConfig.INVALIDATE_PATTERNS.NOTIFICATIONS(userId));
    console.log(`✅ 알림 캐시 무효화 완료 (ID: ${userId})`);
  } catch (error) {
    console.error('❌ 알림 캐시 무효화 실패:', error);
  }
};

/**
 * 태그 인기순 캐시 무효화
 */
const invalidateTagsCache = async () => {
  try {
    await cacheHelper.delPattern('tags:*');
    console.log('✅ 태그 캐시 무효화 완료');
  } catch (error) {
    console.error('❌ 태그 캐시 무효화 실패:', error);
  }
};

module.exports = {
  invalidateChallengeCache,
  invalidateUserCache,
  invalidatePostsCache,
  invalidateNotificationsCache,
  invalidateTagsCache,
};
