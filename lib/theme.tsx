import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to check if we're in the browser
const isBrowser = typeof window !== 'undefined';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize with 'system' and then update after checking localStorage
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  
  // Wrapper around setState that also updates localStorage and applies the theme
  const setTheme = (newTheme: Theme) => {
    if (!isBrowser) return;
    
    // Update state
    setThemeState(newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
    
    // Apply theme changes
    applyTheme(newTheme);
  };
  
  // Function to apply theme changes to the DOM
  const applyTheme = (currentTheme: Theme) => {
    if (!isBrowser) return;
    
    const isDark = 
      currentTheme === 'dark' || 
      (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Apply class to html element
    if (isDark) {
      document.documentElement.classList.add('dark');
      setResolvedTheme('dark');
    } else {
      document.documentElement.classList.remove('dark');
      setResolvedTheme('light');
    }
  };
  
  // Initial setup on mount
  useEffect(() => {
    if (!isBrowser) return;
    
    // Get stored theme or use system default
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = storedTheme || 'system';
    
    // Update state without re-rendering
    setThemeState(initialTheme);
    
    // Apply the theme
    applyTheme(initialTheme);
    
    // Force a re-render to ensure state is correct
    // This is needed because the initial state might be different from what's in localStorage
    setThemeState(prev => prev === initialTheme ? prev : initialTheme);
  }, []);
  
  // Listen for system theme changes if using 'system' theme
  useEffect(() => {
    if (!isBrowser || theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      applyTheme('system');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};