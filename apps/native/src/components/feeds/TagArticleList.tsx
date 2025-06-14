import React, { useRef, useEffect, useCallback } from 'react';
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
  const lastLoadTimeRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  const DEBOUNCE_DELAY = 200; // 200msのデバウンス（短縮）
  const MIN_ARTICLES_FOR_INFINITE_SCROLL = 3; // 最低記事数
  const SCROLL_THRESHOLD = 0.7; // 70%スクロール時に検知（より早い検知）
  const BOTTOM_MARGIN = 100; // 下端検知のマージン（px）増加
  
  // 読み込み状態の監視と適切なリセット
  useEffect(() => {
    // group.loadingがfalseになった時（読み込み完了時）
    if (!group.loading && isLoadingRef.current) {
      console.log('[TagArticleList] 読み込み完了、ロード状態リセット');
      isLoadingRef.current = false;
      // lastLoadTimeRefもリセットして新たな読み込みを可能にする
      lastLoadTimeRef.current = 0;
    }
    
    // group.loadingがtrueになった時（新規読み込み開始時）
    if (group.loading && !isLoadingRef.current) {
      console.log('[TagArticleList] 外部から読み込み開始、内部状態を同期');
      isLoadingRef.current = true;
    }
  }, [group.loading]);

  // 記事数の変化を監視して確実にリセット（フォールバック）
  useEffect(() => {
    if (!group.loading && isLoadingRef.current) {
      console.log('[TagArticleList] 記事数変化検知、ロード状態を強制リセット');
      isLoadingRef.current = false;
      lastLoadTimeRef.current = 0;
    }
  }, [group.articles.length, group.loading]);

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


  const renderArticleItem = ({ item: article }: { item: any }) => (
    <TouchableOpacity
      style={styles.articleItem}
      onPress={() => onArticlePress(article.url, article.id)}
      activeOpacity={0.7}
    >
      {/* 上部行：フィード情報（左）とお気に入りボタン（右） */}
      <View style={styles.topRow}>
        <View style={styles.feedMetaRow}>
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

        {/* お気に入りボタン */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            onToggleBookmark(article.id, !!article.isBookmarked);
          }}
        >
          {renderBookmarkIcon(!!article.isBookmarked)}
        </TouchableOpacity>
      </View>

      {/* 下部行：記事タイトル（全幅） */}
      <Text 
        style={[
          styles.articleTitle,
          article.isRead ? styles.readTitle : styles.unreadTitle
        ]}
        numberOfLines={2}
      >
        {article.title}
      </Text>

      {/* 既読バッジ */}
      {article.isRead && (
        <View style={styles.readBadge}>
          <Text style={styles.readBadgeText}>読了済み</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!group.hasMore) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        {group.loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              size="small" 
              color={colors.primary[500]} 
              style={styles.loadingIndicator}
            />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        ) : (
          <Text style={styles.loadMoreText}>スクロールして続きを読み込み</Text>
        )}
      </View>
    );
  };

  // カスタム Intersection Observer (onScroll ベース)
  const handleScroll = useCallback((event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const now = Date.now();
    
    // スクロール位置の計算
    const scrollPosition = contentOffset.y + layoutMeasurement.height;
    const contentHeight = contentSize.height;
    const scrollPercentage = scrollPosition / contentHeight;
    const distanceFromBottom = contentHeight - scrollPosition;
    
    // 複数の条件で読み込みを判定（より柔軟に）
    const isNearBottom = scrollPercentage >= SCROLL_THRESHOLD; // 70%以上
    const isAtBottom = distanceFromBottom <= BOTTOM_MARGIN; // 下端から100px以内
    const isVeryClose = distanceFromBottom <= 20; // 非常に近い場合（20px以内）
    const shouldLoad = isNearBottom || isAtBottom || isVeryClose;
    
    console.log('[TagArticleList] スクロール監視:', {
      scrollY: Math.round(contentOffset.y),
      viewHeight: Math.round(layoutMeasurement.height),
      contentHeight: Math.round(contentHeight),
      scrollPosition: Math.round(scrollPosition),
      scrollPercentage: Math.round(scrollPercentage * 100) + '%',
      distanceFromBottom: Math.round(distanceFromBottom) + 'px',
      threshold: Math.round(SCROLL_THRESHOLD * 100) + '%',
      bottomMargin: BOTTOM_MARGIN + 'px',
      isNearBottom,
      isAtBottom,
      isVeryClose,
      shouldLoad
    });
    
    // 70%以上スクロール、下端100px以内、または非常に近い場合（20px以内）に読み込み
    if (shouldLoad) {
      handleInfiniteLoad(now);
    }
  }, [group.hasMore, group.loading, group.articles.length]);

  // 無限読み込み処理
  const handleInfiniteLoad = (now: number) => {
    console.log('[TagArticleList] 無限読み込み判定:', {
      timestamp: now,
      lastLoadTime: lastLoadTimeRef.current,
      timeSinceLastLoad: now - lastLoadTimeRef.current,
      isLoadingRef: isLoadingRef.current,
      groupLoading: group.loading,
      hasMore: group.hasMore,
      articlesCount: group.articles.length
    });
    
    // 基本条件チェック（読み込み可能性）
    const canLoadMore = 
      group.hasMore && 
      group.articles.length >= MIN_ARTICLES_FOR_INFINITE_SCROLL;
    
    if (!canLoadMore) {
      console.log('[TagArticleList] 読み込み条件未満:', {
        hasMore: group.hasMore,
        articlesCount: group.articles.length,
        minRequired: MIN_ARTICLES_FOR_INFINITE_SCROLL
      });
      return;
    }
    
    // 既に読み込み中の場合はスキップ（ただし情報表示のみ）
    if (isLoadingRef.current || group.loading) {
      console.log('[TagArticleList] 読み込み中のためスキップ (情報のみ):', {
        isLoadingRef: isLoadingRef.current,
        groupLoading: group.loading
      });
      return;
    }
    
    // デバウンス: 前回の読み込み開始から指定時間以内は無視
    if (lastLoadTimeRef.current > 0 && now - lastLoadTimeRef.current < DEBOUNCE_DELAY) {
      console.log('[TagArticleList] デバウンス: 読み込みスキップ');
      return;
    }
    
    console.log('[TagArticleList] 追加読み込み開始');
    lastLoadTimeRef.current = now;
    isLoadingRef.current = true;
    
    // onLoadMoreを実行（Promise化して確実にエラーハンドリング）
    try {
      onLoadMore();
    } catch (error) {
      console.error('[TagArticleList] 読み込み同期エラー:', error);
      isLoadingRef.current = false;
      lastLoadTimeRef.current = 0;
    }
    
    // 念のため5秒後に強制リセット（タイムアウト対策）
    setTimeout(() => {
      if (isLoadingRef.current && !group.loading) {
        console.log('[TagArticleList] タイムアウト後強制リセット');
        isLoadingRef.current = false;
        lastLoadTimeRef.current = 0;
      }
    }, 5000);
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
        // カスタム無限スクロール設定（onScroll ベース）
        onScroll={handleScroll}
        scrollEventThrottle={16} // 16ms間隔でスクロールイベントを受信（60fps対応）
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={15}
        getItemLayout={undefined} // 動的サイズのためundefined
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
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  feedMetaRow: {
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
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
    marginRight: spacing.xs,
    flex: 1,
  },
  metaSeparator: {
    fontSize: fontSize.xs,
    color: colors.gray[300],
    marginHorizontal: spacing.xs,
  },
  publishedAt: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  readBadge: {
    backgroundColor: colors.gray[100],
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
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
  actionButton: {
    padding: spacing.xs,
    borderRadius: 16,
  },
  icon: {
    fontSize: 18,
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
  loadMoreText: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
});