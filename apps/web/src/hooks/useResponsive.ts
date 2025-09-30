import { useState, useEffect, useCallback } from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ScreenSize {
  width: number;
  height: number;
}

interface ResponsiveConfig {
  deviceType: DeviceType;
  screenSize: ScreenSize;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
}

// Breakpoint definitions
const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Device type thresholds
const DEVICE_THRESHOLDS = {
  mobile: 768,
  tablet: 1024,
} as const;

export const useResponsive = (): ResponsiveConfig => {
  const [config, setConfig] = useState<ResponsiveConfig>({
    deviceType: 'desktop',
    screenSize: { width: 0, height: 0 },
    breakpoint: 'lg',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLandscape: false,
    isPortrait: true,
  });

  const updateConfig = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Determine device type
    let deviceType: DeviceType = 'desktop';
    if (width < DEVICE_THRESHOLDS.mobile) {
      deviceType = 'mobile';
    } else if (width < DEVICE_THRESHOLDS.tablet) {
      deviceType = 'tablet';
    }

    // Determine breakpoint
    let breakpoint: Breakpoint = 'lg';
    if (width >= BREAKPOINTS['2xl']) {
      breakpoint = '2xl';
    } else if (width >= BREAKPOINTS.xl) {
      breakpoint = 'xl';
    } else if (width >= BREAKPOINTS.lg) {
      breakpoint = 'lg';
    } else if (width >= BREAKPOINTS.md) {
      breakpoint = 'md';
    } else if (width >= BREAKPOINTS.sm) {
      breakpoint = 'sm';
    } else {
      breakpoint = 'xs';
    }

    // Determine orientation
    const isLandscape = width > height;
    const isPortrait = height >= width;

    setConfig({
      deviceType,
      screenSize: { width, height },
      breakpoint,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      isLandscape,
      isPortrait,
    });
  }, []);

  useEffect(() => {
    updateConfig();

    const handleResize = () => {
      updateConfig();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [updateConfig]);

  return config;
};

// Utility hook for specific breakpoint checks
export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  const { screenSize } = useResponsive();
  return screenSize.width >= BREAKPOINTS[breakpoint];
};

// Utility hook for device-specific checks
export const useDevice = (device: DeviceType): boolean => {
  const { deviceType } = useResponsive();
  return deviceType === device;
};

// Utility hook for orientation checks
export const useOrientation = () => {
  const { isLandscape, isPortrait } = useResponsive();
  return { isLandscape, isPortrait };
};

// Utility hook for responsive values
export const useResponsiveValue = <T>(mobile: T, tablet: T, desktop: T): T => {
  const { deviceType } = useResponsive();

  switch (deviceType) {
    case 'mobile':
      return mobile;
    case 'tablet':
      return tablet;
    case 'desktop':
      return desktop;
    default:
      return desktop;
  }
};

// Utility hook for responsive spacing
export const useResponsiveSpacing = () => {
  const { deviceType } = useResponsive();

  const spacing = {
    mobile: {
      container: 'px-2 py-1',
      content: 'px-1',
      gap: 'gap-2',
      margin: 'm-1',
      padding: 'p-2',
    },
    tablet: {
      container: 'px-4 py-2',
      content: 'px-2',
      gap: 'gap-3',
      margin: 'm-2',
      padding: 'p-4',
    },
    desktop: {
      container: 'px-6 py-3',
      content: 'px-4',
      gap: 'gap-4',
      margin: 'm-3',
      padding: 'p-6',
    },
  };

  return spacing[deviceType];
};

// Utility hook for responsive sizing
export const useResponsiveSizing = () => {
  const { deviceType } = useResponsive();

  const sizing = {
    mobile: {
      text: 'text-sm',
      icon: 'w-5 h-5',
      button: 'px-3 py-2',
      input: 'h-12',
    },
    tablet: {
      text: 'text-base',
      icon: 'w-6 h-6',
      button: 'px-4 py-2',
      input: 'h-14',
    },
    desktop: {
      text: 'text-lg',
      icon: 'w-8 h-8',
      button: 'px-6 py-3',
      input: 'h-16',
    },
  };

  return sizing[deviceType];
};
