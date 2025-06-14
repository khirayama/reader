import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { sdk } from '../../lib/sdk';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Tag {
  id: string;
  name: string;
  color?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  feedCount?: number;
}

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
  tags?: Tag[];
  articleCount?: number;
}

interface FeedTagManagerProps {
  feed: Feed;
  isVisible: boolean;
  onClose: () => void;
  onTagsUpdated: () => void;
}

export function FeedTagManager({
  feed,
  isVisible,
  onClose,
  onTagsUpdated,
}: FeedTagManagerProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [feedTags, setFeedTags] = useState<Tag[]>(feed.tags || []);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

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
    if (isVisible) {
      loadAvailableTags();
      setFeedTags(feed.tags || []);
    }
  }, [isVisible, feed.tags]);

  const loadAvailableTags = async () => {
    try {
      setLoading(true);
      const response = await sdk.tags.getTags();
      setAvailableTags(response.data.tags);
    } catch (error) {
      console.error('タグ読み込みエラー:', error);
      Alert.alert('エラー', 'タグの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('エラー', 'タグ名を入力してください。');
      return;
    }

    try {
      setIsCreatingTag(true);
      const response = await sdk.tags.createTag({
        name: newTagName.trim(),
        color: newTagColor,
      }) as { success: boolean; data: { tag: any } };

      const createdTag = response.data.tag;
      setAvailableTags((prev) => [...prev, createdTag]);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setShowCreateForm(false);

      Alert.alert('タグ作成完了', `「${createdTag.name}」タグを作成しました。`);
    } catch (error) {
      Alert.alert('タグ作成エラー', 'タグの作成に失敗しました。');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleToggleTag = async (tag: Tag) => {
    const isAssigned = feedTags.some((t) => t.id === tag.id);

    try {
      setIsUpdating(true);

      if (isAssigned) {
        // タグを削除
        await sdk.feeds.removeTagFromFeed(feed.id, tag.id);
        setFeedTags((prev) => prev.filter((t) => t.id !== tag.id));

        Alert.alert('タグ削除完了', `「${tag.name}」タグを削除しました。`);
      } else {
        // タグを追加
        await sdk.feeds.assignTagToFeed(feed.id, { tagId: tag.id });
        setFeedTags((prev) => [...prev, tag]);

        Alert.alert('タグ追加完了', `「${tag.name}」タグを追加しました。`);
      }

      onTagsUpdated();
    } catch (error) {
      Alert.alert(
        'エラー',
        isAssigned
          ? 'タグの削除に失敗しました。'
          : 'タグの追加に失敗しました。'
      );
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

  return (
    <Modal visible={isVisible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>タグ管理</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>閉じる</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>{feed.title}</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* 新しいタグ作成 */}
          <View style={styles.section}>
            {!showCreateForm ? (
              <Button
                title="新しいタグを作成"
                onPress={() => setShowCreateForm(true)}
                variant="outline"
                style={styles.createButton}
              />
            ) : (
              <View style={styles.createForm}>
                <Text style={styles.sectionTitle}>新しいタグを作成</Text>

                <Input
                  value={newTagName}
                  onChangeText={setNewTagName}
                  placeholder="タグ名"
                  style={styles.input}
                />

                {/* カラーピッカー */}
                <Text style={styles.colorLabel}>タグの色</Text>
                <View style={styles.colorPicker}>
                  {colors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setNewTagColor(color)}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newTagColor === color && styles.selectedColor,
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.createFormButtons}>
                  <Button
                    title={isCreatingTag ? '作成中...' : '保存'}
                    onPress={handleCreateTag}
                    disabled={isCreatingTag || !newTagName.trim()}
                    style={styles.saveButton}
                  />
                  <Button
                    title="キャンセル"
                    onPress={() => {
                      setShowCreateForm(false);
                      setNewTagName('');
                      setNewTagColor('#3B82F6');
                    }}
                    variant="outline"
                    style={styles.cancelButton}
                  />
                </View>
              </View>
            )}
          </View>

          {/* 既存タグ一覧 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>利用可能なタグ</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>読み込み中...</Text>
              </View>
            ) : availableTags.length === 0 ? (
              <Text style={styles.emptyText}>タグがありません</Text>
            ) : (
              <View style={styles.tagsList}>
                {availableTags.map((tag) => {
                  const isAssigned = feedTags.some((t) => t.id === tag.id);
                  return (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.tagItem,
                        isAssigned && styles.assignedTag,
                      ]}
                      onPress={() => handleToggleTag(tag)}
                      disabled={isUpdating}
                    >
                      <View style={styles.tagContent}>
                        <View
                          style={[
                            styles.tagColorDot,
                            { backgroundColor: tag.color || '#6B7280' },
                          ]}
                        />
                        <Text style={styles.tagName}>{tag.name}</Text>
                        {tag.feedCount !== undefined && (
                          <Text style={styles.tagCount}>({tag.feedCount})</Text>
                        )}
                      </View>
                      {isAssigned && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  createButton: {
    marginBottom: 8,
  },
  createForm: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    marginBottom: 16,
  },
  colorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedColor: {
    borderColor: '#374151',
    transform: [{ scale: 1.1 }],
  },
  createFormButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    flex: 1,
  },
  cancelButton: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    paddingVertical: 20,
  },
  tagsList: {
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  assignedTag: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF5FF',
  },
  tagContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tagColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  tagName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  tagCount: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  checkmark: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
});