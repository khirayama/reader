'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import type { RateLimitError, ExtendedError } from '@/lib/rss-sdk'

interface UseApiCallOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  successMessage?: string
  loadingMessage?: string
}

/**
 * API呼び出しの状態管理とレート制限対応を提供するフック
 */
export function useApiCall<T extends unknown[], R>(
  apiFunction: (...args: T) => Promise<R>,
  options: UseApiCallOptions<R> = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitError | null>(null)
  const { addToast } = useToast()

  const execute = async (...args: T): Promise<R | undefined> => {
    if (isLoading || isRateLimited) {
      return undefined
    }

    setIsLoading(true)
    setIsRateLimited(false)
    setRateLimitInfo(null)

    try {
      const result = await apiFunction(...args)
      
      if (options.successMessage) {
        addToast({
          type: 'success',
          title: options.successMessage,
        })
      }
      
      options.onSuccess?.(result)
      return result
    } catch (error) {
      console.error('API呼び出しエラー:', error)
      
      // レート制限エラーの場合
      if (error instanceof Error && 'rateLimitInfo' in error) {
        const extendedError = error as ExtendedError
        if (extendedError.rateLimitInfo) {
          setIsRateLimited(true)
          setRateLimitInfo(extendedError.rateLimitInfo)
        
          // レート制限解除のタイマーを設定
          const resetTime = extendedError.rateLimitInfo.retryAfter * 1000
          setTimeout(() => {
            setIsRateLimited(false)
            setRateLimitInfo(null)
          }, resetTime)
        }
        
        // 専用のレート制限通知は表示しない（SDK側で自動処理）
      } else {
        // その他のエラー
        addToast({
          type: 'error',
          title: 'エラーが発生しました',
          message: error instanceof Error ? error.message : '不明なエラー',
        })
      }
      
      options.onError?.(error instanceof Error ? error : new Error('Unknown error'))
      return undefined
    } finally {
      setIsLoading(false)
    }
  }

  const canExecute = !isLoading && !isRateLimited

  return {
    execute,
    isLoading,
    isRateLimited,
    rateLimitInfo,
    canExecute,
  }
}