import { useState, useEffect, useCallback } from 'react';
import { sdk } from '../lib/sdk';
import type { Article, Tag } from '../lib/sdk';

// Article型をre-export
export type { Article };

export interface TaggedArticleGroup {
  id: string;
  name: string;
  color?: string;
  articles: Article[];
  loading: boolean;
  hasMore: boolean;
  page: number;
}

interface UseTaggedArticlesOptions {
  searchTerm?: string;
  selectedFeedId?: string | null;
}

export function useTaggedArticles({ searchTerm, selectedFeedId }: UseTaggedArticlesOptions = {}) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [articleGroups, setArticleGroups] = useState<TaggedArticleGroup[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  // タグ一覧の読み込み
  const loadTags = useCallback(async () => {
    try {
      setTagsLoading(true);
      const response = await sdk.tags.getTags({ limit: 50 });
      setTags(response.data.tags);
    } catch (error) {
      console.error('タグ読み込みエラー:', error);
      // タグ取得に失敗した場合は空配列を設定
      setTags([]);
    } finally {
      setTagsLoading(false);
    }
  }, []);

  // 特定のタググループの記事を読み込み
  const loadArticlesForGroup = useCallback(async (groupId: string, page = 1, reset = false) => {
    try {
      console.log('[useTaggedArticles] loadArticlesForGroup開始:', {
        groupId,
        page,
        reset,
        selectedFeedId,
        searchTerm
      });

      setArticleGroups(prev => 
        prev.map(group => 
          group.id === groupId 
            ? { ...group, loading: true }
            : group
        )
      );

      const params: {
        page: number;
        limit: number;
        feedId?: string;
        tagId?: string;
        search?: string;
      } = {
        page,
        limit: 20,
      };

      if (selectedFeedId && selectedFeedId !== 'bookmarks') {
        params.feedId = selectedFeedId;
      }

      if (groupId !== '__all__' && groupId !== '__bookmarks__') {
        params.tagId = groupId;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      console.log('[useTaggedArticles] API呼び出しパラメータ:', params, 'selectedFeedId:', selectedFeedId);
      // selectedFeedIdが'bookmarks'の場合は、ブックマーク記事を取得
      const response = selectedFeedId === 'bookmarks' 
        ? await sdk.articles.getBookmarks({ page, limit: 20 })
        : await sdk.articles.getAll(params);
      console.log('[useTaggedArticles] API呼び出し完了:', response, 'articles数:', response?.articles?.length);

      setArticleGroups(prev => 
        prev.map(group => {
          if (group.id === groupId) {
            const newArticles = reset ? response.articles : [...group.articles, ...response.articles];
            console.log('[useTaggedArticles] 記事更新完了:', {
              groupId,
              reset,
              oldCount: group.articles.length,
              newCount: newArticles.length,
              hasMore: response.pagination.hasNext,
              nextPage: reset ? 2 : page + 1
            });
            return {
              ...group,
              articles: newArticles,
              hasMore: response.pagination.hasNext,
              page: reset ? 2 : page + 1,
              loading: false
            };
          }
          return group;
        })
      );
    } catch (error) {
      console.error('[useTaggedArticles] 記事読み込みエラー:', error);
      console.error('[useTaggedArticles] エラー詳細:', {
        groupId,
        selectedFeedId,
        page,
        reset,
        error: error instanceof Error ? error.message : String(error)
      });
      setArticleGroups(prev => 
        prev.map(group => 
          group.id === groupId 
            ? { ...group, loading: false }
            : group
        )
      );
    }
  }, [selectedFeedId, searchTerm]);

  // 記事グループの初期化
  const initializeArticleGroups = useCallback(async () => {
    // ブックマークが選択されている場合は専用グループのみ作成
    if (selectedFeedId === 'bookmarks') {
      const bookmarksGroup: TaggedArticleGroup = {
        id: '__bookmarks__',
        name: 'お気に入り記事',
        articles: [],
        loading: false,
        hasMore: true,
        page: 1
      };
      setArticleGroups([bookmarksGroup]);
      await loadArticlesForGroup('__bookmarks__', 1, true);
      return;
    }

    // 「全ての記事」グループを最初に追加
    const allGroup: TaggedArticleGroup = {
      id: '__all__',
      name: 'すべての記事',
      articles: [],
      loading: false,
      hasMore: true,
      page: 1
    };

    // タグベースのグループを追加
    const tagGroups: TaggedArticleGroup[] = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      articles: [],
      loading: false,
      hasMore: true,
      page: 1
    }));

    const groups = [allGroup, ...tagGroups];
    setArticleGroups(groups);

    // 最初のグループ（全ての記事）の記事を読み込み
    if (groups.length > 0) {
      await loadArticlesForGroup(groups[0].id, 1, true);
      
      // 他のタググループも並行して最初のページをロード（パフォーマンス向上）
      const preloadPromises = groups.slice(1, Math.min(4, groups.length)).map(group => 
        loadArticlesForGroup(group.id, 1, true)
      );
      
      // 並行して実行（エラーは無視）
      Promise.allSettled(preloadPromises).catch(() => {
        console.log('[useTaggedArticles] 一部のタグの事前読み込みに失敗');
      });
    }
  }, [tags, loadArticlesForGroup, selectedFeedId]);

  // タグの読み込み
  useEffect(() => {
    loadTags();
  }, [loadTags]);

  // タグが変更されたら記事グループを再初期化
  useEffect(() => {
    // タグの読み込みが完了したら（空配列でも）記事グループを初期化
    if (!tagsLoading) {
      initializeArticleGroups();
    }
  }, [tags, initializeArticleGroups, tagsLoading]);

  // 検索条件が変更されたら全グループの記事をリセット
  useEffect(() => {
    if (articleGroups.length > 0) {
      // 現在表示中のグループのみリロード
      const currentGroup = articleGroups[currentGroupIndex];
      if (currentGroup) {
        loadArticlesForGroup(currentGroup.id, 1, true);
      }
    }
  }, [searchTerm, selectedFeedId]);

  // グループ変更時の記事読み込み
  const changeGroup = useCallback(async (index: number) => {
    console.log('[useTaggedArticles] changeGroup:', {
      index,
      currentGroupIndex,
      groupsLength: articleGroups.length,
      targetGroup: articleGroups[index]
    });
    
    setCurrentGroupIndex(index);
    const group = articleGroups[index];
    
    if (group && group.articles.length === 0 && !group.loading) {
      console.log('[useTaggedArticles] 記事を読み込み開始:', group.name, group.id);
      await loadArticlesForGroup(group.id, 1, true);
    } else {
      console.log('[useTaggedArticles] 記事読み込みスキップ:', {
        hasGroup: !!group,
        articlesLength: group?.articles.length || 0,
        loading: group?.loading
      });
    }
  }, [articleGroups, loadArticlesForGroup, currentGroupIndex]);

  // 追加読み込み
  const loadMoreArticles = useCallback(async () => {
    const currentGroup = articleGroups[currentGroupIndex];
    console.log('[useTaggedArticles] loadMoreArticles:', {
      currentGroupIndex,
      currentGroup: currentGroup ? {
        id: currentGroup.id,
        name: currentGroup.name,
        page: currentGroup.page,
        hasMore: currentGroup.hasMore,
        loading: currentGroup.loading,
        articlesLength: currentGroup.articles.length
      } : null
    });
    
    if (currentGroup && currentGroup.hasMore && !currentGroup.loading) {
      await loadArticlesForGroup(currentGroup.id, currentGroup.page, false);
    }
  }, [articleGroups, currentGroupIndex, loadArticlesForGroup]);

  // 記事の既読マーク
  const markArticleAsRead = useCallback(async (articleId: string) => {
    try {
      await sdk.articles.markRead(articleId);
      setArticleGroups(prev => 
        prev.map(group => ({
          ...group,
          articles: group.articles.map(article =>
            article.id === articleId
              ? { ...article, isRead: true, readAt: new Date().toISOString() }
              : article
          )
        }))
      );
    } catch (error) {
      console.error('既読マークエラー:', error);
    }
  }, []);

  // ブックマーク切り替え
  const toggleBookmark = useCallback(async (articleId: string, isBookmarked: boolean) => {
    try {
      if (isBookmarked) {
        await sdk.articles.unbookmark(articleId);
      } else {
        await sdk.articles.bookmark(articleId);
      }

      setArticleGroups(prev => 
        prev.map(group => ({
          ...group,
          articles: group.articles.map(article =>
            article.id === articleId
              ? {
                  ...article,
                  isBookmarked: !isBookmarked,
                  bookmarkedAt: !isBookmarked ? new Date().toISOString() : undefined,
                }
              : article
          )
        }))
      );
    } catch (error) {
      console.error('ブックマーク操作エラー:', error);
    }
  }, []);

  // 現在のタグ名を取得
  const currentTagName = articleGroups[currentGroupIndex]?.name || 'すべての記事';

  return {
    articleGroups,
    currentGroupIndex,
    currentTagName,
    tagsLoading,
    changeGroup,
    loadMoreArticles,
    markArticleAsRead,
    toggleBookmark,
    refresh: initializeArticleGroups,
  };
}