import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

interface ModernCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: boolean;
  elevation?: number;
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  style,
  padding = true,
  elevation = 2
}) => {
  const cardStyle = [
    styles.card,
    { elevation },
    padding && styles.padding,
    style
  ];

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  padding: {
    padding: 16,
  },
});

export default ModernCard;