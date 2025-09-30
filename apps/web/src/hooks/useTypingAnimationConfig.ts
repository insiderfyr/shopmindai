import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TypingAnimationUserConfig, 
  DEFAULT_TYPING_CONFIG, 
  PERFORMANCE_PRESETS, 
  CONTENT_PRESETS,
  DEVICE_OPTIMIZATIONS,
  typingConfigManager 
} from '~/config/typingAnimation';

// 🚀 Hook for managing typing animation configuration
export const useTypingAnimationConfig = () => {
  const [config, setConfig] = useState<TypingAnimationUserConfig>(DEFAULT_TYPING_CONFIG);
  const [isOptimized, setIsOptimized] = useState(false);

  // 🚀 Initialize configuration
  useEffect(() => {
    // Load saved configuration from localStorage
    const savedConfig = localStorage.getItem('typing-animation-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch {
        // Fallback to default if parsing fails
        setConfig(DEFAULT_TYPING_CONFIG);
      }
    }

    // Auto-optimize for current device
    if (!isOptimized) {
      autoOptimize();
    }
  }, [isOptimized]);

  // 🚀 Save configuration to localStorage
  const saveConfig = useCallback((newConfig: TypingAnimationUserConfig) => {
    setConfig(newConfig);
    localStorage.setItem('typing-animation-config', JSON.stringify(newConfig));
  }, []);

  // 🚀 Update specific configuration values
  const updateConfig = useCallback((updates: Partial<TypingAnimationUserConfig>) => {
    const newConfig = { ...config, ...updates };
    saveConfig(newConfig);
  }, [config, saveConfig]);

  // 🚀 Reset to default configuration
  const resetConfig = useCallback(() => {
    saveConfig(DEFAULT_TYPING_CONFIG);
  }, [saveConfig]);

  // 🚀 Apply performance preset
  const applyPerformancePreset = useCallback((presetName: keyof typeof PERFORMANCE_PRESETS) => {
    const newConfig = { ...config, ...PERFORMANCE_PRESETS[presetName] };
    saveConfig(newConfig);
  }, [config, saveConfig]);

  // 🚀 Apply content preset
  const applyContentPreset = useCallback((presetName: keyof typeof CONTENT_PRESETS) => {
    const newConfig = { ...config, ...CONTENT_PRESETS[presetName] };
    saveConfig(newConfig);
  }, [config, saveConfig]);

  // 🚀 Apply device optimizations
  const applyDeviceOptimizations = useCallback((deviceType: keyof typeof DEVICE_OPTIMIZATIONS) => {
    const newConfig = { ...config, ...DEVICE_OPTIMIZATIONS[deviceType] };
    saveConfig(newConfig);
  }, [config, saveConfig]);

  // 🚀 Auto-optimize for current device
  const autoOptimize = useCallback(() => {
    typingConfigManager.autoOptimize();
    const optimizedConfig = typingConfigManager.getConfig();
    saveConfig(optimizedConfig);
    setIsOptimized(true);
  }, [saveConfig]);

  // 🚀 Export configuration
  const exportConfig = useCallback(() => {
    return JSON.stringify(config, null, 2);
  }, [config]);

  // 🚀 Import configuration
  const importConfig = useCallback((configString: string): boolean => {
    try {
      const imported = JSON.parse(configString);
      const newConfig = { ...DEFAULT_TYPING_CONFIG, ...imported };
      saveConfig(newConfig);
      return true;
    } catch {
      return false;
    }
  }, [saveConfig]);

  // 🚀 Validate current configuration
  const validation = useMemo(() => {
    const errors: string[] = [];
    
    if (config.baseDelay < 1) errors.push('baseDelay must be at least 1ms');
    if (config.spaceDelay < 0) errors.push('spaceDelay must be at least 0ms');
    if (config.maxGroupSize < 1) errors.push('maxGroupSize must be at least 1');
    if (config.breathingIntensity < 0 || config.breathingIntensity > 0.01) {
      errors.push('breathingIntensity must be between 0 and 0.01');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [config]);

  // 🚀 Get configuration for useTypingAnimation hook
  const getHookConfig = useCallback(() => {
    return {
      baseDelay: config.baseDelay,
      spaceDelay: config.spaceDelay,
      punctuationDelay: config.punctuationDelay,
      newlineDelay: config.newlineDelay,
      codeDelay: config.codeDelay,
      mathDelay: config.mathDelay,
      breathingEffect: config.breathingEffect,
      smartPausing: config.smartPausing,
      adaptiveSpeed: config.adaptiveSpeed,
      highRefreshRate: config.highRefreshRate,
      predictiveGrouping: config.predictiveGrouping,
      smoothScrolling: config.smoothScrolling,
      microInteractions: config.microInteractions,
      emojiSupport: config.emojiSupport,
    };
  }, [config]);

  // 🚀 Performance metrics
  const performanceMetrics = useMemo(() => {
    const estimatedTypingSpeed = 1000 / config.baseDelay; // characters per second
    const smoothnessScore = Math.max(0, 100 - (config.baseDelay - 8) * 5);
    
    return {
      estimatedTypingSpeed: Math.round(estimatedTypingSpeed * 10) / 10,
      smoothnessScore: Math.max(0, Math.min(100, smoothnessScore)),
      memoryEfficiency: config.memoryOptimization ? 'High' : 'Standard',
      deviceOptimization: isOptimized ? 'Yes' : 'No',
    };
  }, [config, isOptimized]);

  return {
    // Configuration
    config,
    updateConfig,
    resetConfig,
    
    // Presets
    applyPerformancePreset,
    applyContentPreset,
    applyDeviceOptimizations,
    autoOptimize,
    
    // Import/Export
    exportConfig,
    importConfig,
    
    // Validation
    validation,
    
    // Hook configuration
    getHookConfig,
    
    // Performance metrics
    performanceMetrics,
    
    // State
    isOptimized,
  };
};

// 🚀 Hook for real-time configuration updates
export const useTypingAnimationConfigSync = () => {
  const [config, setConfig] = useState<TypingAnimationUserConfig>(DEFAULT_TYPING_CONFIG);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'typing-animation-config' && e.newValue) {
        try {
          const newConfig = JSON.parse(e.newValue);
          setConfig(newConfig);
        } catch {
          // Ignore invalid configurations
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return config;
};

// 🚀 Hook for device-specific optimizations
export const useDeviceOptimizations = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop' | 'highRefresh'>('desktop');

  useEffect(() => {
    const detectDevice = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(navigator.userAgent);
      
      if (isMobile) {
        setDeviceType('mobile');
      } else if (isTablet) {
        setDeviceType('tablet');
      } else {
        // Check for high refresh rate
        if (window.matchMedia('(min-resolution: 120dpi)').matches) {
          setDeviceType('highRefresh');
        } else {
          setDeviceType('desktop');
        }
      }
    };

    detectDevice();
    
    // Listen for orientation changes
    const handleOrientationChange = () => {
      setTimeout(detectDevice, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', detectDevice);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', detectDevice);
    };
  }, []);

  return deviceType;
};

// 🚀 Hook for accessibility preferences
export const useAccessibilityPreferences = () => {
  const [preferences, setPreferences] = useState({
    reducedMotion: false,
    highContrast: false,
    prefersDark: false,
  });

  useEffect(() => {
    const updatePreferences = () => {
      setPreferences({
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
      });
    };

    updatePreferences();

    const mediaQueries = [
      window.matchMedia('(prefers-reduced-motion: reduce)'),
      window.matchMedia('(prefers-contrast: high)'),
      window.matchMedia('(prefers-color-scheme: dark)'),
    ];

    const handleChange = () => updatePreferences();

    mediaQueries.forEach(query => {
      query.addEventListener('change', handleChange);
    });

    return () => {
      mediaQueries.forEach(query => {
        query.removeEventListener('change', handleChange);
      });
    };
  }, []);

  return preferences;
};
