import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import type { TaggedArticleGroup } from '../../hooks/useTaggedArticles';
import { Button } from '../ui/Button';
import { colors } from '../../constants/colors';
import { spacing, fontSize } from '../../constants/spacing';

interface TagArticleListProps {
  group: TaggedArticleGroup;
  onLoadMore: () => void;
  onMarkAsRead: (articleId: string) => void;
  onToggleBookmark: (articleId: string, isBookmarked: boolean) => void;
  onArticlePress: (articleUrl: string, articleId: string) => void;
}

export function TagArticleList({
  group,
  onLoadMore,
  onMarkAsRead,
  onToggleBookmark,
  onArticlePress
}: TagArticleListProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderBookmarkIcon = (isBookmarked: boolean) => (
    <Text style={[
      styles.icon,
      { color: isBookmarked ? colors.warning[600] : colors.gray[400] }
    ]}>
      {isBookmarked ? '★' : '☆'}
    </Text>
  );

  const renderCheckIcon = () => (
    <Text style={[styles.icon, { color: colors.success[600] }]}>✓</Text>
  );

  const renderExternalIcon = () => (
    <Text style={[styles.icon, { color: colors.primary[600] }]}>↗</Text>
  );

  const renderArticleItem = ({ item: article }: { item: any }) => (
    <TouchableOpacity
      style={styles.articleItem}
      onPress={() => onArticlePress(article.url, article.id)}
      activeOpacity={0.7}
    >
      <View style={styles.articleContent}>
        <View style={styles.articleMeta}>
          <View style={styles.articleMetaLeft}>
            {article.feed?.favicon && (
              <Image
                source={{ uri: article.feed.favicon }}
                style={styles.favicon}
                onError={() => {
                  // ファビコン読み込みエラー時は非表示にする
                }}
              />
            )}
            <Text style={styles.feedTitle} numberOfLines={1}>
              {article.feed?.title}
            </Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.publishedAt}>
              {formatDate(article.publishedAt)}
            </Text>
          </View>
          {article.isRead && (
            <View style={styles.readBadge}>
              <Text style={styles.readBadgeText}>読了済み</Text>
            </View>
          )}
        </View>

        <Text 
          style={[
            styles.articleTitle,
            article.isRead ? styles.readTitle : styles.unreadTitle
          ]}
          numberOfLines={2}
        >
          {article.title}
        </Text>

        {article.description && (
          <Text style={styles.articleDescription} numberOfLines={1}>
            {article.description}
          </Text>
        )}
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onToggleBookmark(article.id, !!article.isBookmarked);
          }}
        >
          {renderBookmarkIcon(!!article.isBookmarked)}
        </TouchableOpacity>

        {!article.isRead && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onMarkAsRead(article.id);
            }}
          >
            {renderCheckIcon()}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onArticlePress(article.url, article.id);
          }}
        >
          {renderExternalIcon()}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!group.hasMore) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        <Button
          title={group.loading ? '読み込み中...' : 'さらに読み込む'}
          onPress={onLoadMore}
          disabled={group.loading}
          variant="outline"
          size="sm"
        />
        {group.loading && (
          <ActivityIndicator 
            size="small" 
            color={colors.primary[500]} 
            style={styles.loadingIndicator}
          />
        )}
      </View>
    );
  };

  if (group.loading && group.articles.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  if (group.articles.length === 0) {
    // ブックマーク専用のメッセージ処理
    const isBookmarks = group.id === '__bookmarks__' || group.name === 'お気に入り記事';
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>{isBookmarks ? '⭐' : '📰'}</Text>
        <Text style={styles.emptyTitle}>
          {isBookmarks 
            ? 'お気に入り記事がありません'
            : group.id === '__all__' 
              ? '記事がありません' 
              : `「${group.name}」の記事がありません`
          }
        </Text>
        <Text style={styles.emptySubtitle}>
          {isBookmarks
            ? '記事をブックマークするとここに表示されます'
            : group.id === '__all__' 
              ? 'フィードを追加して記事を読み始めましょう'
              : 'このタグの記事が更新されるまでお待ちください'
          }
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={group.articles}
        renderItem={renderArticleItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
    paddingVertical: spacing.xs,
  },
  articleItem: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  articleContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  articleMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  favicon: {
    width: 16,
    height: 16,
    borderRadius: 2,
    marginRight: spacing.xs,
  },
  feedTitle: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginRight: spacing.xs,
    flex: 1,
  },
  metaSeparator: {
    fontSize: fontSize.xs,
    color: colors.gray[300],
    marginHorizontal: spacing.xs,
  },
  publishedAt: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  readBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  readBadgeText: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
  },
  articleTitle: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    lineHeight: fontSize.sm * 1.4,
    marginBottom: spacing.xs,
  },
  readTitle: {
    color: colors.gray[600],
  },
  unreadTitle: {
    color: colors.gray[900],
  },
  articleDescription: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    lineHeight: fontSize.xs * 1.4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionButton: {
    padding: spacing.xs,
    borderRadius: 4,
  },
  icon: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginHorizontal: spacing.md,
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    marginTop: spacing.md,
  },
  loadingIndicator: {
    marginTop: spacing.sm,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.gray[500],
    marginTop: spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    color: colors.gray[500],
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
  },
});