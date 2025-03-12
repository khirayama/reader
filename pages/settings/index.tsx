import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { z } from "zod";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSideProps } from "next";
import { useTheme } from "../../lib/theme";

// Form validation schema with i18n
function getProfileSchema(t: (key: string) => string) {
  return z.object({
    email: z.string().email(t("emailInvalid")),
  });
}

function getPasswordSchema(t: (key: string) => string) {
  return z
    .object({
      currentPassword: z.string().min(1, t("passwordRequired")),
      newPassword: z.string().min(8, t("passwordMinLength")),
      confirmPassword: z.string().min(8, t("passwordConfirmRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });
}

export default function Settings() {
  const { data: session, status } = useSession({ required: true });
  const router = useRouter();
  const { t } = useTranslation("settings");
  const { t: commonT } = useTranslation("common");
  const { theme, setTheme, resolvedTheme } = useTheme();

  const [profileFormData, setProfileFormData] = useState({
    email: "",
  });
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState(router.locale || "en");
  const [isImportingOpml, setIsImportingOpml] = useState(false);
  const [opmlImportResult, setOpmlImportResult] = useState<{ success?: boolean; message?: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load user data when session is available
  useEffect(() => {
    if (session?.user) {
      setProfileFormData({
        email: session.user.email || "",
      });
    }
  }, [session]);

  // Validate profile form
  const validateProfileForm = () => {
    try {
      const profileSchema = getProfileSchema(t);
      profileSchema.parse(profileFormData);
      setProfileErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((e) => {
          if (e.path) {
            errors[e.path[0]] = e.message;
          }
        });
        setProfileErrors(errors);
      }
      return false;
    }
  };

  // Validate password form
  const validatePasswordForm = () => {
    try {
      const passwordSchema = getPasswordSchema(t);
      passwordSchema.parse(passwordFormData);
      setPasswordErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((e) => {
          if (e.path) {
            errors[e.path[0]] = e.message;
          }
        });
        setPasswordErrors(errors);
      }
      return false;
    }
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    setGeneralError("");

    if (!validateProfileForm()) return;

    setIsProfileLoading(true);

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileFormData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("updateError"));
      }

      setProfileSuccess(true);

      // Update session if email was changed
      if (session && session.user && profileFormData.email !== session.user.email) {
        router.reload();
      }
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : t("updateError"));
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Handle password form submission
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(false);
    setGeneralError("");

    if (!validatePasswordForm()) return;

    setIsPasswordLoading(true);

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t("passwordError"));
      }

      setPasswordSuccess(true);
      setPasswordFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : t("passwordError"));
    } finally {
      setIsPasswordLoading(false);
    }
  };

  // Handle language change
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    router.push(router.pathname, router.asPath, { locale: language });
  };

  // Handle theme change
  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
  };

  // Handle logout
  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  // OPML関連の処理
  const handleExportOpml = () => {
    window.location.href = '/api/feeds/export-opml';
  };

  const handleImportOpmlClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportOpml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingOpml(true);
    setOpmlImportResult({});

    try {
      // ファイルをテキストとして読み込む
      const reader = new FileReader();
      reader.onload = async (event) => {
        const opmlContent = event.target?.result;
        
        if (typeof opmlContent === 'string') {
          // APIにOPMLコンテンツを送信
          const response = await fetch('/api/feeds/import-opml', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ opmlContent }),
          });

          const result = await response.json();
          
          if (response.ok) {
            setOpmlImportResult({
              success: true,
              message: result.message,
            });
          } else {
            throw new Error(result.error || t('opmlImportError'));
          }
        }
      };
      
      reader.onerror = () => {
        throw new Error(t('fileReadError'));
      };
      
      reader.readAsText(file);
    } catch (error) {
      setOpmlImportResult({
        success: false,
        message: error instanceof Error ? error.message : t('opmlImportError'),
      });
    } finally {
      setIsImportingOpml(false);
      // ファイル入力をリセット
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle account deletion
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const handleDeleteAccount = async () => {
    if (!confirm(t("deleteAccountConfirmation"))) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || t("deleteAccountError"));
      }

      // Logout and redirect to home
      signOut({ callbackUrl: "/" });
    } catch (error) {
      setGeneralError(error instanceof Error ? error.message : t("deleteAccountError"));
      setIsDeletingAccount(false);
    }
  };

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>{t("title")}</title>
      </Head>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("pageTitle")}</h1>
          <div className="mt-4">
            <Link
              href="/feeds"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← {t("backToFeeds")}
            </Link>
          </div>
        </div>

        {generalError && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-md">
            {generalError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-8">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t("generalSettings")}
              </h2>
              <ul className="space-y-2">
                <li>
                  <a href="#profile" className="block py-1 text-blue-600 dark:text-blue-400">
                    {t("profileSettings")}
                  </a>
                </li>
                <li>
                  <a href="#password" className="block py-1 text-blue-600 dark:text-blue-400">
                    {t("changePassword")}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Main content */}
          <div className="md:col-span-2 space-y-8">
            {/* Account actions section */}
            <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-6">
                {t("accountActions")}
              </h2>

              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-6">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t("logout")}
                </button>

                <button
                  onClick={() => setShowDeleteConfirmation(true)}
                  className="px-4 py-2 border border-red-300 rounded-md text-red-700 dark:text-red-400 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  {t("deleteAccount")}
                </button>
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t("opmlManagement")}
              </h3>
              
              {opmlImportResult.message && (
                <div 
                  className={`mb-4 p-3 rounded ${
                    opmlImportResult.success 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" 
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                  }`}
                >
                  {opmlImportResult.message}
                </div>
              )}
              
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleExportOpml}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {t("exportOpml")}
                </button>
                
                <button
                  onClick={handleImportOpmlClick}
                  disabled={isImportingOpml}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImportingOpml ? t("importing") : t("importOpml")}
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".opml,.xml"
                  onChange={handleImportOpml}
                  className="hidden"
                />
              </div>

              {showDeleteConfirmation && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
                  <p className="text-red-700 dark:text-red-400 mb-4">{t("deleteAccountWarning")}</p>
                  <div className="flex space-x-4">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDeletingAccount ? t("deleting") : t("confirmDelete")}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirmation(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Profile settings section */}
            <section id="profile" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-6">
                {t("profileSettings")}
              </h2>

              {profileSuccess && (
                <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md">
                  {t("updateSuccess")}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("email")}
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={profileFormData.email}
                      onChange={(e) =>
                        setProfileFormData({ ...profileFormData, email: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {profileErrors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {profileErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="language"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("language")}
                  </label>
                  <div className="mt-1">
                    <select
                      id="language"
                      name="language"
                      value={selectedLanguage}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="en">English</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="theme"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("theme")}
                  </label>
                  <div className="mt-1">
                    <select
                      id="theme"
                      name="theme"
                      value={theme}
                      onChange={(e) =>
                        handleThemeChange(e.target.value as "light" | "dark" | "system")
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="light">{t("light")}</option>
                      <option value="dark">{t("dark")}</option>
                      <option value="system">{t("system")}</option>
                    </select>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {t("currentTheme")}: {resolvedTheme === "light" ? t("light") : t("dark")}
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isProfileLoading}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProfileLoading ? t("processing") : t("saveChanges")}
                  </button>
                </div>
              </form>
            </section>

            {/* Change password section */}
            <section id="password" className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-6">
                {t("changePassword")}
              </h2>

              {passwordSuccess && (
                <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md">
                  {t("passwordSuccess")}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <label
                    htmlFor="currentPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("currentPassword")}
                  </label>
                  <div className="mt-1">
                    <input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={passwordFormData.currentPassword}
                      onChange={(e) =>
                        setPasswordFormData({
                          ...passwordFormData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="newPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("newPassword")}
                  </label>
                  <div className="mt-1">
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={passwordFormData.newPassword}
                      onChange={(e) =>
                        setPasswordFormData({ ...passwordFormData, newPassword: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {t("confirmPassword")}
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={passwordFormData.confirmPassword}
                      onChange={(e) =>
                        setPasswordFormData({
                          ...passwordFormData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPasswordLoading}
                    className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPasswordLoading ? t("processing") : t("changePassword")}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || "en", ["settings", "common"])),
    },
  };
};
