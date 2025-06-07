import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { sdk } from '../lib/sdk';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { AppTabNavigationProp } from '../types/navigation';
import type { Feed, Article } from '../../../../packages/sdk/src/types';

interface DashboardScreenProps {
  navigation: AppTabNavigationProp;
}

export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { user, logout } = useAuth();
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [feedsData, articlesData] = await Promise.all([
        sdk.feeds.getAll(),
        sdk.articles.getAll({ limit: 10 }),
      ]);
      setFeeds(feedsData);
      setRecentArticles(articlesData.articles);
    } catch (error: unknown) {
      Alert.alert('エラー', 'データの読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error: unknown) {
              Alert.alert('エラー', 'ログアウトに失敗しました。');
            }
          },
        },
      ]
    );
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>RSS Reader</Text>
        <Text style={styles.welcome}>こんにちは、{user?.name}さん</Text>
      </View>

      <Card>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{feeds.length}</Text>
            <Text style={styles.statLabel}>フィード</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{recentArticles.length}</Text>
            <Text style={styles.statLabel}>未読記事</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="フィード管理"
            onPress={() => navigation.navigate('Feeds')}
            style={styles.button}
          />
          <Button
            title="記事一覧"
            onPress={() => navigation.navigate('Articles')}
            style={styles.button}
          />
        </View>
      </Card>

      {recentArticles.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>最新記事</Text>
          {recentArticles.slice(0, 5).map((article) => (
            <View key={article.id} style={styles.articleItem}>
              <Text style={styles.articleTitle} numberOfLines={2}>
                {article.title}
              </Text>
              <Text style={styles.articleMeta}>
                {article.feed?.title || 'フィード'} • {formatDate(article.publishedAt)}
              </Text>
            </View>
          ))}
          <Button
            title="全ての記事を見る"
            onPress={() => navigation.navigate('Articles')}
            variant="secondary"
            style={styles.seeAllButton}
          />
        </Card>
      )}

      {feeds.length > 0 && (
        <Card>
          <Text style={styles.sectionTitle}>マイフィード</Text>
          {feeds.slice(0, 5).map((feed) => (
            <View key={feed.id} style={styles.feedItem}>
              <Text style={styles.feedTitle} numberOfLines={1}>
                {feed.title}
              </Text>
              <Text style={styles.feedMeta}>
                {feed.lastFetchedAt
                  ? `最終更新: ${formatDate(feed.lastFetchedAt)}`
                  : '未更新'}
              </Text>
            </View>
          ))}
          <Button
            title="全てのフィードを見る"
            onPress={() => navigation.navigate('Feeds')}
            variant="secondary"
            style={styles.seeAllButton}
          />
        </Card>
      )}

      <Card>
        <Text style={styles.sectionTitle}>アカウント</Text>
        <Button
          title="プロフィール設定"
          onPress={() => navigation.navigate('Profile')}
          variant="secondary"
          style={styles.accountButton}
        />
        <Button
          title="ログアウト"
          onPress={handleLogout}
          variant="danger"
          style={styles.accountButton}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  welcome: {
    fontSize: 18,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  articleItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  articleMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  feedItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  feedMeta: {
    fontSize: 14,
    color: '#6B7280',
  },
  seeAllButton: {
    marginTop: 16,
  },
  accountButton: {
    marginBottom: 8,
  },
});