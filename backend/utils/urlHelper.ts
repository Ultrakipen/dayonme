// utils/urlHelper.ts

import { config } from '../config/environment';

/**
 * 이미지 URL을 완전한 서버 URL로 변환
 * @param imageUrl 이미지 URL (상대 경로 또는 완전한 URL)
 * @param serverPort 서버 포트 (기본값: 3001)
 * @returns 완전한 이미지 URL
 */
export function normalizeImageUrl(imageUrl: string | null | undefined, serverPort: number = 3001): string | null {
  if (!imageUrl) {
    return null;
  }

  // 이미 완전한 URL인 경우 그대로 반환
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // 상대 경로인 경우 서버 URL을 앞에 붙임
  if (imageUrl.startsWith('/api/uploads/')) {
    return `http://10.0.2.2:${serverPort}${imageUrl}`;
  }

  // 그 외의 경우 null 반환
  return null;
}

/**
 * 게시물 데이터의 이미지 URL을 정규화
 * @param post 게시물 데이터
 * @param serverPort 서버 포트 (기본값: 3001)
 * @returns 정규화된 게시물 데이터
 */
export function normalizePostImageUrl<T extends { image_url?: string | null }>(post: T, serverPort: number = 3001): T {
  return {
    ...post,
    image_url: normalizeImageUrl(post.image_url, serverPort)
  };
}

/**
 * 게시물 목록의 이미지 URL을 정규화
 * @param posts 게시물 목록
 * @param serverPort 서버 포트 (기본값: 3001)
 * @returns 정규화된 게시물 목록
 */
export function normalizePostsImageUrls<T extends { image_url?: string | null }>(posts: T[], serverPort: number = 3001): T[] {
  return posts.map(post => normalizePostImageUrl(post, serverPort));
}