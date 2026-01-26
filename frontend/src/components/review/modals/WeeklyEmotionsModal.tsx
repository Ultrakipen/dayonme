import React from 'react';
import { Modal, View, Text as RNText, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { emotionColors } from '../../../constants/reviewColors';
import { getEmotionIcon, getEmotionColor } from '../../../utils/emotionHelpers';
import { scaleFontSize, scaleSpacing } from '../../../styles/ReviewScreen.styles';

interface WeeklyEmotionsModalProps {
  visible: boolean;
  onClose: () => void;
  weeklyEmotionsData: any[];
  selectedPeriod: 'week' | 'month' | 'year';
  getRecordStatusTitle: () => string;
  styles: any;
  colors: any;
  isDark: boolean;
}

const WeeklyEmotionsModal: React.FC<WeeklyEmotionsModalProps> = ({
  visible,
  onClose,
  weeklyEmotionsData,
  selectedPeriod,
  getRecordStatusTitle,
  styles,
  colors,
  isDark
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlayCenter}>
        <View style={styles.modalContainerCenter}>
          <View style={styles.modalHeader}>
            <RNText style={styles.modalTitle}>{getRecordStatusTitle()}</RNText>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Icon name="close" size={28} color={emotionColors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 20 }}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            scrollEventThrottle={16}
          >
            <RNText style={[styles.modalSubtitle, { textAlign: 'center' }]}>
              당신의 감정 여행, 함께 돌아볼까요? 💫
            </RNText>

            {weeklyEmotionsData.length > 0 ? (
              <View style={styles.modernEmotionSection}>
                <View
                  style={{
                    paddingVertical: 20,
                    paddingHorizontal: 10,
                    minHeight: 250,
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {(() => {
                    const renderEmotionItem = (
                      emotionName: string,
                      emotionEmoji: string,
                      emotionColor: string,
                      label: string,
                      idx: number
                    ) => {
                      const seed = emotionName.charCodeAt(0) + idx;
                      const randomX = ((seed * 17) % 24) - 12;
                      const randomY = ((seed * 23) % 24) - 12;

                      return (
                        <View
                          key={idx}
                          style={{
                            alignItems: 'center',
                            marginHorizontal: 10,
                            marginVertical: 10,
                            transform: [{ translateX: randomX }, { translateY: randomY }]
                          }}
                        >
                          <RNText style={{ fontSize: scaleFontSize(52), marginBottom: scaleSpacing(6) }}>
                            {emotionEmoji}
                          </RNText>
                          <RNText
                            style={{
                              fontSize: scaleFontSize(17),
                              fontFamily: 'Pretendard-Bold',
                              color: emotionColor,
                              textAlign: 'center'
                            }}
                          >
                            {emotionName}
                          </RNText>
                          <RNText
                            style={{
                              fontSize: scaleFontSize(15),
                              fontFamily: 'Pretendard-SemiBold',
                              color: colors.text.secondary,
                              textAlign: 'center',
                              marginTop: scaleSpacing(3)
                            }}
                          >
                            {label}
                          </RNText>
                        </View>
                      );
                    };

                    if (selectedPeriod === 'week') {
                      const groupedByDay: { [key: string]: any[] } = {};
                      weeklyEmotionsData.forEach((item: any) => {
                        if (!groupedByDay[item.dayOfWeek]) {
                          groupedByDay[item.dayOfWeek] = [];
                        }
                        groupedByDay[item.dayOfWeek].push(item);
                      });

                      const items = Object.entries(groupedByDay)
                        .slice(0, 7)
                        .map(([day, emotions], idx) => {
                          if (!emotions || emotions.length === 0) return null;

                          const firstEmotion = emotions[0];
                          const emotionName = firstEmotion.emotion || '기록됨';
                          const emotionEmoji = getEmotionIcon(emotionName);
                          const emotionColor = firstEmotion.emotionColor || getEmotionColor(emotionName);

                          return renderEmotionItem(emotionName, emotionEmoji, emotionColor, day, idx);
                        })
                        .filter(Boolean);
                      return items;
                    } else if (selectedPeriod === 'month') {
                      const chunkSize = Math.max(1, Math.ceil(weeklyEmotionsData.length / 4));
                      const weekGroups: any[][] = [];
                      for (let i = 0; i < weeklyEmotionsData.length; i += chunkSize) {
                        weekGroups.push(weeklyEmotionsData.slice(i, i + chunkSize));
                      }

                      return weekGroups
                        .slice(0, 4)
                        .map((emotions, idx) => {
                          if (!emotions || emotions.length === 0) return null;

                          const firstEmotion = emotions[0];
                          const emotionName = firstEmotion.emotion || '기록됨';
                          const emotionEmoji = getEmotionIcon(emotionName);
                          const emotionColor = firstEmotion.emotionColor || getEmotionColor(emotionName);

                          return renderEmotionItem(emotionName, emotionEmoji, emotionColor, `${idx + 1}주차`, idx);
                        })
                        .filter(Boolean);
                    } else {
                      const monthGroups: { [key: number]: any[] } = {};
                      weeklyEmotionsData.forEach((item: any) => {
                        const date = new Date(item.timestamp || Date.now());
                        const monthKey = date.getMonth() + 1;
                        if (!monthGroups[monthKey]) monthGroups[monthKey] = [];
                        monthGroups[monthKey].push(item);
                      });

                      return Object.entries(monthGroups)
                        .slice(0, 12)
                        .map(([month, emotions], idx) => {
                          if (!emotions || emotions.length === 0) return null;

                          const firstEmotion = emotions[0];
                          const emotionName = firstEmotion.emotion || '기록됨';
                          const emotionEmoji = getEmotionIcon(emotionName);
                          const emotionColor = firstEmotion.emotionColor || getEmotionColor(emotionName);

                          return renderEmotionItem(emotionName, emotionEmoji, emotionColor, `${month}월`, idx);
                        })
                        .filter(Boolean);
                    }
                  })()}
                </View>
              </View>
            ) : (
              <View style={{ paddingVertical: scaleSpacing(40), alignItems: 'center' }}>
                <RNText style={{ fontSize: scaleFontSize(48), marginBottom: scaleSpacing(16) }}>😊</RNText>
                <RNText style={{ fontSize: scaleFontSize(17), fontFamily: 'Pretendard-SemiBold', color: colors.text.secondary }}>
                  아직 기록된 감정이 없어요
                </RNText>
                <RNText style={{ fontSize: scaleFontSize(15), color: colors.text.secondary, marginTop: scaleSpacing(8) }}>
                  감정을 기록하면 여기에 표시됩니다
                </RNText>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default WeeklyEmotionsModal;
