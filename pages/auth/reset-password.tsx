import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { z } from "zod";

const resetSchema = z
  .object({
    password: z.string().min(8, "パスワードは8文字以上である必要があります"),
    confirmPassword: z.string().min(8, "パスワードは8文字以上である必要があります"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [formData, setFormData] = useState<ResetFormData>({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ResetFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // トークンが存在する場合、その有効性を確認
    const validateToken = async () => {
      if (!token) return;

      try {
        const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "無効なトークンです");
        }

        setIsTokenValid(true);
      } catch (error) {
        setIsTokenValid(false);
        setError(error instanceof Error ? error.message : "無効なトークンです");
      }
    };

    if (token) {
      validateToken();
    }
  }, [token]);

  const validateForm = () => {
    try {
      resetSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof ResetFormData, string>> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as keyof ResetFormData;
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "パスワードリセットに失敗しました");
      }

      setSuccess(true);
      // 3秒後にログインページにリダイレクト
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "パスワードリセットに失敗しました");
    } finally {
      setIsLoading(false);
    }
  };

  // トークンの有効性確認中
  if (token && isTokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center">
        <div className="max-w-md w-full mx-auto text-center">
          <p className="text-gray-700 dark:text-gray-300">トークンを確認中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center">
      <Head>
        <title>パスワードリセット | RSS Reader</title>
      </Head>

      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            新しいパスワードを設定
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md px-6 py-8">
          {!token || isTokenValid === false ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md">
                {error || "無効なリセットリンクです。新しいリセットリンクをリクエストしてください。"}
              </div>
              <Link
                href="/auth/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                パスワードリセットに戻る
              </Link>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md">
                パスワードが正常にリセットされました。ログインページにリダイレクトします...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  新しいパスワード
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
                      errors.password ? "border-red-500 dark:border-red-500" : ""
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  パスワードを確認
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm ${
                      errors.confirmPassword ? "border-red-500 dark:border-red-500" : ""
                    }`}
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "処理中..." : "パスワードを更新"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}