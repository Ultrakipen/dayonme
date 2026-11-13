import { LocalEmotion } from '../types/HomeScreen.types';
import { EMOTION_AVATARS } from './emotions';

// DB/공통상수 순서와 일치
export const localEmotions: LocalEmotion[] = EMOTION_AVATARS.map(({ label, emoji, color }) => ({ label, icon: emoji, color }));
