import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CHALLENGE_COLORS as COLORS } from '../../../constants/challenge';
import { useModernTheme } from '../../../contexts/ModernThemeContext';

type EmptyType = 'created' | 'participating';

interface EmptyMyChallengeProps {
  type: EmptyType;
  onButtonPress: () => void;
}

export const EmptyMyChallenge = memo<EmptyMyChallengeProps>(({ type, onButtonPress }) => {
  const { theme } = useModernTheme();
  const isCreated = type === 'created';

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name={isCreated ? 'crown-outline' : 'heart-outline'}
        size={64}
        color={theme.text.secondary}
      />
      <Text style={[styles.title, { color: theme.text.primary }]}>
        {isCreated ? '아직 만든 챌린지가 없어요' : '아직 참여한 챌린지가 없어요'}
      </Text>
      <Text style={[styles.description, { color: theme.text.secondary }]}>
        {isCreated
          ? '나만의 챌린지를 만들어\n다른 사람들과 함께 도전해보세요!'
          : '관심있는 챌린지를 찾아\n함께 도전해보세요!'}
      </Text>
      <TouchableOpacity style={styles.button} onPress={onButtonPress}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <MaterialCommunityIcons
            name={isCreated ? 'plus' : 'magnify'}
            size={20}
            color="white"
          />
          <Text style={styles.buttonText}>
            {isCreated ? '챌린지 만들기' : '챌린지 둘러보기'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
});

EmptyMyChallenge.displayName = 'EmptyMyChallenge';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Pretendard-Bold',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Pretendard-Bold',
  },
});
