import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import type { AuthNavigationProp } from '../../types/navigation';

const forgotPasswordSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

interface ForgotPasswordScreenProps {
  navigation: AuthNavigationProp;
}

export function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const { forgotPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      await forgotPassword(data.email);
      setIsSubmitted(true);
      Alert.alert(
        'メール送信完了',
        'パスワードリセット用のメールを送信しました。メールをご確認ください。',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'メール送信に失敗しました。メールアドレスを確認してください。';
      Alert.alert(
        'エラー',
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>メール送信完了</Text>
          <Text style={styles.subtitle}>
            パスワードリセット用のメールを送信しました。
            メールをご確認いただき、記載されたリンクからパスワードをリセットしてください。
          </Text>
        </View>

        <Card>
          <Button
            title="ログイン画面に戻る"
            onPress={() => navigation.navigate('Login')}
          />
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>パスワードリセット</Text>
        <Text style={styles.subtitle}>
          登録されたメールアドレスを入力してください。
          パスワードリセット用のメールをお送りします。
        </Text>
      </View>

      <Card>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="メールアドレス"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              required
            />
          )}
        />

        <Button
          title={isLoading ? '送信中...' : 'リセットメールを送信'}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          style={styles.submitButton}
        />

        <Button
          title="ログイン画面に戻る"
          onPress={() => navigation.navigate('Login')}
          variant="secondary"
          style={styles.backButton}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  submitButton: {
    marginTop: 8,
  },
  backButton: {
    marginTop: 12,
  },
});