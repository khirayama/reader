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

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginScreenProps {
  navigation: AuthNavigationProp;
}

export function LoginScreen({ navigation }: LoginScreenProps) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      await login(data.email, data.password);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'ログインに失敗しました。メールアドレスとパスワードを確認してください。';
      Alert.alert(
        'ログインエラー',
        errorMessage
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>RSS Reader</Text>
        <Text style={styles.subtitle}>アカウントにログイン</Text>
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

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="パスワード"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.password?.message}
              secureTextEntry
              autoComplete="password"
              required
            />
          )}
        />

        <Button
          title={isLoading ? 'ログイン中...' : 'ログイン'}
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          style={styles.submitButton}
        />

        <Button
          title="パスワードを忘れた場合"
          onPress={() => navigation.navigate('ForgotPassword')}
          variant="secondary"
          style={styles.forgotButton}
        />
      </Card>

      <View style={styles.footer}>
        <Text style={styles.footerText}>アカウントをお持ちでない場合</Text>
        <Button
          title="新規登録"
          onPress={() => navigation.navigate('Register')}
          variant="secondary"
        />
      </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
  },
  submitButton: {
    marginTop: 8,
  },
  forgotButton: {
    marginTop: 12,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
  },
});