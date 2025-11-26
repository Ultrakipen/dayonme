// src/components/TagSelector.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';

interface Tag {
  id: number;
  name: string;
}

interface TagSelectorProps {
  tags: Tag[];
  selectedTags: number[];
  onTagSelect: (tagId: number) => void;
  onTagCreate?: (tagName: string) => void;
  title?: string;
  allowCreation?: boolean;
  multiple?: boolean;
  maxSelected?: number;
}

const TagSelector: React.FC<TagSelectorProps> = ({
  tags,
  selectedTags,
  onTagSelect,
  onTagCreate,
  title = '태그 선택',
  allowCreation = false,
  multiple = true,
  maxSelected,
}) => {
  const [newTagText, setNewTagText] = useState('');
  
  const handleTagSelect = (tagId: number) => {
    onTagSelect(tagId);
  };
  
  const handleCreateTag = () => {
    if (newTagText.trim() && onTagCreate) {
      onTagCreate(newTagText.trim());
      setNewTagText('');
    }
  };
  
  const isMaxSelected = maxSelected !== undefined && selectedTags.length >= maxSelected;
  
  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <ScrollView 
        horizontal={false} 
        showsVerticalScrollIndicator={false}
        style={styles.tagScroll}
      >
        <View style={styles.tagContainer}>
          {tags.map((tag) => {
            const isSelected = selectedTags.includes(tag.id);
            const disabled = !isSelected && isMaxSelected;
            
            return (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.tag,
                  isSelected && styles.selectedTag,
                  disabled && styles.disabledTag,
                ]}
                onPress={() => handleTagSelect(tag.id)}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.tagText,
                    isSelected && styles.selectedTagText,
                    disabled && styles.disabledTagText,
                  ]}
                >
                  {tag.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      
      {allowCreation && onTagCreate && (
        <View style={styles.createTagContainer}>
          <TextInput
            style={styles.input}
            value={newTagText}
            onChangeText={setNewTagText}
            placeholder="새 태그 입력"
            maxLength={20}
          />
          <TouchableOpacity
            style={[styles.createButton, !newTagText.trim() && styles.disabledButton]}
            onPress={handleCreateTag}
            disabled={!newTagText.trim()}
          >
            <Text style={styles.createButtonText}>추가</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {maxSelected && (
        <Text style={styles.helperText}>
          {selectedTags.length}/{maxSelected} 선택됨
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333333',
  },
  tagScroll: {
    maxHeight: 120,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  selectedTag: {
    backgroundColor: '#E1EFF9',
    borderColor: '#4A90E2',
  },
  disabledTag: {
    opacity: 0.5,
  },
  tagText: {
    color: '#666666',
    fontSize: 14,
  },
  selectedTagText: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  disabledTagText: {
    color: '#999999',
  },
  createTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 4,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  createButton: {
    backgroundColor: '#4A90E2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: '#999999',
    marginTop: 8,
  },
});

export default TagSelector;