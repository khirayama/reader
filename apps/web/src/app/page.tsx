'use client'

import React from 'react'
import Link from 'next/link'
import { GuestGuard } from '@/components/auth/GuestGuard'
import { Button } from '@/components/ui/Button'

export default function HomePage() {
  return (
    <GuestGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">RSS Reader</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              現代的なRSSフィードリーダー
              <br />
              お気に入りのサイトの最新情報を
              <br />
              ひとつの場所でチェック
            </p>

            {/* CTA Buttons */}
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  新規登録
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  ログイン
                </Button>
              </Link>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V2a1 1 0 011 1v8a1 1 0 01-1 1H8a1 1 0 01-1-1V3a1 1 0 011-1zm0 0h3.5M7 4H3.5"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">簡単管理</h3>
              <p className="text-gray-600 dark:text-gray-300">
                RSSフィードの追加・削除が簡単。直感的なインターフェースでストレスフリー
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">高速検索</h3>
              <p className="text-gray-600 dark:text-gray-300">
                記事の全文検索機能で、過去の記事もすぐに見つけられます
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                お気に入り
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                気になる記事をお気に入りに保存して後でゆっくり読める
              </p>
            </div>
          </div>
        </div>
      </div>
    </GuestGuard>
  )
}
