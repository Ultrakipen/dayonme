import React from 'react';
import { Text, TextStyle } from 'react-native';

interface HighlightedTextProps {
  text: string;
  highlight: string;
  style?: TextStyle;
  highlightStyle?: TextStyle;
  numberOfLines?: number;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  highlight,
  style,
  highlightStyle = { backgroundColor: '#FFE082', fontFamily: 'Pretendard-Bold' },
  numberOfLines
}) => {
  if (!highlight || !text) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
  
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) => {
        if (part.toLowerCase() === highlight.toLowerCase()) {
          return (
            <Text key={index} style={[style, highlightStyle]}>
              {part}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
};

export default HighlightedText;