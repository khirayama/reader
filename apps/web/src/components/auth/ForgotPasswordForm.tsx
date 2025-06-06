'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { sdk } from '@/lib/sdk';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      await sdk.auth.forgotPassword(data.email);
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('リクエストの送信に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
          <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">
            メールを送信しました
          </h3>
          <p className="text-sm text-green-600 dark:text-green-300">
            パスワードリセットのリンクをメールで送信しました。
            メールをご確認の上、リンクをクリックしてパスワードをリセットしてください。
          </p>
        </div>
        <Link
          href="/login"
          className="text-primary-600 hover:text-primary-500 dark:text-primary-400"
        >
          ログインページに戻る
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Input
          label="メールアドレス"
          type="email"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
          helperText="登録されているメールアドレスを入力してください"
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div>
        <Button
          type="submit"
          className="w-full"
          loading={isLoading}
        >
          リセットメールを送信
        </Button>
      </div>

      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-primary-600 hover:text-primary-500 dark:text-primary-400"
        >
          ログインページに戻る
        </Link>
      </div>
    </form>
  );
}