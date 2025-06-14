import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { TaggedArticleCarousel } from '../components/feeds/TaggedArticleCarousel';
import { colors, shadows } from '../constants/colors';
import { spacing, fontSize } from '../constants/spacing';
import { sdk } from '../lib/sdk';
import type { AppDrawerNavigationProp as DrawerNavigationProp } from '../types/navigation';

interface ArticlesTabletScreenProps {
  selectedFeedId?: string | null;
  refreshKey?: number;
  navigation?: DrawerNavigationProp;
}

export function ArticlesTabletScreen({ selectedFeedId, refreshKey, navigation }: ArticlesTabletScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentFeedName, setCurrentFeedName] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [hideReadArticles, setHideReadArticles] = useState(false);

  // フィード情報を取得
  useEffect(() => {
    const fetchFeedInfo = async () => {
      if (selectedFeedId) {
        try {
          const feed = await sdk.feeds.getFeed(selectedFeedId);
          setCurrentFeedName(feed.title);
        } catch (error) {
          console.error('フィード情報取得エラー:', error);
          setCurrentFeedName('フィードフィルター中');
        }
      } else {
        setCurrentFeedName('');
      }
    };

    fetchFeedInfo();
  }, [selectedFeedId]);

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            {/* ドロワーオープンボタン */}
            <TouchableOpacity
              style={styles.drawerButton}
              onPress={() => navigation?.openDrawer()}
            >
              <Text style={styles.drawerButtonText}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {selectedFeedId ? currentFeedName : 'すべての記事'}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            {/* 既読記事の表示/非表示切り替えボタン */}
            <TouchableOpacity
              style={[styles.iconButton, hideReadArticles && styles.iconButtonActive]}
              onPress={() => setHideReadArticles(!hideReadArticles)}
            >
              <Text style={[styles.iconButtonText, hideReadArticles && styles.iconButtonTextActive]}>
                {hideReadArticles ? '👁️‍🗨️' : '👁️'}
              </Text>
            </TouchableOpacity>
            
            {/* 検索ボタン */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Text style={styles.iconButtonText}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 検索フィールド（トグル表示） */}
        {showSearch && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="記事を検索..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.gray[400]}
              autoFocus
            />
          </View>
        )}
      </View>

      {/* タグ付き記事カルーセル */}
      <TaggedArticleCarousel 
        selectedFeedId={selectedFeedId}
        searchTerm={searchQuery}
        hideReadArticles={hideReadArticles}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    ...shadows.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drawerButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.gray[100],
  },
  drawerButtonText: {
    fontSize: 18,
    color: colors.gray[600],
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconButton: {
    padding: spacing.xs,
    borderRadius: 6,
    backgroundColor: colors.gray[100],
    minWidth: 36,
    alignItems: 'center',
  },
  iconButtonActive: {
    backgroundColor: colors.primary[100],
  },
  iconButtonText: {
    fontSize: 16,
    color: colors.gray[600],
  },
  iconButtonTextActive: {
    color: colors.primary[600],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: fontSize.sm,
    color: colors.gray[900],
  },
});