import React from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const renderEmotionIcon = (iconName: string, color: string) => {
    try {
        return <MaterialCommunityIcons name={iconName} size={20} color={color} />;
    } catch (error) {
        return <MaterialCommunityIcons name="emoticon" size={20} color={color} />;
    }
};

export const formatTimeAgo = (dateString: string | undefined | null): string => {
    try {
        if (!dateString || typeof dateString !== 'string') {
            return '방금 전';
        }

        const now = new Date();
        const postDate = new Date(dateString);

        if (isNaN(postDate.getTime())) {
            return '방금 전';
        }

        const diffInMinutes = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return '방금 전';
        if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}시간 전`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}일 전`;

        return postDate.toLocaleDateString('ko-KR');
    } catch (error) {
        return '방금 전';
    }
};
