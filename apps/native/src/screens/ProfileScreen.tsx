import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { OpmlManager } from '../components/feeds/OpmlManager';
import { sdk } from '../lib/sdk';
import { colors, shadows } from '../constants/colors';
import { spacing, fontSize } from '../constants/spacing';
import type { AppDrawerNavigationProp as DrawerNavigationProp } from '../types/navigation';

type Theme = 'SYSTEM' | 'LIGHT' | 'DARK';
type Language = 'ja' | 'en' | 'zh' | 'es';

interface ProfileScreenProps {
  navigation: DrawerNavigationProp;
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, updateSettings: updateUserSettings, changeEmail: changeUserEmail, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // テーマ設定の状態
  const [theme, setTheme] = useState<Theme>(user?.theme || 'SYSTEM');

  // 言語設定の状態
  const [language, setLanguage] = useState<Language>(() => {
    const userLang = user?.language;
    if (userLang === 'JA') return 'ja';
    if (userLang === 'EN') return 'en';
    if (userLang && ['ja', 'en', 'zh', 'es'].includes(userLang)) {
      return userLang as Language;
    }
    return 'ja';
  });

  // パスワード変更の状態
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // メールアドレス変更の状態
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  // アカウント削除の状態
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user?.theme) setTheme(user.theme);
    if (user?.language) {
      const userLang = user.language;
      if (userLang === 'JA') setLanguage('ja');
      else if (userLang === 'EN') setLanguage('en');
      else if (['ja', 'en', 'zh', 'es'].includes(userLang)) {
        setLanguage(userLang as Language);
      }
    }
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    // ここで必要に応じてユーザー情報を再取得
    setRefreshing(false);
  };

  // テーマと言語設定の更新
  const handleUpdateSettings = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const apiLanguage = language === 'ja' ? 'JA' : language === 'en' ? 'EN' : 'JA';
      await updateUserSettings(theme, apiLanguage);
      Alert.alert('成功', '設定を更新しました');
    } catch (err: any) {
      Alert.alert('エラー', err.message || '設定の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // パスワード変更
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('エラー', 'すべての項目を入力してください');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('エラー', 'パスワードは8文字以上で入力してください');
      return;
    }

    setLoading(true);

    try {
      await sdk.auth.changePassword({ currentPassword, newPassword });
      Alert.alert('成功', 'パスワードを変更しました');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Alert.alert('エラー', err.message || 'パスワードの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // メールアドレス変更
  const handleChangeEmail = async () => {
    if (!newEmail || !emailPassword) {
      Alert.alert('エラー', 'すべての項目を入力してください');
      return;
    }

    setLoading(true);

    try {
      await changeUserEmail(newEmail, emailPassword);
      Alert.alert('成功', 'メールアドレスを変更しました');
      setNewEmail('');
      setEmailPassword('');
    } catch (err: any) {
      Alert.alert('エラー', err.message || 'メールアドレスの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // アカウント削除
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      Alert.alert('エラー', 'パスワードを入力してください');
      return;
    }

    setLoading(true);

    try {
      await sdk.auth.deleteAccount({ password: deletePassword });
      logout();
    } catch (err: any) {
      Alert.alert('エラー', err.message || 'アカウントの削除に失敗しました');
      setShowDeleteConfirm(false);
      setDeletePassword('');
    } finally {
      setLoading(false);
    }
  };

  const getThemeLabel = (themeValue: Theme) => {
    switch (themeValue) {
      case 'SYSTEM': return 'システム';
      case 'LIGHT': return 'ライト';
      case 'DARK': return 'ダーク';
      default: return 'システム';
    }
  };

  const getLanguageLabel = (langValue: Language) => {
    switch (langValue) {
      case 'ja': return '日本語';
      case 'en': return 'English';
      case 'zh': return '中文';
      case 'es': return 'Español';
      default: return '日本語';
    }
  };

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            {/* ドロワーオープンボタン */}
            <TouchableOpacity
              style={styles.drawerButton}
              onPress={() => navigation?.openDrawer()}
            >
              <Text style={styles.drawerButtonText}>☰</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>設定</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
      {/* 一般設定 */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>一般設定</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>テーマ</Text>
          <View style={styles.optionContainer}>
            {(['SYSTEM', 'LIGHT', 'DARK'] as Theme[]).map((themeOption) => (
              <TouchableOpacity
                key={themeOption}
                style={[
                  styles.optionButton,
                  theme === themeOption && styles.optionButtonActive
                ]}
                onPress={() => setTheme(themeOption)}
              >
                <Text style={[
                  styles.optionButtonText,
                  theme === themeOption && styles.optionButtonTextActive
                ]}>
                  {getThemeLabel(themeOption)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>言語</Text>
          <View style={styles.optionContainer}>
            {(['ja', 'en', 'zh', 'es'] as Language[]).map((langOption) => (
              <TouchableOpacity
                key={langOption}
                style={[
                  styles.optionButton,
                  language === langOption && styles.optionButtonActive
                ]}
                onPress={() => setLanguage(langOption)}
              >
                <Text style={[
                  styles.optionButtonText,
                  language === langOption && styles.optionButtonTextActive
                ]}>
                  {getLanguageLabel(langOption)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          title="設定を保存"
          onPress={handleUpdateSettings}
          disabled={loading}
          loading={loading}
          fullWidth
        />
      </Card>

      {/* パスワード変更 */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>パスワード変更</Text>
        
        <View style={styles.formContainer}>
          <Input
            label="現在のパスワード"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            placeholder="現在のパスワードを入力"
          />
          <Input
            label="新しいパスワード"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="8文字以上で入力"
            helperText="8文字以上、大文字・小文字・数字を含む"
          />
          <Input
            label="新しいパスワード確認"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="新しいパスワードを再入力"
          />
          <Button
            title="パスワード変更"
            onPress={handleChangePassword}
            disabled={loading}
            loading={loading}
            fullWidth
          />
        </View>
      </Card>

      {/* メールアドレス変更 */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>メールアドレス変更</Text>
        
        <View style={styles.currentInfo}>
          <Text style={styles.currentLabel}>現在のメールアドレス:</Text>
          <Text style={styles.currentValue}>{user?.email}</Text>
        </View>

        <View style={styles.formContainer}>
          <Input
            label="新しいメールアドレス"
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="新しいメールアドレスを入力"
          />
          <Input
            label="パスワード"
            value={emailPassword}
            onChangeText={setEmailPassword}
            secureTextEntry
            placeholder="現在のパスワードを入力"
          />
          <Button
            title="メールアドレス変更"
            onPress={handleChangeEmail}
            disabled={loading}
            loading={loading}
            fullWidth
          />
        </View>
      </Card>

      {/* データ管理 */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>データ管理</Text>
        <Text style={styles.description}>
          フィードリストをOPMLファイルでインポート・エクスポートできます
        </Text>
        <OpmlManager />
      </Card>

      {/* セッション管理 */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>セッション管理</Text>
        <Text style={styles.description}>
          アカウントからログアウトします。再度ログインするまでアプリを使用できません。
        </Text>
        <Button
          title="ログアウト"
          variant="outline"
          onPress={() => {
            Alert.alert(
              'ログアウト確認',
              'ログアウトしますか？',
              [
                {
                  text: 'キャンセル',
                  style: 'cancel',
                },
                {
                  text: 'ログアウト',
                  style: 'destructive',
                  onPress: logout,
                },
              ]
            );
          }}
          fullWidth
        />
      </Card>

      {/* アカウント削除 */}
      <Card style={StyleSheet.flatten([styles.card, styles.dangerCard])}>
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>アカウント削除</Text>
        <Text style={styles.dangerDescription}>
          アカウントを削除すると、すべてのデータが永久に失われます。この操作は取り消すことができません。
        </Text>
        
        {!showDeleteConfirm ? (
          <Button
            title="アカウント削除"
            variant="danger"
            onPress={() => setShowDeleteConfirm(true)}
            fullWidth
          />
        ) : (
          <View style={styles.deleteConfirmContainer}>
            <Text style={styles.confirmText}>
              本当にアカウントを削除しますか？
            </Text>
            <Input
              label="パスワード"
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              placeholder="削除の確認のためパスワードを入力"
            />
            <View style={styles.deleteActions}>
              <Button
                title="削除"
                variant="danger"
                onPress={handleDeleteAccount}
                disabled={loading || !deletePassword}
                loading={loading}
                style={styles.deleteActionButton}
              />
              <Button
                title="キャンセル"
                variant="outline"
                onPress={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                }}
                style={styles.deleteActionButton}
              />
            </View>
          </View>
        )}
      </Card>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    ...shadows.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drawerButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: 6,
    backgroundColor: colors.gray[100],
  },
  drawerButtonText: {
    fontSize: 18,
    color: colors.gray[600],
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.gray[900],
    marginBottom: spacing.md,
  },
  settingItem: {
    marginBottom: spacing.lg,
  },
  settingLabel: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
    marginBottom: spacing.sm,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    alignItems: 'center',
    minWidth: 80,
  },
  optionButtonActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  optionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.gray[700],
  },
  optionButtonTextActive: {
    color: colors.white,
  },
  formContainer: {
    gap: spacing.md,
  },
  currentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[50],
    borderRadius: 6,
  },
  currentLabel: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginRight: spacing.sm,
  },
  currentValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.gray[900],
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    lineHeight: fontSize.sm * 1.5,
  },
  dangerCard: {
    borderColor: colors.red[200],
    borderWidth: 1,
  },
  dangerTitle: {
    color: colors.red[600],
  },
  dangerDescription: {
    fontSize: fontSize.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
    lineHeight: fontSize.sm * 1.5,
  },
  deleteConfirmContainer: {
    gap: spacing.md,
  },
  confirmText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.red[600],
    textAlign: 'center',
  },
  deleteActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  deleteActionButton: {
    flex: 1,
  },
});