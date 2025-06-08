import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { sdk } from '../lib/sdk';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useResponsive } from '../hooks/useResponsive';
import type { AppDrawerNavigationProp as DrawerNavigationProp } from '../types/navigation';
import type { Feed, Article } from '../../../../packages/sdk/src/types';

interface ArticlesTabletScreenProps {
  navigation: DrawerNavigationProp;
  route: {
    params?: {
      feedId?: string;
    };
  };
}

export function ArticlesTabletScreen({ navigation, route }: ArticlesTabletScreenProps) {
  const { isTablet } = useResponsive();
  const feedId = route.params?.feedId;
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [selectedFeedId, setSelectedFeedId] = useState<string | undefined>(feedId);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadFeeds();
    loadArticles();
  }, []);

  const loadFeeds = async () => {
    try {
      const feedsData = await sdk.feeds.getAll();
      setFeeds(feedsData);
    } catch (error: unknown) {
      console.error('Failed to load feeds:', error);
    }
  };

  const loadArticles = async (isRefresh = false) => {
    try {
      setIsLoading(true);
      const currentPage = isRefresh ? 1 : page;
      
      const params = {
        page: currentPage,
        limit: 20,
        feedId: selectedFeedId,
        search: searchQuery || undefined,
      };

      const data = await sdk.articles.getAll(params);
      
      if (isRefresh) {
        setArticles(data.articles);
        setPage(1);
      } else {
        setArticles(prev => currentPage === 1 ? data.articles : [...prev, ...data.articles]);
      }
      
      setHasMore(data.hasMore);
      
      // タブレットで記事が選択されていない場合、最初の記事を選択
      if (isTablet && !selectedArticle && data.articles.length > 0) {
        setSelectedArticle(data.articles[0]);
      }
    } catch (error: unknown) {
      Alert.alert('エラー', '記事の読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadArticles(true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1);
      loadArticles();
    }
  };

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

  const renderArticleList = () => (
    <View style={[styles.articleList, isTablet && styles.articleListTablet]}>
      {/* フィルターセクション */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.feedFilter}
        >
          <Pressable
            style={[
              styles.feedChip,
              !selectedFeedId && styles.feedChipActive,
            ]}
            onPress={() => setSelectedFeedId(undefined)}
          >
            <Text
              style={[
                styles.feedChipText,
                !selectedFeedId && styles.feedChipTextActive,
              ]}
            >
              すべて
            </Text>
          </Pressable>
          {feeds.map((feed) => (
            <Pressable
              key={feed.id}
              style={[
                styles.feedChip,
                selectedFeedId === feed.id && styles.feedChipActive,
              ]}
              onPress={() => setSelectedFeedId(feed.id)}
            >
              <Text
                style={[
                  styles.feedChipText,
                  selectedFeedId === feed.id && styles.feedChipTextActive,
                ]}
                numberOfLines={1}
              >
                {feed.title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.searchContainer}>
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="記事を検索..."
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* 記事リスト */}
      <ScrollView
        style={styles.articleScrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 20;
          if (
            layoutMeasurement.height + contentOffset.y >=
            contentSize.height - paddingToBottom
          ) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
        showsVerticalScrollIndicator={false}
      >
        {articles.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyMessage}>
              {searchQuery
                ? '検索結果が見つかりませんでした。'
                : selectedFeedId
                ? 'このフィードにはまだ記事がありません。'
                : '記事がありません。フィードを追加してください。'}
            </Text>
          </View>
        ) : (
          articles.map((article) => (
            <Pressable
              key={article.id}
              style={[
                styles.articleCard,
                isTablet && selectedArticle?.id === article.id && styles.articleCardSelected,
              ]}
              onPress={() => {
                if (isTablet) {
                  setSelectedArticle(article);
                } else if (article.url) {
                  Linking.openURL(article.url);
                }
              }}
            >
              <Text style={styles.articleTitle} numberOfLines={2}>
                {article.title}
              </Text>
              {article.description && (
                <Text style={styles.articleDescription} numberOfLines={2}>
                  {article.description}
                </Text>
              )}
              <View style={styles.articleMeta}>
                <Text style={styles.articleMetaText}>
                  {article.feed?.title || 'フィード'}
                </Text>
                <Text style={styles.articleMetaText}>
                  {formatDate(article.publishedAt)}
                </Text>
              </View>
            </Pressable>
          ))
        )}

        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3B82F6" />
          </View>
        )}
      </ScrollView>
    </View>
  );

  const renderArticleDetail = () => {
    if (!selectedArticle) {
      return (
        <View style={styles.articleDetail}>
          <View style={styles.emptyDetailContainer}>
            <Text style={styles.emptyDetailMessage}>
              記事を選択してください
            </Text>
          </View>
        </View>
      );
    }

    return (
      <ScrollView style={styles.articleDetail}>
        <View style={styles.detailContent}>
          <Text style={styles.detailTitle}>{selectedArticle.title}</Text>
          
          <View style={styles.detailMeta}>
            <Text style={styles.detailMetaText}>
              {selectedArticle.feed?.title || 'フィード'}
            </Text>
            <Text style={styles.detailMetaText}>
              {formatDate(selectedArticle.publishedAt)}
            </Text>
          </View>

          {selectedArticle.description && (
            <Text style={styles.detailDescription}>
              {selectedArticle.description}
            </Text>
          )}

          <Button
            title="記事を開く"
            onPress={() => {
              if (selectedArticle.url) {
                Linking.openURL(selectedArticle.url);
              }
            }}
            style={styles.openButton}
          />
        </View>
      </ScrollView>
    );
  };

  if (isTablet) {
    return (
      <View style={styles.containerTablet}>
        {renderArticleList()}
        {renderArticleDetail()}
      </View>
    );
  }

  return renderArticleList();
}

const styles = StyleSheet.create({
  containerTablet: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
  },
  articleList: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  articleListTablet: {
    flex: 0,
    width: 400,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  feedFilter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  feedChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    minWidth: 60,
  },
  feedChipActive: {
    backgroundColor: '#3B82F6',
  },
  feedChipText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  feedChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInput: {
    backgroundColor: '#F3F4F6',
  },
  articleScrollView: {
    flex: 1,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  articleCardSelected: {
    backgroundColor: '#EBF5FF',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  articleDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  articleMetaText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  articleDetail: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  emptyDetailContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyDetailMessage: {
    fontSize: 18,
    color: '#9CA3AF',
  },
  detailContent: {
    padding: 24,
  },
  detailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 32,
  },
  detailMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailMetaText: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  openButton: {
    marginTop: 16,
  },
});