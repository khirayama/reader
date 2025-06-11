'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { sdk } from '@/lib/sdk';
import type { Tag, Feed } from '@/lib/rss-sdk';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

interface FeedTagManagerProps {
  feed: Feed;
  isOpen: boolean;
  onClose: () => void;
  onTagsUpdated: () => void;
}

export function FeedTagManager({ feed, isOpen, onClose, onTagsUpdated }: FeedTagManagerProps) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [feedTags, setFeedTags] = useState<Tag[]>(feed.tags || []);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

  useEffect(() => {
    if (isOpen) {
      loadAvailableTags();
      setFeedTags(feed.tags || []);
    }
  }, [isOpen, feed.tags]);

  const loadAvailableTags = async () => {
    try {
      const response = await sdk.tags.getTags();
      setAvailableTags(response.data.tags);
    } catch (error) {
      console.error('タグ読み込みエラー:', error);
      addToast({
        type: 'error',
        title: 'エラー',
        message: 'タグの読み込みに失敗しました。'
      });
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      addToast({
        type: 'error',
        title: 'エラー',
        message: 'タグ名を入力してください。'
      });
      return;
    }

    try {
      setIsCreatingTag(true);
      const response = await sdk.tags.createTag({
        name: newTagName.trim(),
        color: newTagColor
      });
      
      const createdTag = response.data.tag;
      setAvailableTags(prev => [...prev, createdTag]);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setShowCreateForm(false);
      
      addToast({
        type: 'success',
        title: 'タグ作成完了',
        message: `「${createdTag.name}」タグを作成しました。`
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'タグ作成エラー',
        message: 'タグの作成に失敗しました。'
      });
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleToggleTag = async (tag: Tag) => {
    const isAssigned = feedTags.some(t => t.id === tag.id);
    
    try {
      setIsUpdating(true);
      
      if (isAssigned) {
        // タグを削除
        await sdk.feeds.removeTagFromFeed(feed.id, tag.id);
        setFeedTags(prev => prev.filter(t => t.id !== tag.id));
        
        addToast({
          type: 'success',
          title: 'タグ削除完了',
          message: `「${tag.name}」タグを削除しました。`
        });
      } else {
        // タグを追加
        await sdk.feeds.assignTagToFeed(feed.id, { tagId: tag.id });
        setFeedTags(prev => [...prev, tag]);
        
        addToast({
          type: 'success',
          title: 'タグ追加完了',
          message: `「${tag.name}」タグを追加しました。`
        });
      }
      
      onTagsUpdated();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'エラー',
        message: isAssigned ? 'タグの削除に失敗しました。' : 'タグの追加に失敗しました。'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setNewTagName('');
    setNewTagColor('#3B82F6');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('tags.manageTags')}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {feed.title}
          </p>
        </div>

        {/* コンテンツ */}
        <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
          {/* 新しいタグ作成 */}
          <div className="mb-6">
            {!showCreateForm ? (
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="outline"
                size="sm"
                className="w-full"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
              >
                {t('tags.createTag')}
              </Button>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                  {t('tags.createTag')}
                </h3>
                <div className="space-y-3">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder={t('tags.tagName')}
                    disabled={isCreatingTag}
                  />
                  
                  {/* カラーピッカー */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('tags.tagColor')}
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setNewTagColor(color)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            newTagColor === color
                              ? 'border-gray-400 scale-110'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCreateTag}
                      disabled={isCreatingTag || !newTagName.trim()}
                      loading={isCreatingTag}
                      size="sm"
                    >
                      {t('common.save')}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewTagName('');
                        setNewTagColor('#3B82F6');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 既存タグ一覧 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              {t('tags.availableTags')}
            </h3>
            {availableTags.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {t('tags.noTags')}
              </p>
            ) : (
              <div className="space-y-2">
                {availableTags.map((tag) => {
                  const isAssigned = feedTags.some(t => t.id === tag.id);
                  return (
                    <div
                      key={tag.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isAssigned
                          ? 'border-primary-200 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      }`}
                      onClick={() => handleToggleTag(tag)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: tag.color || '#6B7280' }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {tag.name}
                        </span>
                        {tag.feedCount !== undefined && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ({tag.feedCount})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center">
                        {isAssigned && (
                          <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full"
          >
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}