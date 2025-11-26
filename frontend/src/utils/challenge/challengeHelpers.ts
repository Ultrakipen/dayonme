import { CHALLENGE_COLORS } from '../../constants/challenge';

export const getDday = (targetDate: string): string => {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'D-Day';
  if (days > 0) return `D-${days}`;
  return '종료';
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일전`;
  if (days < 30) return `${Math.floor(days / 7)}주전`;
  return date.toLocaleDateString();
};

export const getStatusColor = (status: 'active' | 'upcoming' | 'completed'): string => {
  switch (status) {
    case 'active': return CHALLENGE_COLORS.success;
    case 'upcoming': return CHALLENGE_COLORS.warning;
    case 'completed': return CHALLENGE_COLORS.textSecondary;
    default: return CHALLENGE_COLORS.textSecondary;
  }
};
