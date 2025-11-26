import React from 'react';
import { Modal, View, Text as RNText, TouchableOpacity, Pressable } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

interface AchievementModalContent {
  title: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  maxProgress: number;
}

interface AchievementModalProps {
  visible: boolean;
  onClose: () => void;
  content: AchievementModalContent;
  styles: any;
}

const AchievementModal: React.FC<AchievementModalProps> = ({ visible, onClose, content, styles }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlayCenter} onPress={onClose}>
        <Pressable style={styles.achievementModalContainer} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={[content.color + '60', content.color + '20']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.achievementModalIconWrapper}
          >
            <MaterialCommunityIcons name={content.icon as any} size={64} color={content.color} />
          </LinearGradient>

          <RNText style={styles.achievementModalTitle}>{content.title}</RNText>

          <RNText style={styles.achievementModalDescription}>{content.description}</RNText>

          {content.maxProgress > 0 && (
            <View style={styles.achievementModalProgressSection}>
              <View style={styles.achievementModalProgressBar}>
                <View
                  style={[
                    styles.achievementModalProgressFill,
                    {
                      width: `${Math.min((content.progress / content.maxProgress) * 100, 100)}%`,
                      backgroundColor: content.color
                    }
                  ]}
                />
              </View>
              <RNText style={styles.achievementModalProgressText}>
                {content.progress} / {content.maxProgress}
              </RNText>
            </View>
          )}

          <TouchableOpacity
            style={[styles.achievementModalButton, { backgroundColor: content.color }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <RNText style={styles.achievementModalButtonText}>확인</RNText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AchievementModal;
