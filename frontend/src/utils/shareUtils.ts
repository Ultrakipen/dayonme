import Clipboard from '@react-native-clipboard/clipboard';
import { Alert } from 'react-native';

export const shareUtils = {
  // 주의: 앱이 이 주소를 열도록 하는 설정(링크 연결, 웹 페이지)이 아직 없어 공유 문구에는 넣지 않는다.
  createDeepLink: (challengeId: number) => `dayonme://challenge/${challengeId}`,

  copyToClipboard: async (text: string) => {
    try {
      Clipboard.setString(text);
      Alert.alert('복사 완료', '공유 문구가 클립보드에 복사되었습니다.');
    } catch (error) {
      Alert.alert('오류', '복사 중 오류가 발생했습니다.');
    }
  },

  getShareText: (challenge: any) =>
    `🎯 ${challenge.title}\n\n${challenge.description}\n\n👥 ${challenge.participant_count}명 참여 중\n#감정챌린지 #Dayonme`
};
