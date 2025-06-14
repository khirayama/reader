import type React from 'react';
import { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';

interface ResponsiveLayoutProps {
  sidebar: React.ReactNode;
  main: React.ReactNode;
  sidebarOpen?: boolean;
  onSidebarToggle?: (open: boolean) => void;
}

export function ResponsiveLayout({
  sidebar,
  main,
  sidebarOpen = false,
  onSidebarToggle,
}: ResponsiveLayoutProps) {
  const [windowDimensions, setWindowDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  const isTablet = windowDimensions.width >= 768 || (Platform.OS === 'ios' && (windowDimensions.width >= 600 && windowDimensions.height >= 600));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setWindowDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // タブレットの場合は常にサイドバーを表示
  const showSidebar = isTablet || sidebarOpen;

  return (
    <View style={styles.container}>
      {/* サイドバー */}
      {showSidebar && (
        <View
          style={[
            styles.sidebar,
            isTablet ? styles.sidebarTablet : styles.sidebarMobile,
            !isTablet && !sidebarOpen && styles.sidebarHidden,
          ]}
        >
          {sidebar}
        </View>
      )}

      {/* メインコンテンツ */}
      <View style={[styles.main, isTablet && styles.mainTablet]}>
        {main}
      </View>

      {/* モバイルでサイドバーが開いている時のオーバーレイ */}
      {!isTablet && sidebarOpen && (
        <View
          style={styles.overlay}
          onTouchEnd={() => onSidebarToggle?.(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  sidebarTablet: {
    width: 320,
    position: 'relative',
  },
  sidebarMobile: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    zIndex: 1000,
    elevation: 5,
  },
  sidebarHidden: {
    transform: [{ translateX: '-100%' }],
  },
  main: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  mainTablet: {
    marginLeft: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
});