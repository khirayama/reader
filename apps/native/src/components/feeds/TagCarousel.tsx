import React from 'react';
import {
  FlatList,
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';

interface Tag {
  id: string;
  name: string;
  color?: string;
  feedCount?: number;
}

interface TagCarouselProps {
  tags: Tag[];
  selectedTagId: string | null;
  onTagSelect: (tagId: string | null) => void;
  isLoading?: boolean;
}

export function TagCarousel({
  tags,
  selectedTagId,
  onTagSelect,
  isLoading = false,
}: TagCarouselProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3B82F6" />
          {[...Array(3)].map((_, i) => (
            <View key={i} style={styles.loadingTag} />
          ))}
        </View>
      </View>
    );
  }

  if (tags.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('tags.noTags')}</Text>
        </View>
      </View>
    );
  }

  const handleTagPress = (tagId: string | null) => {
    onTagSelect(tagId);
  };

  // 「全て」タグを含むデータ配列を作成
  const allTags = [
    { id: '__all__', name: t('tags.all'), isAll: true },
    ...tags.map((tag) => ({ ...tag, isAll: false })),
  ];

  const renderTag: ListRenderItem<(typeof allTags)[0]> = ({ item }) => {
    const isSelected = item.isAll ? selectedTagId === null : selectedTagId === item.id;
    const tagId = item.isAll ? null : item.id;

    return (
      <TouchableOpacity
        onPress={() => handleTagPress(tagId)}
        style={[
          styles.tagButton,
          isSelected && [
            styles.selectedTagButton,
            !item.isAll && { backgroundColor: item.color || '#3B82F6' },
          ],
        ]}
        activeOpacity={0.7}
      >
        <Text style={[styles.tagText, isSelected && styles.selectedTagText]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={allTags}
        renderItem={renderTag}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
        snapToInterval={120} // スナップ間隔（タグボタンの幅に合わせて調整）
        snapToAlignment="start"
        decelerationRate="fast"
        bounces={false}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  loadingTag: {
    height: 32,
    width: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedTagButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
  },
  selectedTagText: {
    color: '#FFFFFF',
  },
});

// ダークモード対応のスタイル
export const darkStyles = StyleSheet.create({
  container: {
    borderBottomColor: '#374151',
    backgroundColor: '#1F2937',
  },
  emptyText: {
    color: '#9CA3AF',
  },
  tagButton: {
    backgroundColor: '#374151',
  },
  tagText: {
    color: '#D1D5DB',
  },
  loadingTag: {
    backgroundColor: '#374151',
  },
});
