import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export type ScreenSize = 'phone' | 'tablet' | 'desktop';

export function useResponsive() {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => sub.remove();
  }, []);

  const width = dimensions.width;
  const height = dimensions.height;

  const screenSize: ScreenSize =
    width >= 1024 ? 'desktop' : width >= 600 ? 'tablet' : 'phone';

  const isDesktop = screenSize === 'desktop';
  const isTablet = screenSize === 'tablet';
  const isPhone = screenSize === 'phone';
  const isWeb = Platform.OS === 'web';
  const isWideScreen = width >= 768;
  const showSidebar = isWideScreen;
  const sidebarWidth = Math.min(400, width * 0.35);

  return {
    width,
    height,
    screenSize,
    isDesktop,
    isTablet,
    isPhone,
    isWeb,
    isWideScreen,
    showSidebar,
    sidebarWidth,
  };
}
