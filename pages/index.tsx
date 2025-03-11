import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>RSS Reader</title>
        <meta name="description" content="A modern RSS reader application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800 dark:text-white">
          Welcome to RSS Reader
        </h1>
        
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {session ? (
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                You are signed in as {session.user?.email}
              </p>
              <div className="flex justify-center">
                <Link 
                  href="/feeds"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Go to Feeds
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Sign in to manage your RSS feeds
              </p>
              <div className="flex justify-center space-x-4">
                <Link 
                  href="/auth/signin"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Sign In
                </Link>
                <Link 
                  href="/auth/signup"
                  className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}