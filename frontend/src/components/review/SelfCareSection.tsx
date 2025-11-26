import React from 'react';
import { View, Text as RNText, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useModernTheme } from '../../contexts/ModernThemeContext';
import { PersonalizedMessage, DailyMission } from '../../types/ReviewScreen.types';
import { getEmotionColors } from '../../constants/reviewColors';
import createStylesFn, { scaleFontSize, scaleSpacing } from '../../styles/ReviewScreen.styles';

interface SelfCareSectionProps {
  selectedPeriod: 'week' | 'month' | 'year';
  personalizedMessages: PersonalizedMessage[];
  dailyMissions: DailyMission[];
  screenWidth: number;
  getSelfCareTitle: () => string;
}

const SelfCareSection: React.FC<SelfCareSectionProps> = ({
  selectedPeriod,
  personalizedMessages,
  dailyMissions,
  screenWidth,
  getSelfCareTitle
}) => {
  const { isDark, colors } = useModernTheme();
  const emotionColors = getEmotionColors(isDark);
  const styles = createStylesFn(isDark, colors);

  if (selectedPeriod === 'year') {
    return null;
  }

  const completedCount = dailyMissions.filter(m => m.completed).length;
  const hasMessages = personalizedMessages.length > 0;
  const hasMissions = dailyMissions.length > 0;

  if (!hasMessages && !hasMissions) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Icon name="heart-circle" size={26} color={emotionColors.primary} />
        <RNText style={styles.sectionTitle}>{getSelfCareTitle()}</RNText>
        {hasMissions && (
          <View style={styles.missionBadge}>
            <RNText style={styles.missionBadgeText}>{completedCount}/{dailyMissions.length}</RNText>
          </View>
        )}
      </View>

      {hasMessages && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: 0, paddingHorizontal: 0, marginBottom: hasMissions ? scaleSpacing(16) : 0 }}
        >
          {personalizedMessages.map((msg, index) => (
            <View
              key={index + "-msg-" + msg.icon}
              style={[
                styles.messageCard,
                {
                  backgroundColor: msg.color + '10',
                  marginRight: scaleSpacing(16),
                  marginLeft: index === 0 ? 0 : 0,
                  width: screenWidth - scaleSpacing(77)
                }
              ]}
            >
              <View style={[styles.messageHeader, { paddingLeft: 0 }]}>
                <View style={[styles.messageIcon, { backgroundColor: msg.color + '20' }]}>
                  <Icon name={msg.icon as any} size={30} color={msg.color} />
                </View>
                <RNText style={styles.messageTitle}>{msg.title}</RNText>
              </View>
              <RNText style={[styles.messageText, { paddingRight: scaleSpacing(4) }]}>{msg.message}</RNText>
            </View>
          ))}
        </ScrollView>
      )}

      {hasMissions && (
        <View style={styles.missionsContainer}>
          {dailyMissions.map((mission) => (
            <View key={mission.id} style={styles.missionCard}>
              <Icon
                name={mission.completed ? 'checkmark-circle' : 'ellipse-outline'}
                size={24}
                color={mission.completed ? '#4CAF50' : '#CCCCCC'}
              />
              <View style={styles.missionContent}>
                <RNText style={[
                  styles.missionTitle,
                  mission.completed && styles.missionCompleted
                ]}>
                  {mission.title}
                </RNText>
                <RNText style={styles.missionDescription}>
                  {mission.description}
                </RNText>
              </View>
              <Icon name={mission.icon as any} size={20} color={emotionColors.textLight} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default React.memo(SelfCareSection);
