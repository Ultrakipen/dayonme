import React from 'react';
import { View, Text as RNText } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
  progress: number;
  maxProgress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

const CircularProgress = ({
  progress,
  maxProgress,
  size = 70,
  strokeWidth = 6,
  color = '#4CAF50'
}: CircularProgressProps) => {
  const percentage = Math.min((progress / maxProgress) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* 배경 원 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E0E0E0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* 진행률 원 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <RNText style={{ fontSize: 15, fontFamily: 'Pretendard-Bold', color: color }}>
          {Math.round(percentage)}%
        </RNText>
      </View>
    </View>
  );
};

export default CircularProgress;
