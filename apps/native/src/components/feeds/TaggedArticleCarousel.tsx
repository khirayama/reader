import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useTaggedArticles } from '../../hooks/useTaggedArticles';
import { TagArticleList } from './TagArticleList';
import { colors } from '../../constants/colors';
import { spacing, fontSize } from '../../constants/spacing';

interface TaggedArticleCarouselProps {
  selectedFeedId?: string | null;
  searchTerm?: string;
  onCurrentTagChange?: (tagName: string) => void;
  hideReadArticles?: boolean;
}

export function TaggedArticleCarousel({
  selectedFeedId,
  searchTerm,
  onCurrentTagChange,
  hideReadArticles = false,
}: TaggedArticleCarouselProps) {
  const {
    articleGroups,
    currentGroupIndex,
    currentTagName,
    tagsLoading,
    changeGroup,
    loadMoreArticles,
    markArticleAsRead,
    toggleBookmark,
    refresh,
  } = useTaggedArticles({ selectedFeedId, searchTerm });

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollViewSize, setScrollViewSize] = useState({ width: 0, height: 0 });
  const carouselRef = useRef<ScrollView>(null);
  const tabScrollRef = useRef<ScrollView>(null);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 現在のタグ名を親コンポーネントに通知
  useEffect(() => {
    if (onCurrentTagChange) {
      onCurrentTagChange(currentTagName);
    }
  }, [currentTagName, onCurrentTagChange]);

  // 画面サイズ変更の監視
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => {
      subscription?.remove();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleScrollViewLayout = (event: NativeSyntheticEvent<{ layout: { width: number; height: number; x: number; y: number } }>) => {
    setScrollViewSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  };

  // カルーセルのスクロール処理
  const handleCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const pageIndex = Math.round(contentOffset.x / layoutMeasurement.width);

    console.log('[TagCarousel] スクロール検知:', {
      pageIndex,
      currentGroupIndex,
      contentOffsetX: contentOffset.x,
      layoutWidth: layoutMeasurement.width,
      articleGroupsLength: articleGroups.length,
      isScrolling,
    });

    if (pageIndex !== currentGroupIndex && pageIndex >= 0 && pageIndex < articleGroups.length) {
      console.log('[TagCarousel] グループ変更:', pageIndex, articleGroups[pageIndex]?.name);
      changeGroup(pageIndex);
    }
  };

  // リアルタイムスクロール監視
  const handleScrollProgress = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const pageIndex = Math.round(contentOffset.x / layoutMeasurement.width);

    // 既存のタイムアウトをクリア
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 少し遅延してからグループ変更を検知
    scrollTimeoutRef.current = setTimeout(() => {
      if (pageIndex !== currentGroupIndex && pageIndex >= 0 && pageIndex < articleGroups.length) {
        console.log('[TagCarousel] 遅延グループ変更:', pageIndex, articleGroups[pageIndex]?.name);
        changeGroup(pageIndex);
      }
    }, 150);
  };

  const handleGroupChange = (index: number) => {
    setIsScrolling(true);
    changeGroup(index);

    // カルーセルを該当ページにスクロール
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    }

    // タブを中央に配置
    if (tabScrollRef.current && index < articleGroups.length) {
      const tabWidth = 120; // 推定タブ幅
      const scrollToX = Math.max(0, index * tabWidth - screenWidth / 2 + tabWidth / 2);
      tabScrollRef.current.scrollTo({
        x: scrollToX,
        animated: true,
      });
    }

    // スクロール状態をリセット
    setTimeout(() => setIsScrolling(false), 500);
  };

  const handleArticlePress = async (articleUrl: string, articleId: string) => {
    await markArticleAsRead(articleId);
    // React Native では Linking を使用して外部ブラウザで開く
    const { Linking } = require('react-native');
    Linking.openURL(articleUrl);
  };

  if (tagsLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.loadingContainer}>
            {[...Array(5)].map((_, i) => (
              <View key={i} style={styles.loadingTab} />
            ))}
          </View>
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  if (articleGroups.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📰</Text>
        <Text style={styles.emptyTitle}>タグがありません</Text>
        <Text style={styles.emptySubtitle}>フィードにタグを設定してください</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* タグタブナビゲーション - フィード選択時は非表示 */}
      {!selectedFeedId && (
        <View style={styles.header}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabContainer}
            style={styles.tabScrollView}
          >
            {articleGroups.map((group, index) => (
              <TouchableOpacity
                key={group.id}
                onPress={() => handleGroupChange(index)}
                style={[
                  styles.tab,
                  currentGroupIndex === index ? styles.activeTab : styles.inactiveTab,
                ]}
              >
                {group.color && (
                  <View
                    style={[
                      styles.colorDot,
                      { backgroundColor: group.color },
                      currentGroupIndex === index && styles.activeColorDot,
                    ]}
                  />
                )}
                <Text
                  style={[
                    styles.tabText,
                    currentGroupIndex === index ? styles.activeTabText : styles.inactiveTabText,
                  ]}
                  numberOfLines={1}
                >
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* カルーセルコンテンツ */}
      <View style={styles.contentContainer}>
        {selectedFeedId ? (
          // フィード選択時は単一表示
          articleGroups.length > 0 && (
            <TagArticleList
              group={articleGroups[0]}
              onLoadMore={loadMoreArticles}
              onMarkAsRead={markArticleAsRead}
              onToggleBookmark={toggleBookmark}
              onArticlePress={handleArticlePress}
              hideReadArticles={hideReadArticles}
            />
          )
        ) : (
          // 通常時はスワイプ式カルーセル
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleCarouselScroll}
            onScrollEndDrag={handleCarouselScroll}
            onScroll={handleScrollProgress}
            scrollEventThrottle={16}
            bounces={false}
            style={styles.carousel}
            onLayout={handleScrollViewLayout}
          >
            {articleGroups.map((group, index) => (
              <View
                key={group.id}
                style={{ width: scrollViewSize.width, height: scrollViewSize.height }}
              >
                <TagArticleList
                  group={group}
                  onLoadMore={loadMoreArticles}
                  onMarkAsRead={markArticleAsRead}
                  onToggleBookmark={toggleBookmark}
                  onArticlePress={handleArticlePress}
                  hideReadArticles={hideReadArticles}
                />
              </View>
            ))}
          </ScrollView>
        )}
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabScrollView: {
    maxHeight: 60,
  },
  tabContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    marginRight: spacing.xs,
    minWidth: 80,
    maxWidth: 200,
  },
  activeTab: {
    backgroundColor: colors.primary[500],
  },
  inactiveTab: {
    backgroundColor: colors.gray[100],
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  activeColorDot: {
    backgroundColor: colors.white,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    flex: 1,
  },
  activeTabText: {
    color: colors.white,
  },
  inactiveTabText: {
    color: colors.gray[700],
  },
  contentContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  carousel: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadingTab: {
    height: 32,
    width: 80,
    backgroundColor: colors.gray[200],
    borderRadius: 8,
  },
  loadingContent: {
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
