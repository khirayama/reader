import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import type { AppTabNavigationProp } from '../types/navigation';

const profileSchema = z.object({
  name: z.string().min(1, '名前を入力してください'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, '現在のパスワードを入力してください'),
  newPassword: z.string().min(6, '新しいパスワードは6文字以上で入力してください'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

interface ProfileScreenProps {
  navigation: AppTabNavigationProp;
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, updateProfile, changePassword, deleteAccount, logout } = useAuth();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const handleUpdateProfile = async (data: ProfileFormData) => {
    try {
      setIsUpdatingProfile(true);
      await updateProfile(data.name);
      Alert.alert('成功', 'プロフィールを更新しました。');
    } catch (error: unknown) {
      Alert.alert('エラー', error instanceof Error ? error.message : 'プロフィールの更新に失敗しました。');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (data: PasswordFormData) => {
    try {
      setIsChangingPassword(true);
      await changePassword(data.currentPassword, data.newPassword);
      passwordForm.reset();
      setShowPasswordForm(false);
      Alert.alert('成功', 'パスワードを変更しました。');
    } catch (error: unknown) {
      Alert.alert('エラー', error instanceof Error ? error.message : 'パスワードの変更に失敗しました。');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウント削除',
      'アカウントを削除すると、全てのデータが永久に失われます。この操作は取り消すことができません。本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              Alert.alert('完了', 'アカウントを削除しました。');
            } catch (error: unknown) {
              Alert.alert('エラー', 'アカウントの削除に失敗しました。');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>プロフィール設定</Text>
      </View>

      <Card>
        <Text style={styles.sectionTitle}>基本情報</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>メールアドレス</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>

        <Controller
          control={profileForm.control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="名前"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={profileForm.formState.errors.name?.message}
              required
            />
          )}
        />

        <Button
          title={isUpdatingProfile ? '更新中...' : 'プロフィール更新'}
          onPress={profileForm.handleSubmit(handleUpdateProfile)}
          disabled={isUpdatingProfile}
        />
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>パスワード変更</Text>
        
        {!showPasswordForm ? (
          <Button
            title="パスワードを変更"
            onPress={() => setShowPasswordForm(true)}
            variant="secondary"
          />
        ) : (
          <>
            <Controller
              control={passwordForm.control}
              name="currentPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="現在のパスワード"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={passwordForm.formState.errors.currentPassword?.message}
                  secureTextEntry
                  required
                />
              )}
            />

            <Controller
              control={passwordForm.control}
              name="newPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="新しいパスワード"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={passwordForm.formState.errors.newPassword?.message}
                  secureTextEntry
                  required
                />
              )}
            />

            <Controller
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="新しいパスワード確認"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  secureTextEntry
                  required
                />
              )}
            />

            <View style={styles.passwordActions}>
              <Button
                title="キャンセル"
                onPress={() => {
                  setShowPasswordForm(false);
                  passwordForm.reset();
                }}
                variant="secondary"
                style={styles.actionButton}
              />
              <Button
                title={isChangingPassword ? '変更中...' : 'パスワード変更'}
                onPress={passwordForm.handleSubmit(handleChangePassword)}
                disabled={isChangingPassword}
                style={styles.actionButton}
              />
            </View>
          </>
        )}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>アカウント管理</Text>
        
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>登録日</Text>
          <Text style={styles.infoValue}>
            {user?.createdAt && new Date(user.createdAt).toLocaleDateString('ja-JP')}
          </Text>
        </View>

        <Button
          title="アカウント削除"
          onPress={handleDeleteAccount}
          variant="danger"
          style={styles.deleteButton}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  header: {
    paddingTop: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#6B7280',
  },
  passwordActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  deleteButton: {
    marginTop: 16,
  },
});