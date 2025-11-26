// src/components/BottomSheet.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS as DS_COLORS } from '../constants/designSystem';

interface BottomSheetAction {
  id: string;
  title: string;
  icon: string;
  color?: string;
  destructive?: boolean;
  onPress: () => void;
}

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions: BottomSheetAction[];
}
const COLORS = DS_COLORS;

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  subtitle,
  actions,
}) => {
  // useWindowDimensions 제거 - 현재 사용하지 않음
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          onPress={onClose}
          activeOpacity={1}
        />

        <View style={styles.bottomSheet}>
          {/* Handle Bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

        {/* Header - title이나 subtitle이 있을 때만 표시 */}
        {(title || subtitle) && (
          <View style={styles.header}>
            {title && (
              <Text style={styles.title}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={[
          styles.actionsContainer,
          !(title || subtitle) && styles.actionsContainerNoHeader
        ]}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionButton,
                {
                  borderBottomColor: 'rgba(255, 255, 255, 0.1)',
                  borderBottomWidth: index < actions.length - 1 ? 0.5 : 0,
                },
              ]}
              onPress={() => {
                action.onPress();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.actionContent}>
                <MaterialCommunityIcons
                  name={action.icon}
                  size={22}
                  color={
                    action.destructive
                      ? COLORS.danger
                      : action.color || '#FFF'
                  }
                  style={styles.actionIcon}
                />
                <Text
                  style={[
                    styles.actionText,
                    {
                      color: action.destructive ? COLORS.danger : '#FFFFFF',
                    },
                  ]}
                >
                  {action.title}
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={'rgba(255, 255, 255, 0.5)'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={[
            styles.cancelButton,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
            },
          ]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>
            취소
          </Text>
        </TouchableOpacity>

        {/* Safe Area Bottom Padding */}
        <View style={{ height: Platform.OS === 'ios' ? 34 : 20 }} />
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    backgroundColor: '#2A2A2A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsContainer: {
    paddingHorizontal: 20,
  },
  actionsContainerNoHeader: {
    paddingTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    minHeight: 60,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    marginRight: 12,
    width: 22,
    textAlign: 'center',
  },
  actionText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '500',
    letterSpacing: 0,
    flex: 1,
  },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});

export default BottomSheet;
