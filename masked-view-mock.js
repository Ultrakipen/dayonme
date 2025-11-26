// masked-view mock for React Native
import React from 'react';
import { View } from 'react-native';

const MaskedView = ({ children, ...props }) => {
  return <View {...props}>{children}</View>;
};

export default MaskedView;
