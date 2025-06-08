import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Linking } from 'react-native';
import { sdk } from '../lib/sdk';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import type { AppDrawerNavigationProp as DrawerNavigationProp } from '../types/navigation';
import type { Article } from '../../../../packages/sdk/src/types';

interface ArticlesMobileScreenProps {
  navigation: DrawerNavigationProp;
  route?: {
    params?: {
      feedId?: string;
    };
  };
}

export function ArticlesMobileScreen({ navigation, route }: ArticlesMobileScreenProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const feedId = route?.params?.feedId;

  const loadArticles = useCallback(async (reset = false) => {
    try {
      setIsLoading(true);
      const page = reset ? 1 : currentPage;
      const params: {
        page: number;
        limit: number;
        feedId?: string;
        search?: string;
      } = {
        page,
        limit: 20,
      };

      if (feedId) {
        params.feedId = feedId;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const data = await sdk.articles.getAll(params);
      
      if (reset) {
        setArticles(data.articles);
        setCurrentPage(1);
      } else {
        setArticles(prev => [...prev, ...data.articles]);
      }
      
      setHasMore(data.articles.length === 20);
      if (!reset) {
        setCurrentPage(prev => prev + 1);
      }
    } catch (error: unknown) {
      Alert.alert('エラー', '記事の読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  }, [feedId, searchQuery, currentPage]);

  useEffect(() => {
    loadArticles(true);
  }, [loadArticles]);

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    await loadArticles(true);
    setRefreshing(false);
  };

  const handleSearch = async () => {
    await loadArticles(true);
  };

  const handleLoadMore = async () => {
    if (!isLoading && hasMore) {
      await loadArticles(false);
    }
  };

  const handleOpenArticle = async (url: string, articleId: string) => {
    try {
      // 記事を既読にマーク
      await handleMarkAsRead(articleId);
      
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('エラー', 'このURLを開くことができません。');
      }
    } catch (error) {
      Alert.alert('エラー', 'URLを開く際にエラーが発生しました。');
    }
  };

  const handleMarkAsRead = async (articleId: string) => {
    try {
      await sdk.articles.markRead(articleId);
      setArticles(prev => 
        prev.map(article => 
          article.id === articleId
            ? { ...article, isRead: true, readAt: new Date().toISOString() }
            : article
        )
      );
    } catch (error: unknown) {
      console.error('既読マークエラー:', error);
    }
  };

  const handleToggleBookmark = async (articleId: string, isBookmarked: boolean) => {
    try {
      if (isBookmarked) {
        await sdk.articles.unbookmark(articleId);
      } else {
        await sdk.articles.bookmark(articleId);
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
    } catch (error: unknown) {
      Alert.alert('エラー', 'ブックマーク操作に失敗しました。');
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

  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '').trim();
  };

  return (
    <View style={styles.container}>

      {/* 検索バー */}
      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="記事を検索..."
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          style={styles.searchInput}
        />
        <Button
          title="検索"
          onPress={handleSearch}
          disabled={isLoading}
          size="small"
          style={styles.searchButton}
        />
      </View>

      {/* 記事一覧 */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {articles.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyMessage}>
              {searchQuery 
                ? '検索条件に一致する記事が見つかりませんでした。'
                : 'まだ記事がありません。フィードを追加して記事を読み込んでください。'
              }
            </Text>
          </View>
        ) : (
          articles.map((article, index) => (
            <View key={`${article.id}-${index}`} style={styles.articleCard}>
              <Text style={styles.articleMeta}>
                {article.feed?.title || 'フィード'} • {formatDate(article.publishedAt)}
              </Text>
              
              <Text 
                style={[
                  styles.articleTitle,
                  article.isRead && styles.readArticleTitle
                ]} 
                numberOfLines={3}
              >
                {article.title}
              </Text>

              {article.description && (
                <Text style={styles.articleContent} numberOfLines={3}>
                  {stripHtml(article.description)}
                </Text>
              )}

              <View style={styles.articleActions}>
                <Button
                  title="記事を読む"
                  onPress={() => handleOpenArticle(article.url, article.id)}
                  variant="outline"
                  size="small"
                  style={styles.readButton}
                />
                <Button
                  title={article.isBookmarked ? '★' : '☆'}
                  onPress={() => handleToggleBookmark(article.id, !!article.isBookmarked)}
                  variant="outline"
                  size="small"
                  style={styles.bookmarkButton}
                />
              </View>
            </View>
          ))
        )}

        {hasMore && articles.length > 0 && (
          <View style={styles.loadMoreContainer}>
            <Button
              title={isLoading ? '読み込み中...' : 'さらに読み込む'}
              onPress={handleLoadMore}
              disabled={isLoading}
              variant="outline"
              size="small"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  searchButton: {
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  articleMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  readArticleTitle: {
    color: '#6B7280',
    fontWeight: '400',
  },
  articleContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 18,
    marginBottom: 12,
  },
  articleActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  readButton: {
    flex: 1,
  },
  bookmarkButton: {
    paddingHorizontal: 12,
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});