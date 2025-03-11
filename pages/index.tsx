import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import Link from "next/link";
import { GetStaticProps } from "next";
import { useRouter } from "next/router";
import { useTheme } from "../lib/theme";

export default function Home() {
  const { data: session } = useSession();
  const { t } = useTranslation("common");
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const changeLanguage = (locale: string) => {
    router.push(router.pathname, router.asPath, { locale });
  };
  
  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>RSS Reader</title>
        <meta name="description" content="A modern RSS reader application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="fixed top-4 right-4">
        <div className="flex space-x-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white"
            aria-label={resolvedTheme === 'dark' ? t("lightMode") : t("darkMode")}
          >
            {resolvedTheme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => changeLanguage("en")}
            className={`px-2 py-1 rounded ${
              router.locale === "en" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => changeLanguage("ja")}
            className={`px-2 py-1 rounded ${
              router.locale === "ja" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-white"
            }`}
          >
            JP
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          {t("welcome")}
        </h1>

        {session ? (
          <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                {session.user?.name ? `${session.user.name} (${session.user.email})` : session.user?.email} としてログインしています
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/feeds"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {t("viewFeeds")}
                </Link>
                <Link
                  href="/settings"
                  className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                >
                  {t("settings")}
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="max-w-2xl mx-auto mb-12">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="text-blue-600 dark:text-blue-400 text-3xl mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">RSSフィードを一括管理</h2>
                  <p className="text-gray-600 dark:text-gray-300">すべてのニュースとブログを一箇所で簡単に管理できます。</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="text-blue-600 dark:text-blue-400 text-3xl mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">シンプルで使いやすい</h2>
                  <p className="text-gray-600 dark:text-gray-300">直感的なインターフェースで、情報を簡単に整理して閲覧できます。</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                  <div className="text-blue-600 dark:text-blue-400 text-3xl mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">カスタマイズ自在</h2>
                  <p className="text-gray-600 dark:text-gray-300">ダークモードや言語設定など、お好みに合わせて調整できます。</p>
                </div>
              </div>
            </div>

            <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
                今すぐ始めましょう
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                登録は簡単で無料です。ログインしてRSSフィードを管理しましょう。
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {t("signin")}
                </Link>
                <Link
                  href="/auth/signin"
                  className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                >
                  {t("signup")}
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
}
