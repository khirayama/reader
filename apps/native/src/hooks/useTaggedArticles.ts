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
  const [tagsLoading, setTagsLoading] = useState(true)
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)
  const [initialized, setInitialized] = useState(false)

  // タグ一覧の読み込み
  const loadTags = useCallback(async () => {
    try {
      setTagsLoading(true)
      console.log('[loadTags] タグ読み込み開始')
      const response = await sdk.tags.getTags({ limit: 50 })
      console.log('[loadTags] タグ読み込み完了:', response.data.tags.length, '件')
      setTags(response.data.tags)
    } catch (error) {
      console.error('タグ読み込みエラー:', error)
      // タグ読み込み失敗時も空配列で初期化を継続
      setTags([])
    } finally {
      setTagsLoading(false)
    }
  }, [])

  // 特定のタググループの記事を読み込み
  const loadArticlesForGroup = useCallback(async (groupId: string, page = 1, reset = false) => {
    try {
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

      console.log('[loadArticlesForGroup] APIコール開始:', params)
      const response = await sdk.articles.getAll(params)
      console.log(`[loadArticlesForGroup] APIコール完了: ${response.articles.length}件取得`)

      setArticleGroups(prev => 
        prev.map(group => {
          if (group.id === groupId) {
            const newPage = reset ? 2 : Math.min(page + 1, 10)
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

  // 記事グループの初期化
  const initializeArticleGroups = useCallback(() => {
    console.log('[initializeArticleGroups] 記事グループを初期化中...')
    
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
    console.log(`[initializeArticleGroups] ${groups.length}個のグループを作成`)
    setArticleGroups(groups)
    setInitialized(true)
  }, [tags])

  // 初期データ読み込み
  const loadInitialData = useCallback(async () => {
    if (initialized && articleGroups.length > 0) {
      const firstGroup = articleGroups[0]
      if (firstGroup.articles.length === 0 && !firstGroup.loading) {
        console.log('[loadInitialData] 初期記事データを読み込み開始')
        await loadArticlesForGroup(firstGroup.id, 1, true)
      }
    }
  }, [initialized, articleGroups.length, articleGroups[0]?.articles?.length, articleGroups[0]?.loading])

  // グループ変更時の記事読み込み
  const changeGroup = useCallback(async (index: number) => {
    console.log(`[changeGroup] グループ変更: インデックス ${index}`)
    setCurrentGroupIndex(index)
    
    if (articleGroups[index]) {
      const targetGroup = articleGroups[index]
      if (targetGroup.articles.length === 0 && !targetGroup.loading) {
        console.log(`[changeGroup] グループ ${targetGroup.name} の記事を読み込み`)
        await loadArticlesForGroup(targetGroup.id, 1, true)
      }
    }
  }, [articleGroups])

  // 追加読み込み
  const loadMoreArticles = useCallback(async () => {
    const currentGroup = articleGroups[currentGroupIndex]
    if (currentGroup && currentGroup.hasMore && !currentGroup.loading && currentGroup.page <= 10) {
      console.log(`[loadMoreArticles] 追加読み込み実行: グループ ${currentGroup.id}, ページ ${currentGroup.page}`)
      await loadArticlesForGroup(currentGroup.id, currentGroup.page, false)
    }
  }, [articleGroups, currentGroupIndex])

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

  // 検索・フィルタ条件変更時のリセット
  const refreshCurrentGroup = useCallback(async () => {
    if (articleGroups.length > 0 && currentGroupIndex >= 0) {
      const currentGroup = articleGroups[currentGroupIndex]
      if (currentGroup) {
        console.log('[refreshCurrentGroup] 現在のグループを再読み込み:', currentGroup.name)
        setArticleGroups(prev => 
          prev.map(group => 
            group.id === currentGroup.id
              ? { ...group, articles: [], page: 1, hasMore: true, loading: false }
              : group
          )
        )
        // 少し遅延させてから記事読み込み
        setTimeout(() => {
          loadArticlesForGroup(currentGroup.id, 1, true)
        }, 100)
      }
    }
  }, [articleGroups, currentGroupIndex, loadArticlesForGroup])

  // タグ読み込み
  useEffect(() => {
    console.log('[useEffect] タグ読み込み開始')
    loadTags()
  }, [loadTags])

  // タグ読み込み完了後のグループ初期化
  useEffect(() => {
    if (!tagsLoading) {
      console.log(`[useEffect] タグ読み込み完了、グループ初期化開始（タグ数: ${tags.length}）`)
      initializeArticleGroups()
    }
  }, [tagsLoading, tags.length])

  // 初期記事データ読み込み
  useEffect(() => {
    if (initialized && articleGroups.length > 0) {
      const firstGroup = articleGroups[0]
      if (firstGroup && firstGroup.articles.length === 0 && !firstGroup.loading) {
        console.log('[useEffect] 初期記事データを読み込み開始')
        loadArticlesForGroup(firstGroup.id, 1, true)
      }
    }
  }, [initialized, articleGroups.length])

  // 検索・フィルタ条件変更時の処理
  useEffect(() => {
    if (initialized && articleGroups.length > 0) {
      console.log('[useEffect] 検索・フィルタ条件変更検出、現在のグループをリセット')
      const currentGroup = articleGroups[currentGroupIndex]
      if (currentGroup) {
        // 現在のグループの記事をクリア
        setArticleGroups(prev => 
          prev.map(group => 
            group.id === currentGroup.id
              ? { ...group, articles: [], page: 1, hasMore: true, loading: false }
              : group
          )
        )
        
        // 少し遅延してから記事を再読み込み
        setTimeout(() => {
          loadArticlesForGroup(currentGroup.id, 1, true)
        }, 100)
      }
    }
  }, [searchTerm, selectedFeedId])

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