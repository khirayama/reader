import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing, fontSize } from '../../constants/spacing';
import { useTaggedArticles } from '../../hooks/useTaggedArticles';
import { TagArticleList } from './TagArticleList';

const { width: screenWidth } = Dimensions.get('window');

interface TaggedArticleCarouselProps {
  selectedFeedId?: string | null;
  searchTerm?: string;
}

export function TaggedArticleCarousel({ selectedFeedId, searchTerm }: TaggedArticleCarouselProps) {
  const {
    articleGroups,
    currentGroupIndex,
    tagsLoading,
    changeGroup,
    loadMoreArticles,
    markArticleAsRead,
    toggleBookmark,
    refresh,
  } = useTaggedArticles({ selectedFeedId, searchTerm });

  const carouselRef = useRef<FlatList>(null);
  const tabScrollRef = useRef<FlatList>(null);

  const handleGroupChange = (index: number) => {
    changeGroup(index);
    
    // カルーセルを該当のページにスクロール
    carouselRef.current?.scrollToIndex({
      index,
      animated: true,
    });

    // タブを中央に表示
    tabScrollRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5, // 中央に配置
    });
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      if (index !== currentGroupIndex) {
        changeGroup(index);
      }
    }
  }).current;

  const renderTabItem = ({ item, index }: { item: any; index: number }) => {
    const isSelected = currentGroupIndex === index;
    
    return (
      <TouchableOpacity
        style={[
          styles.tabButton,
          isSelected && [
            styles.selectedTabButton,
            item.color && { backgroundColor: item.color },
          ],
        ]}
        onPress={() => handleGroupChange(index)}
        activeOpacity={0.7}
      >
        {item.color && (
          <View 
            style={[
              styles.tabColorIndicator, 
              { backgroundColor: isSelected ? 'white' : item.color }
            ]}
          />
        )}
        <Text
          style={[
            styles.tabText,
            isSelected && styles.selectedTabText,
          ]}
        >
          {item.name}
          {item.articles.length > 0 && (
            <Text style={styles.tabCountText}> ({item.articles.length})</Text>
          )}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCarouselItem = ({ item }: { item: any }) => (
    <View style={styles.carouselItem}>
      <TagArticleList
        group={item}
        onLoadMore={loadMoreArticles}
        onMarkAsRead={markArticleAsRead}
        onToggleBookmark={toggleBookmark}
      />
    </View>
  );

  if (tagsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.tabContainer}>
          <View style={styles.loadingTabsContainer}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            {[...Array(3)].map((_, i) => (
              <View key={i} style={styles.loadingTab} />
            ))}
          </View>
        </View>
        <View style={styles.contentLoadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[600]} />
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
        <Text style={styles.emptyDescription}>
          フィードにタグを設定してください
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* タブナビゲーション */}
      <View style={styles.tabContainer}>
        <FlatList
          ref={tabScrollRef}
          data={articleGroups}
          renderItem={renderTabItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
          style={styles.tabScrollView}
          snapToInterval={120}
          snapToAlignment="center"
          decelerationRate="fast"
          bounces={false}
          getItemLayout={(data, index) => ({
            length: 120,
            offset: 120 * index,
            index,
          })}
        />
      </View>

      {/* カルーセルコンテンツ */}
      <FlatList
        ref={carouselRef}
        data={articleGroups}
        renderItem={renderCarouselItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        getItemLayout={(data, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        scrollEventThrottle={16}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.white,
  },
  tabScrollView: {
    flex: 1,
  },
  tabScrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  loadingTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  loadingTab: {
    height: 32,
    width: 80,
    backgroundColor: colors.gray[200],
    borderRadius: 16,
  },
  contentLoadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.gray[50],
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
  tabButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.gray[100],
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    flexDirection: 'row',
  },
  selectedTabButton: {
    backgroundColor: colors.primary[600],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  tabColorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
    textAlign: 'center',
  },
  selectedTabText: {
    color: colors.white,
  },
  tabCountText: {
    fontSize: fontSize.sm,
    fontWeight: 'normal',
  },
  carouselItem: {
    width: screenWidth,
    flex: 1,
  },
});