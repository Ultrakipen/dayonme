import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { normalize, normalizeIcon } from '../utils/responsive';
import { shareUtils } from '../utils/shareUtils';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  challenge: any;
}

const ShareModal: React.FC<ShareModalProps> = ({ visible, onClose, challenge }) => {
  const handleCopyLink = async () => {
    const shareText = shareUtils.getShareText(challenge);
    await shareUtils.copyToClipboard(shareText);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>공유하기</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={normalizeIcon(24)} color="#333" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.option} onPress={handleCopyLink}>
            <Icon name="link" size={normalizeIcon(22)} color="#667EEA" />
            <Text style={styles.optionText}>링크 복사</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 14, fontWeight: '700' },
  option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  optionText: { fontSize: 13, fontWeight: '500', marginLeft: 12 }
});

export default ShareModal;
