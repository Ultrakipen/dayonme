// HighlightedText 컴포넌트 - 검색어 하이라이트
import React from 'react';
import { Text } from 'react-native-paper';

interface HighlightedTextProps {
  text: string;
  highlight?: string;
  style?: any;
  numberOfLines?: number;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight, style, numberOfLines }) => {
  if (!text || typeof text !== 'string') {
    return <Text style={style} numberOfLines={numberOfLines} />;
  }

  if (!highlight || highlight.trim() === '') {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text
            key={index}
            style={[
              style,
              {
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                fontWeight: '700',
                paddingHorizontal: 4,
                paddingVertical: 1,
                borderRadius: 4,
                overflow: 'hidden',
              },
            ]}
          >
            {part}
          </Text>
        ) : (
          <Text key={index}>{part}</Text>
        )
      )}
    </Text>
  );
};

export default HighlightedText;
