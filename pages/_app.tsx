import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next";
import { ThemeProvider } from "../lib/theme";
import { useEffect } from "react";
import Script from "next/script";
import "../styles/globals.css";

function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <>
      {/* This script runs immediately, before React hydration, to prevent flicker */}
      <Script
        id="theme-switcher"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                const storedTheme = localStorage.getItem('theme');
                const theme = storedTheme || 'system';
                const isDark = 
                  theme === 'dark' || 
                  (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {
                // If localStorage access fails, just use system preference
                const isDarkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (isDarkSystem) {
                  document.documentElement.classList.add('dark');
                }
              }
            })();
          `,
        }}
      />
      <SessionProvider session={session}>
        <ThemeProvider>
          <Component {...pageProps} />
        </ThemeProvider>
      </SessionProvider>
    </>
  );
}

export default appWithTranslation(App);