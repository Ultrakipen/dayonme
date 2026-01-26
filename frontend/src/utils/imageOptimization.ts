// 이미지 최적화 유틸
import { normalizeImageUrl, toWebPUrl } from './imageUtils';
import FastImage from 'react-native-fast-image';

// 네트워크 품질 레벨 저장 (동적으로 업데이트 가능)
let currentNetworkQuality: 'high' | 'medium' | 'low' = 'medium';

/**
 * 네트워크 품질 레벨 설정
 */
export const setNetworkQuality = (quality: 'high' | 'medium' | 'low') => {
    currentNetworkQuality = quality;
};

/**
 * 현재 네트워크 품질 레벨 가져오기
 */
export const getNetworkQuality = () => currentNetworkQuality;

export const getOptimizedImageUrl = (url: string, width = 400, quality = 80) => {
    if (!url) return url;

    // 먼저 상대 경로를 절대 URL로 변환
    const normalizedUrl = normalizeImageUrl(url);
    if (!normalizedUrl) return url;

    // 네트워크 품질에 따라 이미지 크기 조정
    const adjustedWidth = (() => {
        switch (currentNetworkQuality) {
            case 'high':
                return width;
            case 'medium':
                return Math.floor(width * 0.8);
            case 'low':
                return Math.floor(width * 0.6);
            default:
                return width;
        }
    })();

    // 서버 업로드 이미지인 경우 서버 API 사용
    if (normalizedUrl.includes('/uploads/')) {
        // /api/uploads/images/xxx.jpg -> /api/images/images/xxx.jpg?w=300&q=80
        const parts = normalizedUrl.split('/uploads/');
        if (parts.length === 2) {
            const [folder, ...rest] = parts[1].split('/');
            const filename = rest.join('/');

            // base URL에서 /api가 이미 있으면 제거
            let base = parts[0];
            if (base.endsWith('/api')) {
                base = base.slice(0, -4);
            }

            // 서버 리사이징 API 사용 (이미 WebP 변환 포함)
            return `${base}/api/images/${folder}/${filename}?w=${adjustedWidth}&q=${quality}`;
        }
    }

    // WebP 변환 시도 (외부 이미지 또는 서버 API 미사용 시)
    const webpUrl = toWebPUrl(normalizedUrl);
    return webpUrl;
};

// 이미지 크기 정의 (모바일 최적화)
export const IMAGE_SIZES = {
    thumbnail: 150,   // 작은 썸네일 (리스트 아이콘 등)
    card: 300,        // 카드 뷰 (목록 화면) - 400에서 300으로 축소
    detail: 600,      // 상세 화면 - 800에서 600으로 축소
    full: 1080        // 전체 화면 - 1200에서 1080으로 축소 (FHD+ 기준)
};

// 이미지 우선순위 결정
const getImagePriority = (
    size: keyof typeof IMAGE_SIZES,
    index: number = 0
): typeof FastImage.priority[keyof typeof FastImage.priority] => {
    // 첫 번째 이미지이고 카드/썸네일인 경우 높은 우선순위
    if (index === 0 && (size === 'card' || size === 'thumbnail')) {
        return FastImage.priority.high;
    }

    // 상세/전체 크기는 중간 우선순위
    if (size === 'detail' || size === 'full') {
        return FastImage.priority.normal;
    }

    // 나머지는 낮은 우선순위
    return FastImage.priority.low;
};

// FastImage용 이미지 속성 생성
export const getImageProps = (
    uri: string,
    size: keyof typeof IMAGE_SIZES = 'card',
    index: number = 0
) => {
    const optimizedUrl = getOptimizedImageUrl(uri, IMAGE_SIZES[size]);

    return {
        uri: optimizedUrl,
        priority: getImagePriority(size, index),
        cache: FastImage.cacheControl.immutable, // 캐시 안정화
    };
};

// 이미지 프리로드 (스크롤 시 다음 이미지 미리 로드)
export const preloadImages = (urls: string[], size: keyof typeof IMAGE_SIZES = 'card') => {
    if (!urls || urls.length === 0) return;

    const preloadList = urls
        .filter(url => url && url.trim())
        .map(url => ({
            uri: getOptimizedImageUrl(url, IMAGE_SIZES[size]),
            priority: FastImage.priority.low, // 프리로드는 낮은 우선순위
        }));

    if (preloadList.length > 0) {
        FastImage.preload(preloadList);
    }
};
