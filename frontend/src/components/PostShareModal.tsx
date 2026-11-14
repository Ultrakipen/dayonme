import React, { useRef, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EmotionIcon from './common/EmotionIcon';
import { useModernTheme } from '../hooks/useModernTheme';

const MAX_CHARS = 140;

interface Props {
  visible: boolean;
  content: string;
  emotionId?: number;
  onClose: () => void;
}

// 게시물 공유 카드: 닉네임/프로필 없이 감정 아이콘 + 본문 일부 + 앱 이름만 이미지로 만든다.
const PostShareModal: React.FC<Props> = ({ visible, content, emotionId, onClose }) => {
  const { colors } = useModernTheme();
  const insets = useSafeAreaInsets();
  const shotRef = useRef<ViewShot>(null);
  const [busy, setBusy] = useState(false);

  const text = (content || '').trim();
  const body = text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS)}...` : text;

  const handleShare = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await shotRef.current?.capture?.();
      if (!uri) throw new Error('capture failed');
      await Share.open({
        url: uri,
        type: 'image/png',
        message: 'Dayonme - 마음을 나누는 공간',
        failOnCancel: false,
      });
      onClose();
    } catch (e: any) {
      // 사용자가 공유창을 닫은 경우는 오류가 아님
      if (!String(e?.message || '').toLowerCase().includes('cancel')) {
        Alert.alert('오류', '공유 중 오류가 발생했습니다.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <ViewShot ref={shotRef} options={{ format: 'png', quality: 1, result: 'tmpfile' }}>
          <View style={[styles.card, { backgroundColor: colors.tint }]}>
            <View style={styles.iconWrap}>
              <EmotionIcon emotionId={emotionId} size={64} />
            </View>
            <Text style={[styles.body, { color: colors.text }]}>{body}</Text>
            <View style={styles.brandRow}>
              <Text style={[styles.brand, { color: colors.accentText }]}>Dayonme</Text>
              <Text style={[styles.brandSub, { color: colors.textSecondary }]}>마음을 나누는 공간</Text>
            </View>
          </View>
        </ViewShot>

        <View style={[styles.actions, { paddingBottom: 16 + insets.bottom }]}>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={handleShare}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="이미지로 공유"
          >
            <Text style={[styles.btnText, { color: colors.onAccent }]}>{busy ? '준비 중...' : '이미지로 공유'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.close} onPress={onClose} accessibilityRole="button" accessibilityLabel="닫기">
            <Text style={styles.closeText}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  card: { width: 300, borderRadius: 24, padding: 24, alignItems: 'center' },
  iconWrap: { marginBottom: 16 },
  body: { fontSize: 17, lineHeight: 26, textAlign: 'center', fontWeight: '600' },
  brandRow: { marginTop: 24, alignItems: 'center' },
  brand: { fontSize: 15, fontWeight: '700' },
  brandSub: { fontSize: 12, marginTop: 2 },
  actions: { width: '100%', alignItems: 'center', marginTop: 24 },
  btn: { minHeight: 48, paddingHorizontal: 28, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 16, fontWeight: '700' },
  close: { minHeight: 44, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  closeText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});

export default PostShareModal;
