'use client';

import React, { useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { FeedSidebar } from '@/components/feeds/FeedSidebar';
import { ArticleList } from '@/components/feeds/ArticleList';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [selectedFeedId, setSelectedFeedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFeedSelect = (feedId: string | null) => {
    setSelectedFeedId(feedId);
  };

  const handleFeedRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                RSS Reader
              </h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {user?.email}
                </span>
                <Button variant="outline" onClick={logout}>
                  ログアウト
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex h-screen">
          <FeedSidebar
            selectedFeedId={selectedFeedId || undefined}
            onFeedSelect={handleFeedSelect}
            onFeedRefresh={handleFeedRefresh}
          />
          <ArticleList 
            key={`${selectedFeedId}-${refreshKey}`}
            selectedFeedId={selectedFeedId || undefined}
          />
        </div>
      </div>
    </AuthGuard>
  );
}