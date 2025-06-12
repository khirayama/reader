import { useState, useEffect, useCallback } from 'react'
import { sdk } from '../lib/sdk'
import type { Article, Tag } from '../lib/sdk'

export interface TaggedArticleGroup {
  id: string
  name: string
  color?: string
  articles: Article[]
  loading: boolean
  hasMore: boolean
  page: number
}

interface UseTaggedArticlesOptions {
  searchTerm?: string
  selectedFeedId?: string | null
}

export function useTaggedArticles({ searchTerm, selectedFeedId }: UseTaggedArticlesOptions = {}) {
  const [tags, setTags] = useState<Tag[]>([])
  const [articleGroups, setArticleGroups] = useState<TaggedArticleGroup[]>([])
  const [tagsLoading, setTagsLoading] = useState(false)
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)

  // タグ一覧の読み込み
  const loadTags = useCallback(async () => {
    try {
      setTagsLoading(true)
      const response = await sdk.tags.getTags({ limit: 50 })
      setTags(response.data.tags)
    } catch (error) {
      console.error('タグ読み込みエラー:', error)
    } finally {
      setTagsLoading(false)
    }
  }, [])

  // 特定のタググループの記事を読み込み
  const loadArticlesForGroup = useCallback(async (groupId: string, page = 1, reset = false) => {
    try {
      // デバッグログ
      console.log(`[loadArticlesForGroup] グループ: ${groupId}, ページ: ${page}, リセット: ${reset}`)
      
      setArticleGroups(prev => 
        prev.map(group => 
          group.id === groupId 
            ? { ...group, loading: true }
            : group
        )
      )

      const params: {
        page: number
        limit: number
        feedId?: string | null
        tagId?: string
        search?: string
      } = {
        page,
        limit: 20,
      }

      if (selectedFeedId) {
        params.feedId = selectedFeedId
      }

      if (groupId !== '__all__') {
        params.tagId = groupId
      }

      if (searchTerm) {
        params.search = searchTerm
      }

      const response = await sdk.articles.getAll(params)

      setArticleGroups(prev => 
        prev.map(group => {
          if (group.id === groupId) {
            const newPage = reset ? 2 : Math.min(page + 1, 10) // ページ上限を10に制限
            console.log(`[loadArticlesForGroup] 更新後ページ: ${newPage}, 記事数: ${reset ? response.articles.length : group.articles.length + response.articles.length}`)
            return {
              ...group,
              articles: reset ? response.articles : [...group.articles, ...response.articles],
              hasMore: response.articles.length === 20 && newPage <= 10,
              page: newPage,
              loading: false
            }
          }
          return group
        })
      )
    } catch (error) {
      console.error('記事読み込みエラー:', error)
      setArticleGroups(prev => 
        prev.map(group => 
          group.id === groupId 
            ? { ...group, loading: false }
            : group
        )
      )
    }
  }, [selectedFeedId, searchTerm])

  // 記事グループの初期化（グループ作成のみ）
  const initializeArticleGroups = useCallback(() => {
    // 「全ての記事」グループを最初に追加
    const allGroup: TaggedArticleGroup = {
      id: '__all__',
      name: 'すべての記事',
      articles: [],
      loading: false,
      hasMore: true,
      page: 1
    }

    // タグベースのグループを追加
    const tagGroups: TaggedArticleGroup[] = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      articles: [],
      loading: false,
      hasMore: true,
      page: 1
    }))

    const groups = [allGroup, ...tagGroups]
    setArticleGroups(groups)
    
    // 初期記事読み込みは遅延実行
    setTimeout(() => {
      if (groups.length > 0) {
        loadArticlesForGroup(groups[0].id, 1, true)
      }
    }, 50)
  }, [tags])

  // タグの読み込み
  useEffect(() => {
    loadTags()
  }, [loadTags])

  // タグが変更されたら記事グループを再初期化
  useEffect(() => {
    if (tags.length > 0) {
      initializeArticleGroups()
    }
  }, [tags, initializeArticleGroups])

  // 検索条件が変更されたら現在のグループの記事をリセット
  useEffect(() => {
    if (articleGroups.length > 0) {
      // 現在表示中のグループの記事をクリアしてページをリセット
      setArticleGroups(prev => 
        prev.map(group => 
          group.id === prev[currentGroupIndex]?.id
            ? { ...group, articles: [], page: 1, hasMore: true, loading: false }
            : group
        )
      )
      
      // 遅延実行で記事を再読み込み（状態更新完了後）
      const timeoutId = setTimeout(() => {
        const currentGroup = articleGroups[currentGroupIndex]
        if (currentGroup) {
          loadArticlesForGroup(currentGroup.id, 1, true)
        }
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, selectedFeedId])

  // グループ変更時の記事読み込み
  const changeGroup = useCallback(async (index: number) => {
    console.log(`[changeGroup] グループ変更: インデックス ${index}`)
    setCurrentGroupIndex(index)
    
    // 遅延実行で記事読み込み（状態更新完了後）
    setTimeout(() => {
      setArticleGroups(prev => {
        const group = prev[index]
        if (group && group.articles.length === 0 && !group.loading) {
          loadArticlesForGroup(group.id, 1, true)
        }
        return prev
      })
    }, 10)
  }, [])

  // 追加読み込み
  const loadMoreArticles = useCallback(async () => {
    const currentGroup = articleGroups[currentGroupIndex]
    if (currentGroup && currentGroup.hasMore && !currentGroup.loading && currentGroup.page <= 10) {
      console.log(`[loadMoreArticles] 追加読み込み実行: グループ ${currentGroup.id}, ページ ${currentGroup.page}`)
      await loadArticlesForGroup(currentGroup.id, currentGroup.page, false)
    } else if (currentGroup?.page > 10) {
      console.log(`[loadMoreArticles] ページ制限に達しました: ${currentGroup.page}`)
    }
  }, [articleGroups, currentGroupIndex, loadArticlesForGroup])

  // 記事の既読マーク
  const markArticleAsRead = useCallback(async (articleId: string) => {
    try {
      await sdk.articles.markAsRead(articleId)
      setArticleGroups(prev => 
        prev.map(group => ({
          ...group,
          articles: group.articles.map(article =>
            article.id === articleId
              ? { ...article, isRead: true, readAt: new Date().toISOString() }
              : article
          )
        }))
      )
    } catch (error) {
      console.error('既読マークエラー:', error)
    }
  }, [])

  // ブックマーク切り替え
  const toggleBookmark = useCallback(async (articleId: string, isBookmarked: boolean) => {
    try {
      if (isBookmarked) {
        await sdk.articles.removeBookmark(articleId)
      } else {
        await sdk.articles.addBookmark(articleId)
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
      )
    } catch (error) {
      console.error('ブックマーク操作エラー:', error)
    }
  }, [])

  return {
    articleGroups,
    currentGroupIndex,
    tagsLoading,
    changeGroup,
    loadMoreArticles,
    markArticleAsRead,
    toggleBookmark,
    refresh: initializeArticleGroups,
  }
}