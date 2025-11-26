// 이미지 최적화 유틸
export const getOptimizedImageUrl = (url: string, width = 400, quality = 80) => {
    if (!url) return url;
    if (url.includes('?')) return url;
    return `${url}?w=${width}&q=${quality}`;
};

export const IMAGE_SIZES = {
    thumbnail: 150,
    card: 400,
    detail: 800,
    full: 1200
};

export const getImageProps = (uri: string, size: keyof typeof IMAGE_SIZES = 'card') => ({
    uri: getOptimizedImageUrl(uri, IMAGE_SIZES[size]),
    cache: 'force-cache' as const,
    priority: 'normal' as const
});
