import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

interface ResponsiveInfo {
  isTablet: boolean;
  isPhone: boolean;
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
}

export function useResponsive(): ResponsiveInfo {
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  // より厳密なタブレット判定: 幅768px以上、またはiOSで大画面の場合
  // 小さなiPadでも確実にタブレットとして認識させる
  const isTablet = width >= 768 || (Platform.OS === 'ios' && (width >= 600 && height >= 600));
  const isPhone = !isTablet;
  const isLandscape = width > height;
  const isPortrait = !isLandscape;

  return {
    isTablet,
    isPhone,
    width,
    height,
    isLandscape,
    isPortrait,
  };
}