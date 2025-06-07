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
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>RSS Reader</Text>
        <Button
          title="ログアウト"
          onPress={handleLogout}
          variant="outline"
          size="small"
          style={styles.logoutButton}
        />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ユーザー情報とナビゲーション */}
        <Card style={styles.mainCard}>
          <Text style={styles.welcome}>こんにちは、{user?.name || user?.email}さん</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{feeds.length}</Text>
              <Text style={styles.statLabel}>フィード</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{recentArticles.length}</Text>
              <Text style={styles.statLabel}>記事</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="フィード"
              onPress={() => navigation.navigate('Feeds')}
              style={styles.navButton}
              size="medium"
            />
            <Button
              title="記事"
              onPress={() => navigation.navigate('Articles')}
              style={styles.navButton}
              size="medium"
            />
          </View>
        </Card>

        {/* 最新記事 */}
        {recentArticles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最新記事</Text>
            {recentArticles.slice(0, 5).map((article) => (
              <View key={article.id} style={styles.listItem}>
                <Text style={styles.articleTitle} numberOfLines={2}>
                  {article.title}
                </Text>
                <Text style={styles.articleMeta}>
                  {article.feed?.title || 'フィード'} • {formatDate(article.publishedAt)}
                </Text>
              </View>
            ))}
            <Button
              title="すべて表示"
              onPress={() => navigation.navigate('Articles')}
              variant="outline"
              size="small"
              style={styles.seeAllButton}
            />
          </View>
        )}

        {/* フィード一覧 */}
        {feeds.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>フィード</Text>
            {feeds.slice(0, 5).map((feed) => (
              <View key={feed.id} style={styles.listItem}>
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
              title="すべて表示"
              onPress={() => navigation.navigate('Feeds')}
              variant="outline"
              size="small"
              style={styles.seeAllButton}
            />
          </View>
        )}

        {/* プロフィール */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設定</Text>
          <Button
            title="プロフィール設定"
            onPress={() => navigation.navigate('Profile')}
            variant="outline"
            style={styles.settingsButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  logoutButton: {
    paddingHorizontal: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mainCard: {
    marginBottom: 20,
  },
  welcome: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  listItem: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  articleTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 18,
  },
  articleMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  feedTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  feedMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  seeAllButton: {
    marginTop: 8,
  },
  settingsButton: {
    marginTop: 8,
  },
});