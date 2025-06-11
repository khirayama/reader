import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, fontSize } from '../../constants/spacing';
import type { TaggedArticleGroup } from '../../hooks/useTaggedArticles';
import type { Article } from '../../lib/sdk';

interface TagArticleListProps {
  group: TaggedArticleGroup;
  onLoadMore: () => void;
  onMarkAsRead: (articleId: string) => void;
  onToggleBookmark: (articleId: string, isBookmarked: boolean) => void;
}

export function TagArticleList({
  group,
  onLoadMore,
  onMarkAsRead,
  onToggleBookmark,
}: TagArticleListProps) {
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

  const handleOpenArticle = async (article: Article) => {
    try {
      // 記事を既読にマーク
      await onMarkAsRead(article.id);

      // 外部ブラウザで開く
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

  const renderArticle = ({ item: article }: { item: Article }) => (
    <TouchableOpacity
      style={[styles.articleItem, article.isRead && styles.articleItemRead]}
      onPress={() => handleOpenArticle(article)}
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
          onPress={() => onToggleBookmark(article.id, !!article.isBookmarked)}
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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        {group.color && <View style={[styles.colorIndicator, { backgroundColor: group.color }]} />}
        <Text style={styles.groupTitle}>{group.name}</Text>
        <Text style={styles.articleCount}>({group.articles.length}件)</Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!group.hasMore) return null;

    return (
      <View style={styles.loadMoreContainer}>
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={onLoadMore}
          disabled={group.loading}
        >
          {group.loading ? (
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
      <Text style={styles.emptyTitle}>
        {group.id === '__all__' ? '記事がありません' : `「${group.name}」の記事がありません`}
      </Text>
      <Text style={styles.emptyDescription}>
        {group.id === '__all__'
          ? 'フィードを追加して記事を読み始めましょう'
          : 'このタグの記事が更新されるまでお待ちください'}
      </Text>
    </View>
  );

  if (group.loading && group.articles.length === 0) {
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
        data={group.articles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (group.hasMore && !group.loading) {
            onLoadMore();
          }
        }}
        onEndReachedThreshold={0.3}
        contentContainerStyle={[
          styles.listContent,
          group.articles.length === 0 && styles.emptyListContent,
        ]}
        scrollEnabled={true}
        removeClippedSubviews={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={21}
        updateCellsBatchingPeriod={50}
        disableVirtualization={false}
        getItemLayout={(data, index) => ({
          length: 120, // 推定される記事アイテムの高さ
          offset: 120 * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
    overflow: 'hidden',
  },
  listContent: {
    padding: spacing.sm,
    paddingBottom: spacing.xl * 2, // 下部に余裕を持たせる
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  groupTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
  },
  articleCount: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
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
