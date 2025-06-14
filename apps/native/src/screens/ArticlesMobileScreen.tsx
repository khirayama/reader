import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { TaggedArticleCarousel } from '../components/feeds/TaggedArticleCarousel';
import { colors, shadows } from '../constants/colors';
import { spacing, fontSize } from '../constants/spacing';
import { sdk } from '../lib/sdk';

interface ArticlesMobileScreenProps {
  selectedFeedId?: string | null;
  onFeedSelect?: (feedId: string | null) => void;
  onFeedRefresh?: () => void;
}

export function ArticlesMobileScreen({
  selectedFeedId,
  onFeedSelect,
  onFeedRefresh,
}: ArticlesMobileScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFeedName, setCurrentFeedName] = useState('');

  // フィード情報を取得
  useEffect(() => {
    const fetchFeedInfo = async () => {
      if (selectedFeedId === 'bookmarks') {
        setCurrentFeedName('お気に入り記事');
      } else if (selectedFeedId) {
        try {
          const feed = await sdk.feeds.getFeed(selectedFeedId);
          setCurrentFeedName(feed.title);
        } catch (error) {
          console.error('フィード情報取得エラー:', error);
          setCurrentFeedName('フィードフィルター中');
        }
      } else {
        setCurrentFeedName('');
      }
    };

    fetchFeedInfo();
  }, [selectedFeedId]);

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="記事を検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.gray[400]}
          />
          <TouchableOpacity style={styles.searchIcon}>
            <Text style={styles.searchIconText}>🔍</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* フィードフィルターチップ */}
      {selectedFeedId && (
        <View style={styles.filterChipContainer}>
          <TouchableOpacity style={styles.filterChip} onPress={() => onFeedSelect?.(null)}>
            <Text style={styles.filterChipText}>{currentFeedName || 'フィードフィルター中'}</Text>
            <Text style={styles.filterChipClose}>×</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 記事一覧 */}
      <View style={{ flex: 1 }}>
        <TaggedArticleCarousel selectedFeedId={selectedFeedId} searchTerm={searchQuery} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    ...shadows.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: fontSize.sm,
    color: colors.gray[900],
  },
  searchIcon: {
    padding: spacing.xs,
  },
  searchIconText: {
    fontSize: 16,
  },
  filterChipContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  filterChipText: {
    fontSize: fontSize.xs,
    color: colors.primary[700],
    marginRight: spacing.xs,
  },
  filterChipClose: {
    fontSize: fontSize.sm,
    color: colors.primary[600],
    fontWeight: 'bold',
  },
});
