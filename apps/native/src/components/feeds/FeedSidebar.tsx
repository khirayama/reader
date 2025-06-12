import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { sdk } from '../../lib/sdk';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { colors, shadows } from '../../constants/colors';
import { spacing, fontSize } from '../../constants/spacing';

// Feed型を直接定義
interface Feed {
  id: string;
  title: string;
  url: string;
  siteUrl?: string;
  description?: string;
  favicon?: string;
  userId: string;
  lastFetchedAt?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    articles: number;
  };
}

interface FeedSidebarProps {
  selectedFeedId?: string | null;
  onFeedSelect: (feedId: string | null) => void;
  onFeedRefresh: () => void;
}

export function FeedSidebar({ 
  selectedFeedId, 
  onFeedSelect, 
  onFeedRefresh 
}: FeedSidebarProps) {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingFeed, setAddingFeed] = useState(false);
  const [refreshingAll, setRefreshingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      setLoading(true);
      const response = await sdk.feeds.getAll();
      setFeeds(response);
    } catch (error) {
      console.error('フィード読み込みエラー:', error);
      Alert.alert('エラー', 'フィードの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeeds();
    setRefreshing(false);
  };

  const handleAddFeed = async () => {
    if (!newFeedUrl.trim()) return;

    try {
      setAddingFeed(true);
      await sdk.feeds.create({ url: newFeedUrl.trim() });
      setNewFeedUrl('');
      await loadFeeds();
      onFeedRefresh();
      Alert.alert('成功', 'フィードが正常に追加されました。');
    } catch (error) {
      console.error('フィード追加エラー:', error);
      Alert.alert('エラー', 'フィードの追加に失敗しました。URLを確認してください。');
    } finally {
      setAddingFeed(false);
    }
  };

  const handleDeleteFeed = async (feedId: string) => {
    Alert.alert(
      'フィード削除',
      'このフィードを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await sdk.feeds.delete(feedId);
              await loadFeeds();
              if (selectedFeedId === feedId) {
                onFeedSelect(null);
              }
              onFeedRefresh();
            } catch (error) {
              console.error('フィード削除エラー:', error);
              Alert.alert('エラー', 'フィードの削除に失敗しました。');
            }
          },
        },
      ]
    );
  };

  const handleRefreshAll = async () => {
    try {
      setRefreshingAll(true);
      await sdk.feeds.refreshAll();
      await loadFeeds();
      onFeedRefresh();
      Alert.alert('成功', 'すべてのフィードが更新されました。');
    } catch (error) {
      console.error('全フィード更新エラー:', error);
      Alert.alert('エラー', 'フィードの更新に失敗しました。');
    } finally {
      setRefreshingAll(false);
    }
  };

  const renderFeedIcon = (feed: Feed) => {
    if (feed.favicon) {
      return (
        <Image
          source={{ uri: feed.favicon }}
          style={styles.feedIcon}
          onError={() => {
            // フォールバック処理は自動的に処理される
          }}
        />
      );
    }
    return (
      <View style={styles.defaultIcon}>
        <Text style={styles.defaultIconText}>📡</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ヘッダーセクション */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Text style={styles.headerIcon}>📡</Text>
          <Text style={styles.headerText}>フィード管理</Text>
        </View>

        {/* フィード追加フォーム */}
        <View style={styles.addForm}>
          <Input
            placeholder="RSS フィードのURLを入力..."
            value={newFeedUrl}
            onChangeText={setNewFeedUrl}
            style={styles.input}
          />
          <Button
            title={addingFeed ? 'フィード追加中...' : 'フィードを追加'}
            onPress={handleAddFeed}
            disabled={addingFeed || !newFeedUrl.trim()}
            loading={addingFeed}
            fullWidth
            style={styles.addButton}
          />
        </View>

        {/* 操作ボタン */}
        <View style={styles.fullWidthButtonContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary, styles.fullWidthButton]}
            onPress={handleRefreshAll}
            disabled={refreshingAll}
          >
            <Text style={styles.actionButtonIcon}>🔄</Text>
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              {refreshingAll ? '更新中' : '更新'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* すべてのフィード（Sticky） */}
      <View style={styles.stickyAllFeeds}>
        <TouchableOpacity
          style={[
            styles.feedItem,
            styles.allFeedsItem,
            !selectedFeedId && styles.feedItemActive
          ]}
          onPress={() => onFeedSelect(null)}
        >
          <View style={styles.feedIcon}>
            <View style={[styles.defaultIcon, styles.allFeedsIcon]}>
              <Text style={styles.allFeedsIconText}>全</Text>
            </View>
          </View>
          <View style={styles.feedContent}>
            <Text style={[
              styles.feedTitle,
              !selectedFeedId && styles.feedTitleActive
            ]}>
              すべてのフィード
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* フィード一覧 */}
      <ScrollView
        style={styles.feedList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary[600]} />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        ) : feeds.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📡</Text>
            <Text style={styles.emptyTitle}>フィードがありません</Text>
            <Text style={styles.emptyDescription}>
              上のフォームからRSSフィードを追加してください
            </Text>
          </View>
        ) : (
          <View style={styles.feedsContainer}>
            <Text style={styles.sectionTitle}>
              フィード ({feeds.length})
            </Text>
            {feeds.map((feed) => (
              <TouchableOpacity
                key={feed.id}
                style={[
                  styles.feedItem,
                  selectedFeedId === feed.id && styles.feedItemActive
                ]}
                onPress={() => onFeedSelect(feed.id)}
                onLongPress={() => handleDeleteFeed(feed.id)}
              >
                <View style={styles.feedItemContent}>
                  <View style={styles.feedItemLeft}>
                    {renderFeedIcon(feed)}
                    <View style={styles.feedItemInfo}>
                      <Text
                        style={[
                          styles.feedItemTitle,
                          selectedFeedId === feed.id && styles.feedItemTitleActive
                        ]}
                        numberOfLines={1}
                      >
                        {feed.title}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.feedItemRight}>
                    {feed._count && (
                      <Text style={styles.feedItemCount}>
                        {feed._count.articles}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  headerText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
  },
  addForm: {
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.sm,
  },
  addButton: {
    marginBottom: spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fullWidthButtonContainer: {
    width: '100%',
  },
  fullWidthButton: {
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    ...shadows.sm,
  },
  actionButtonPrimary: {
    backgroundColor: colors.primary[600],
  },
  actionButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[300],
  },
  actionButtonSecondary: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  actionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
  },
  actionButtonTextPrimary: {
    color: colors.white,
  },
  actionButtonTextOutline: {
    color: colors.primary[600],
  },
  actionButtonTextSecondary: {
    color: colors.gray[700],
  },
  feedList: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  loadingText: {
    marginLeft: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  emptyContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.gray[500],
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    textAlign: 'center',
  },
  feedsContainer: {
    padding: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.gray[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  feedItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: 8,
  },
  feedItemActive: {
    backgroundColor: colors.primary[50],
    borderLeftWidth: 2,
    borderLeftColor: colors.primary[500],
  },
  feedItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  feedIcon: {
    width: 16,
    height: 16,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  defaultIcon: {
    width: 16,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  defaultIconText: {
    fontSize: 10,
  },
  feedItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  feedItemTitle: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[900],
  },
  feedItemTitleActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
  feedItemRight: {
    marginLeft: spacing.sm,
  },
  feedItemCount: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  // Sticky All Feeds styles
  stickyAllFeeds: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    padding: spacing.sm,
  },
  allFeedsItem: {
    backgroundColor: 'transparent',
    marginBottom: 0,
  },
  allFeedsIcon: {
    backgroundColor: colors.primary[600],
  },
  allFeedsIconText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
  feedContent: {
    flex: 1,
    minWidth: 0,
  },
  feedTitle: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[900],
  },
  feedTitleActive: {
    color: colors.primary[700],
    fontWeight: '600',
  },
});