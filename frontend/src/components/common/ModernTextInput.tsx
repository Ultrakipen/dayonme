import React from 'react';
import { TextInput, TextInputProps } from 'react-native-paper';

interface ModernTextInputProps extends Omit<TextInputProps, 'mode'> {
  label: string;
  required?: boolean;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

const ModernTextInput: React.FC<ModernTextInputProps> = ({
  label,
  required = false,
  rightIcon,
  onRightIconPress,
  ...props
}) => {
  const displayLabel = required ? `${label} *` : label;

  return (
    <TextInput
      label={displayLabel}
      mode="outlined"
      style={{ marginBottom: 16 }}
      right={
        rightIcon ? (
          <TextInput.Icon
            icon={rightIcon}
            onPress={onRightIconPress}
          />
        ) : undefined
      }
      {...props}
    />
  );
};

export default ModernTextInput;