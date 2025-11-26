import React from 'react';
import { Modal, View, Text as RNText, TouchableOpacity } from 'react-native';

interface InfoModalContent {
  title: string;
  message: string;
}

interface InfoModalProps {
  visible: boolean;
  onClose: () => void;
  content: InfoModalContent;
  styles: any;
}

const InfoModal: React.FC<InfoModalProps> = ({ visible, onClose, content, styles }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlayCenter}>
        <View style={styles.infoModalContainer}>
          <RNText style={styles.infoModalTitle}>{content.title}</RNText>
          <RNText style={styles.infoModalMessage}>{content.message}</RNText>
          <TouchableOpacity style={styles.infoModalButton} onPress={onClose} activeOpacity={0.7}>
            <RNText style={styles.infoModalButtonText}>확인</RNText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default InfoModal;
