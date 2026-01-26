import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { scaleFontSize, scaleSpacing } from '../../styles/ReviewScreen.styles';
import { useModernTheme } from '../../contexts/ModernThemeContext';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: number;
  icon?: string;
}

const Collapsible: React.FC<CollapsibleProps> = ({
  title,
  children,
  defaultExpanded = false,
  badge,
  icon
}) => {
  const { colors, isDark } = useModernTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotateAnim = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;

  const toggleExpand = () => {
    setExpanded(!expanded);

    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: true
    }).start();
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg']
  });

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: scaleSpacing(16),
      marginHorizontal: scaleSpacing(12),
      marginVertical: scaleSpacing(6),
      overflow: 'hidden',
      elevation: 3,
      shadowColor: isDark ? '#FFFFFF' : '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.15 : 0.1,
      shadowRadius: 8,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? colors.border : 'transparent'
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: scaleSpacing(16),
      backgroundColor: colors.surface
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1
    },
    iconContainer: {
      width: scaleSpacing(32),
      height: scaleSpacing(32),
      borderRadius: scaleSpacing(16),
      backgroundColor: isDark ? 'rgba(102, 126, 234, 0.2)' : '#E8EAFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: scaleSpacing(12)
    },
    title: {
      fontSize: scaleFontSize(17),
      fontFamily: 'Pretendard-Bold',
      color: isDark ? '#FFFFFF' : colors.text,
      flex: 1
    },
    badge: {
      backgroundColor: '#667eea',
      borderRadius: scaleSpacing(12),
      paddingHorizontal: scaleSpacing(8),
      paddingVertical: scaleSpacing(4),
      marginLeft: scaleSpacing(8),
      minWidth: scaleSpacing(24),
      alignItems: 'center'
    },
    badgeText: {
      fontSize: scaleFontSize(13),
      fontFamily: 'Pretendard-Bold',
      color: '#FFFFFF'
    },
    content: {
      padding: scaleSpacing(12)
    }
  }), [colors, isDark]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {icon && (
            <View style={styles.iconContainer}>
              <Icon name={icon} size={scaleFontSize(20)} color="#667eea" />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>

        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Icon name="chevron-down" size={scaleFontSize(20)} color={colors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>

      {expanded && <View style={styles.content}>{children}</View>}
    </View>
  );
};

export default Collapsible;
