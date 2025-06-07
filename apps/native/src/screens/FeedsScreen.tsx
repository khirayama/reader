import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { sdk } from '../lib/sdk';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import type { AppTabNavigationProp } from '../types/navigation';
import type { Feed } from '../../../../packages/sdk/src/types';

interface FeedsScreenProps {
  navigation: AppTabNavigationProp;
}

export function FeedsScreen({ navigation }: FeedsScreenProps) {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      setIsLoading(true);
      const feedsData = await sdk.feeds.getAll();
      setFeeds(feedsData);
    } catch (error: unknown) {
      Alert.alert('エラー', 'フィードの読み込みに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeeds();
    setRefreshing(false);
  };

  const handleAddFeed = async () => {
    if (!newFeedUrl.trim()) {
      Alert.alert('エラー', 'フィードURLを入力してください。');
      return;
    }

    try {
      setIsAdding(true);
      await sdk.feeds.create({ url: newFeedUrl.trim() });
      setNewFeedUrl('');
      setShowAddForm(false);
      await loadFeeds();
      Alert.alert('成功', 'フィードを追加しました。');
    } catch (error: unknown) {
      Alert.alert('エラー', error instanceof Error ? error.message : 'フィードの追加に失敗しました。');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteFeed = async (feedId: string, feedTitle: string) => {
    Alert.alert(
      'フィード削除',
      `「${feedTitle}」を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await sdk.feeds.delete(feedId);
              await loadFeeds();
              Alert.alert('成功', 'フィードを削除しました。');
            } catch (error: unknown) {
              Alert.alert('エラー', 'フィードの削除に失敗しました。');
            }
          },
        },
      ]
    );
  };

  const handleRefreshFeed = async (feedId: string) => {
    try {
      await sdk.feeds.refresh(feedId);
      await loadFeeds();
      Alert.alert('成功', 'フィードを更新しました。');
    } catch (error: unknown) {
      Alert.alert('エラー', 'フィードの更新に失敗しました。');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未更新';
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
        <Text style={styles.title}>フィード</Text>
        <Button
          title={showAddForm ? 'キャンセル' : '追加'}
          onPress={() => {
            setShowAddForm(!showAddForm);
            setNewFeedUrl('');
          }}
          variant={showAddForm ? 'outline' : 'primary'}
          size="small"
        />
      </View>

      {/* フィード追加フォーム */}
      {showAddForm && (
        <View style={styles.addFormContainer}>
          <Input
            value={newFeedUrl}
            onChangeText={setNewFeedUrl}
            placeholder="フィードURLを入力..."
            keyboardType="url"
            autoCapitalize="none"
            style={styles.addInput}
          />
          <Button
            title={isAdding ? '追加中...' : '追加'}
            onPress={handleAddFeed}
            disabled={isAdding}
            size="small"
            style={styles.addButton}
          />
        </View>
      )}

      {/* フィード一覧 */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {feeds.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyMessage}>
              まだフィードが登録されていません。
              上の「追加」ボタンから新しいフィードを追加してください。
            </Text>
          </View>
        ) : (
          feeds.map((feed) => (
            <View key={feed.id} style={styles.feedCard}>
              <View style={styles.feedHeader}>
                <Text style={styles.feedTitle} numberOfLines={2}>
                  {feed.title}
                </Text>
                <View style={styles.feedStatus}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: feed.isActive ? '#10B981' : '#EF4444' },
                    ]}
                  />
                </View>
              </View>

              {feed.description && (
                <Text style={styles.feedDescription} numberOfLines={2}>
                  {feed.description}
                </Text>
              )}

              <Text style={styles.feedMeta}>
                最終更新: {formatDate(feed.lastFetchedAt)}
              </Text>

              <View style={styles.feedActions}>
                <Button
                  title="更新"
                  onPress={() => handleRefreshFeed(feed.id)}
                  variant="outline"
                  size="small"
                  style={styles.actionButton}
                />
                <Button
                  title="記事"
                  onPress={() =>
                    navigation.navigate('Articles', { feedId: feed.id })
                  }
                  variant="outline"
                  size="small"
                  style={styles.actionButton}
                />
                <Button
                  title="削除"
                  onPress={() => handleDeleteFeed(feed.id, feed.title)}
                  variant="danger"
                  size="small"
                  style={styles.actionButton}
                />
              </View>
            </View>
          ))
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
  addFormContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  addInput: {
    flex: 1,
  },
  addButton: {
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
  feedCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  feedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  feedDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  feedMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  feedActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});