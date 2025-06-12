import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Linking,
  TextInput,
} from 'react-native';
import { TaggedArticleCarousel } from '../components/feeds/TaggedArticleCarousel';
import { colors, shadows } from '../constants/colors';
import { spacing, fontSize } from '../constants/spacing';
import type { Article } from '../lib/sdk';
import { sdk } from '../lib/sdk';

interface ArticlesTabletScreenProps {
  selectedFeedId?: string | null;
  refreshKey?: number;
}

export function ArticlesTabletScreen({ selectedFeedId, refreshKey }: ArticlesTabletScreenProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
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

  // refreshKeyが変更されたときに記事をリフレッシュ（将来の機能拡張用）
  useEffect(() => {
    // refreshKeyが変更されたときの処理（現在はTaggedArticleCarousel内で処理される）
  }, [refreshKey]);

  const handleOpenArticle = async (article: Article) => {
    try {
      const supported = await Linking.canOpenURL(article.url);
      if (supported) {
        await Linking.openURL(article.url);
      } else {
        Alert.alert('エラー', 'URLを開くことができませんでした。');
      }
    } catch (error) {
      console.error('記事オープンエラー:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '今日';
    } else if (diffDays === 2) {
      return '昨日';
    } else if (diffDays <= 7) {
      return `${diffDays - 1}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* 記事一覧 */}
      <View style={styles.articlesList}>
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

        {/* フィードフィルターチップ */}
        {selectedFeedId && (
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>{currentFeedName || 'フィードフィルター中'}</Text>
          </View>
        )}

        {/* タグ別記事カルーセル（タブレット版は簡略化） */}
        <TaggedArticleCarousel 
          selectedFeedId={selectedFeedId}
          searchTerm={searchQuery}
        />
      </View>

      {/* 記事詳細（将来の機能拡張用 - 現在はカルーセル内で記事閲覧） */}
      <View style={styles.articleDetail}>
        <View style={styles.noSelectionContainer}>
          <Text style={styles.noSelectionIcon}>📰</Text>
          <Text style={styles.noSelectionTitle}>タグごとの記事カルーセル</Text>
          <Text style={styles.noSelectionDescription}>
            左側のカルーセルでタグごとに整理された記事をお楽しみください
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.gray[50],
  },
  articlesList: {
    width: 400,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    backgroundColor: colors.gray[100],
    borderRadius: 8,
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
  filterChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  filterChipText: {
    fontSize: fontSize.xs,
    color: colors.primary[700],
  },
  articleDetail: {
    flex: 1,
    backgroundColor: colors.white,
  },
  noSelectionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  noSelectionIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  noSelectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '500',
    color: colors.gray[500],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  noSelectionDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.5,
  },
});