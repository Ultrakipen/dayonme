// src/components/WriteActionModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Vibration,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useModernTheme } from '../contexts/ModernThemeContext';
import { getScale } from '../utils/responsive';

interface WriteActionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMyDay: () => void;
  onSelectComfort: () => void;
}

export const WriteActionModal: React.FC<WriteActionModalProps> = ({
  visible,
  onClose,
  onSelectMyDay,
  onSelectComfort,
}) => {
  const { theme, isDark } = useModernTheme();
  const scale = getScale();

  const handleSelect = (action: 'myDay' | 'comfort') => {
    Vibration.vibrate(10);
    onClose();
    if (action === 'myDay') {
      onSelectMyDay();
    } else {
      onSelectComfort();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
      >
        <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text.primary }]}>
              어떤 글을 작성하시겠어요?
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons
                name="close"
                size={24 * scale}
                color={theme.text.secondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.optionButton,
              {
                backgroundColor: isDark ? 'rgba(124, 58, 237, 0.2)' : '#EDE9FE',
                borderColor: isDark ? 'rgba(124, 58, 237, 0.4)' : '#7C3AED',
              },
            ]}
            onPress={() => handleSelect('myDay')}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.emoji}>🌅</Text>
            </View>
            <View style={styles.optionContent}>
              <Text
                style={[
                  styles.optionTitle,
                  { color: isDark ? '#A78BFA' : '#7C3AED' },
                ]}
              >
                나의 하루
              </Text>
              <Text
                style={[styles.optionDescription, { color: theme.text.secondary }]}
              >
                오늘의 감정과 일상을 기록하세요
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24 * scale}
              color={isDark ? '#A78BFA' : '#7C3AED'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              {
                backgroundColor: isDark ? 'rgba(236, 72, 153, 0.2)' : '#FDF2F8',
                borderColor: isDark ? 'rgba(236, 72, 153, 0.4)' : '#EC4899',
              },
            ]}
            onPress={() => handleSelect('comfort')}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <Text style={styles.emoji}>🤗</Text>
            </View>
            <View style={styles.optionContent}>
              <Text
                style={[
                  styles.optionTitle,
                  { color: isDark ? '#F9A8D4' : '#EC4899' },
                ]}
              >
                위로와 공감
              </Text>
              <Text
                style={[styles.optionDescription, { color: theme.text.secondary }]}
              >
                다른 사람들과 위로를 나누세요
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24 * scale}
              color={isDark ? '#F9A8D4' : '#EC4899'}
            />
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
  },
  optionIcon: {
    marginRight: 12,
  },
  emoji: {
    fontSize: 32,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  optionDescription: {
    fontSize: 13,
    fontFamily: 'Pretendard-Medium',
  },
});
