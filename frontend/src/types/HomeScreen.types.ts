import { type Comment as ApiComment } from '../services/api/postService';
import { AnonymousUser } from '../utils/anonymousNickname';
import { StyleProp, ViewStyle } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

export type LocalEmotion = {
    label: string;
    icon: string;
    color: string;
};

export type ExtendedComment = ApiComment & {
    anonymousUser?: AnonymousUser;
    parent_comment_id?: number | null;
    replies?: ExtendedComment[];
};

export type DisplayPost = {
    post_id: number;
    authorName: string;
    content: string;
    emotions: Array<{
        emotion_id: number;
        name: string;
        icon: string;
        color: string;
    }>;
    image_url?: string;
    images?: string[];
    like_count: number;
    comment_count: number;
    created_at: string;
    updated_at: string;
    is_anonymous: boolean;
    user_id: number;
    isLiked: boolean;
    comments: ExtendedComment[];
    anonymousUsers?: { [userId: number]: AnonymousUser };
};

export interface AvatarProps {
    size?: number;
    style?: StyleProp<ViewStyle>;
}

// 차단 관련 타입
export interface BlockedContent {
    content_type: 'post' | 'comment';
    content_id: number;
    blocked_at?: string;
}

export interface BlockedUser {
    blocked_id: number;
    blocked_at?: string;
}

// 네비게이션 타입 (기본 정의)
export type RootStackParamList = {
    Home: undefined;
    Auth: undefined;
    PostDetail: { postId: number; postType?: string; sourceScreen?: string; enableSwipe?: boolean };
    NotificationScreen: undefined;
    Profile: { userId?: number };
    WriteMyDay: { mode?: string; postId?: number };
    [key: string]: undefined | object;
};

export interface HomeScreenProps {
    navigation?: NativeStackNavigationProp<RootStackParamList, 'Home'>;
    route?: RouteProp<RootStackParamList, 'Home'>;
}
