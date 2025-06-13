import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
} from 'react-native';
import { useTaggedArticles } from '../../hooks/useTaggedArticles';
import { TagArticleList } from './TagArticleList';
import { colors } from '../../constants/colors';
import { spacing, fontSize } from '../../constants/spacing';

const screenWidth = Dimensions.get('window').width;

interface TaggedArticleCarouselProps {
  selectedFeedId?: string | null;
  searchTerm?: string;
  onCurrentTagChange?: (tagName: string) => void;
}

export function TaggedArticleCarousel({ 
  selectedFeedId, 
  searchTerm, 
  onCurrentTagChange 
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
  const carouselRef = useRef<ScrollView>(null);
  const tabScrollRef = useRef<ScrollView>(null);

  // 現在のタグ名を親コンポーネントに通知
  useEffect(() => {
    if (onCurrentTagChange) {
      onCurrentTagChange(currentTagName);
    }
  }, [currentTagName, onCurrentTagChange]);

  // カルーセルのスクロール処理
  const handleCarouselScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isScrolling) return;

    const { contentOffset } = event.nativeEvent;
    const currentIndex = Math.round(contentOffset.x / screenWidth);
    
    if (currentIndex !== currentGroupIndex && currentIndex >= 0 && currentIndex < articleGroups.length) {
      changeGroup(currentIndex);
    }
  };

  const handleGroupChange = (index: number) => {
    setIsScrolling(true);
    changeGroup(index);
    
    // カルーセルをスクロール
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        x: index * screenWidth,
        animated: true,
      });
    }
    
    // タブナビゲーションを中央に表示
    if (tabScrollRef.current && !selectedFeedId) {
      const tabWidth = 120; // 推定タブ幅
      const scrollToX = Math.max(0, index * tabWidth - screenWidth / 2 + tabWidth / 2);
      tabScrollRef.current.scrollTo({
        x: scrollToX,
        animated: true,
      });
    }

    // スクロール完了後にフラグをリセット
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
                {group.articles.length > 0 && (
                  <Text style={[
                    styles.tabCount,
                    currentGroupIndex === index ? styles.activeTabCount : styles.inactiveTabCount,
                  ]}>
                    ({group.articles.length})
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* カルーセルコンテンツ */}
      {selectedFeedId ? (
        // フィード選択時は最初のグループのみ表示
        articleGroups.length > 0 && (
          <View style={styles.content}>
            <TagArticleList
              group={articleGroups[0]}
              onLoadMore={loadMoreArticles}
              onMarkAsRead={markArticleAsRead}
              onToggleBookmark={toggleBookmark}
              onArticlePress={handleArticlePress}
            />
          </View>
        )
      ) : (
        // 全体表示時はカルーセル
        <ScrollView
          ref={carouselRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleCarouselScroll}
          scrollEventThrottle={16}
          style={styles.carouselScrollView}
        >
          {articleGroups.map((group) => (
            <View key={group.id} style={styles.carouselPage}>
              <TagArticleList
                group={group}
                onLoadMore={loadMoreArticles}
                onMarkAsRead={markArticleAsRead}
                onToggleBookmark={toggleBookmark}
                onArticlePress={handleArticlePress}
              />
            </View>
          ))}
        </ScrollView>
      )}
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
  tabCount: {
    fontSize: fontSize.xs,
    marginLeft: spacing.xs,
  },
  activeTabCount: {
    color: colors.white,
  },
  inactiveTabCount: {
    color: colors.gray[500],
  },
  content: {
    flex: 1,
  },
  carouselScrollView: {
    flex: 1,
  },
  carouselPage: {
    width: screenWidth,
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