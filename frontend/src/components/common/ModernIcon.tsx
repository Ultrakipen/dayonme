import React from 'react';
import { TouchableOpacity, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ModernIconProps {
  name: string;
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
}

const ModernIcon: React.FC<ModernIconProps> = ({
  name,
  size = 24,
  color = '#666',
  onPress,
  style,
  testID
}) => {
  const IconComponent = (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
      style={style}
      testID={testID}
    />
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={style} testID={testID}>
        <MaterialCommunityIcons name={name} size={size} color={color} />
      </TouchableOpacity>
    );
  }

  return IconComponent;
};

export default ModernIcon;