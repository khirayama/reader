import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, fontSize } from '../../constants/spacing';
import { sdk } from '../../lib/sdk';
import type { Article } from '../../lib/sdk';

interface SimpleArticleListProps {
  selectedFeedId?: string | null;
  searchTerm?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function SimpleArticleList({
  selectedFeedId,
  searchTerm,
}: SimpleArticleListProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);

  // 記事取得
  const loadArticles = async (pageNum = 1, reset = false) => {
    try {
      console.log('[SimpleArticleList] 記事読み込み開始:', { pageNum, reset, selectedFeedId, searchTerm });
      if (pageNum === 1) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const params: {
        page: number;
        limit: number;
        feedId?: string;
        search?: string;
      } = {
        page: pageNum,
        limit: 20,
      };

      if (selectedFeedId) {
        params.feedId = selectedFeedId;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      console.log('[SimpleArticleList] API呼び出し開始:', params);
      const response = await sdk.articles.getAll(params);
      console.log('[SimpleArticleList] API呼び出し完了:', response.articles.length, '件取得');

      setArticles(prev => reset ? response.articles : [...prev, ...response.articles]);
      setPagination(response.pagination);
      setPage(pageNum);
    } catch (error) {
      console.error('[SimpleArticleList] 記事取得エラー:', error);
      Alert.alert('エラー', '記事の取得に失敗しました。');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 初期読み込みと条件変更時の再読み込み
  useEffect(() => {
    console.log('[SimpleArticleList] useEffect発火:', { selectedFeedId, searchTerm });
    loadArticles(1, true);
  }, [selectedFeedId, searchTerm]);

  // さらに読み込む
  const handleLoadMore = () => {
    if (pagination?.hasNext && !loading && !refreshing) {
      loadArticles(page + 1, false);
    }
  };

  // プルリフレッシュ
  const handleRefresh = () => {
    loadArticles(1, true);
  };

  // 記事の既読マーク
  const markArticleAsRead = async (articleId: string) => {
    try {
      await sdk.articles.markAsRead(articleId);
      setArticles(prev =>
        prev.map(article =>
          article.id === articleId
            ? { ...article, isRead: true, readAt: new Date().toISOString() }
            : article
        )
      );
    } catch (error) {
      console.error('既読マークエラー:', error);
    }
  };

  // ブックマーク切り替え
  const toggleBookmark = async (articleId: string, isBookmarked: boolean) => {
    try {
      if (isBookmarked) {
        await sdk.articles.removeBookmark(articleId);
      } else {
        await sdk.articles.addBookmark(articleId);
      }

      setArticles(prev =>
        prev.map(article =>
          article.id === articleId
            ? {
                ...article,
                isBookmarked: !isBookmarked,
                bookmarkedAt: !isBookmarked ? new Date().toISOString() : undefined,
              }
            : article
        )
      );
    } catch (error) {
      console.error('ブックマーク操作エラー:', error);
    }
  };

  // 記事クリック処理
  const handleArticleClick = async (articleUrl: string, articleId: string) => {
    try {
      // 記事を既読にマーク
      await markArticleAsRead(articleId);

      // 外部ブラウザで開く
      const supported = await Linking.canOpenURL(articleUrl);
      if (supported) {
        await Linking.openURL(articleUrl);
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

  const renderArticle = ({ item: article }: { item: Article }) => (
    <TouchableOpacity
      style={[styles.articleItem, article.isRead && styles.articleItemRead]}
      onPress={() => handleArticleClick(article.url, article.id)}
      activeOpacity={0.7}
    >
      <View style={styles.articleHeader}>
        <View style={styles.articleMeta}>
          <Text style={styles.feedTitle} numberOfLines={1}>
            {article.feed?.title || 'フィード'}
          </Text>
          <Text style={styles.publishDate}>{formatDate(article.publishedAt)}</Text>
        </View>

        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={() => toggleBookmark(article.id, !!article.isBookmarked)}
        >
          <Text style={[styles.bookmarkIcon, article.isBookmarked && styles.bookmarkIconActive]}>
            {article.isBookmarked ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text
        style={[styles.articleTitle, article.isRead && styles.articleTitleRead]}
        numberOfLines={2}
      >
        {article.title}
      </Text>

      {article.description && (
        <Text style={styles.articleDescription} numberOfLines={2}>
          {article.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!pagination?.hasNext) return null;

    return (
      <View style={styles.loadMoreContainer}>
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary[600]} />
          ) : (
            <Text style={styles.loadMoreText}>さらに読み込む</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📰</Text>
      <Text style={styles.emptyTitle}>記事がありません</Text>
      <Text style={styles.emptyDescription}>
        フィードを追加して記事を読み始めましょう
      </Text>
    </View>
  );

  if (refreshing && articles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={[
          styles.listContent,
          articles.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary[600]]}
            tintColor={colors.primary[600]}
          />
        }
        scrollEnabled={true}
        removeClippedSubviews={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={21}
        updateCellsBatchingPeriod={50}
        disableVirtualization={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  listContent: {
    padding: spacing.sm,
    paddingBottom: spacing.xl * 2,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['4xl'],
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '500',
    color: colors.gray[500],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
    lineHeight: fontSize.sm * 1.5,
  },
  articleItem: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  articleItemRead: {
    opacity: 0.7,
  },
  articleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  articleMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedTitle: {
    fontSize: fontSize.xs,
    color: colors.primary[600],
    fontWeight: '500',
    marginRight: spacing.sm,
    flex: 1,
  },
  publishDate: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  bookmarkButton: {
    padding: spacing.xs,
  },
  bookmarkIcon: {
    fontSize: 18,
    color: colors.gray[400],
  },
  bookmarkIconActive: {
    color: colors.yellow[500],
  },
  articleTitle: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.gray[900],
    lineHeight: fontSize.base * 1.4,
    marginBottom: spacing.sm,
  },
  articleTitleRead: {
    color: colors.gray[600],
  },
  articleDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    lineHeight: fontSize.sm * 1.4,
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  loadMoreButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  loadMoreText: {
    fontSize: fontSize.sm,
    color: colors.gray[700],
    fontWeight: '500',
  },
});