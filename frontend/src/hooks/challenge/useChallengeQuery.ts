import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import challengeService from '../../services/api/challengeService';

// 챌린지 목록 조회
export const useChallenges = (params: any = {}) => {
  return useQuery({
    queryKey: ['challenges', params],
    queryFn: () => challengeService.getChallenges(params),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000,
  });
};

// HOT 챌린지 조회
export const useHotChallenges = () => {
  return useQuery({
    queryKey: ['challenges', 'hot'],
    queryFn: () => challengeService.getChallenges({ weeklyHot: 'true', limit: 10 }),
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 15 * 60 * 1000,
  });
};

// 챌린지 상세 조회
export const useChallengeDetail = (challengeId: number) => {
  return useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => challengeService.getChallengeDetail(challengeId),
    staleTime: 3 * 60 * 1000, // 3분
    enabled: !!challengeId,
  });
};

// 챌린지 생성 Mutation
export const useCreateChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => challengeService.createChallenge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

// 챌린지 참여 Mutation
export const useJoinChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (challengeId: number) => challengeService.joinChallenge(challengeId),
    onSuccess: (_, challengeId) => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
    },
  });
};
