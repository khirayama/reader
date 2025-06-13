'use client'

import { useEffect } from 'react'
import { useToast } from './Toast'

// レート制限イベントのハンドラー
export function RateLimitHandler() {
  const { addToast } = useToast()

  useEffect(() => {
    const handleRateLimit = (event: CustomEvent) => {
      const { 
        error, 
        details, 
        attempt, 
        maxRetries, 
        retryIn, 
        rateLimitType 
      } = event.detail

      // レート制限の種類に応じたメッセージをカスタマイズ
      const getTypeMessage = (type: string) => {
        switch (type) {
          case 'auth':
            return 'ログイン試行回数が制限されました'
          case 'feedUpdate':
            return 'フィード更新回数が制限されました'
          case 'article':
            return '記事操作回数が制限されました'
          case 'opml':
            return 'OPML操作回数が制限されました'
          default:
            return 'APIリクエスト数が制限されました'
        }
      }

      addToast({
        type: 'rateLimit',
        title: getTypeMessage(rateLimitType),
        message: `${details} (${attempt}/${maxRetries + 1}回目の試行)`,
        duration: retryIn * 1000 + 2000, // リトライ時間 + 余裕
        retryIn,
        countdown: retryIn,
        showRetryButton: false, // 自動リトライのため手動リトライは無効
      })
    }

    // カスタムイベントリスナーを追加
    window.addEventListener('rateLimit', handleRateLimit as EventListener)

    return () => {
      window.removeEventListener('rateLimit', handleRateLimit as EventListener)
    }
  }, [addToast])

  return null // このコンポーネントは何もレンダリングしない
}