import Clipboard from '@react-native-clipboard/clipboard';
import { Alert } from 'react-native';

export const shareUtils = {
  createDeepLink: (challengeId: number) => `dayonme://challenge/${challengeId}`,

  copyToClipboard: async (text: string) => {
    try {
      Clipboard.setString(text);
      Alert.alert('복사 완료', '링크가 클립보드에 복사되었습니다.');
    } catch (error) {
      Alert.alert('오류', '복사 중 오류가 발생했습니다.');
    }
  },

  getShareText: (challenge: any) =>
    `🎯 ${challenge.title}\n\n${challenge.description}\n\n👥 ${challenge.participant_count}명 참여 중\n#감정챌린지 #Dayonme\n\n${shareUtils.createDeepLink(challenge.challenge_id)}`
};
