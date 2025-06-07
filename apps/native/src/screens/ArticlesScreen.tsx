import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Linking } from 'react-native';
import { sdk } from '../lib/sdk';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import type { AppTabNavigationProp } from '../types/navigation';
import type { Article } from '../../../../packages/sdk/src/types';

interface ArticlesScreenProps {
  navigation: AppTabNavigationProp;
  route?: {
    params?: {
      feedId?: string;
    };
  };
}

export function ArticlesScreen({ navigation, route }: ArticlesScreenProps) {
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

  const handleOpenArticle = async (url: string) => {
    try {
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {feedId ? 'フィード記事' : '記事一覧'}
        </Text>
        {feedId && (
          <Button
            title="全記事"
            onPress={() => navigation.navigate('Articles')}
            variant="secondary"
            size="small"
          />
        )}
      </View>

      <Card>
        <Input
          label="記事を検索"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="タイトルまたは内容で検索..."
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <Button
          title="検索"
          onPress={handleSearch}
          disabled={isLoading}
        />
      </Card>

      {articles.length === 0 && !isLoading ? (
        <Card>
          <Text style={styles.emptyMessage}>
            {searchQuery 
              ? '検索条件に一致する記事が見つかりませんでした。'
              : 'まだ記事がありません。フィードを追加して記事を読み込んでください。'
            }
          </Text>
        </Card>
      ) : (
        articles.map((article, index) => (
          <Card key={`${article.id}-${index}`}>
            <Text style={styles.articleTitle} numberOfLines={3}>
              {article.title}
            </Text>
            
            <Text style={styles.articleMeta}>
              {article.feed?.title || 'フィード'} • {formatDate(article.publishedAt)}
            </Text>

            {article.description && (
              <Text style={styles.articleContent} numberOfLines={4}>
                {stripHtml(article.description)}
              </Text>
            )}

            <View style={styles.articleActions}>
              <Button
                title="記事を読む"
                onPress={() => handleOpenArticle(article.url)}
                style={styles.readButton}
              />
            </View>
          </Card>
        ))
      )}

      {hasMore && articles.length > 0 && (
        <Card>
          <Button
            title={isLoading ? '読み込み中...' : 'さらに読み込む'}
            onPress={handleLoadMore}
            disabled={isLoading}
            variant="secondary"
          />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  articleMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  articleContent: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 16,
  },
  articleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  readButton: {
    flex: 1,
  },
});