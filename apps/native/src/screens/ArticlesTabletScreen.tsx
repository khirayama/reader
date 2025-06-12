import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SimpleArticleList } from '../components/feeds/SimpleArticleList';
import { colors } from '../constants/colors';
import { spacing, fontSize } from '../constants/spacing';
import { sdk } from '../lib/sdk';

interface ArticlesTabletScreenProps {
  selectedFeedId?: string | null;
  refreshKey?: number;
}

export function ArticlesTabletScreen({ selectedFeedId, refreshKey }: ArticlesTabletScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFeedName, setCurrentFeedName] = useState('');

  // フィード情報を取得
  useEffect(() => {
    const fetchFeedInfo = async () => {
      if (selectedFeedId) {
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
        <Text style={styles.headerTitle}>
          {selectedFeedId ? currentFeedName : 'すべての記事'}
        </Text>
        
        {/* 検索バー */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="記事を検索..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.gray[400]}
          />
          <View style={styles.searchIcon}>
            <Text>🔍</Text>
          </View>
        </View>
      </View>

      {/* シンプルな記事一覧 */}
      <SimpleArticleList 
        selectedFeedId={selectedFeedId}
        searchTerm={searchQuery}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    padding: spacing.md,
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.sm,
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
});