// 🚀 GENIUS-LEVEL TYPING ANIMATION CONFIGURATION

export interface TypingAnimationUserConfig {
  // Basic timing controls
  baseDelay: number;
  spaceDelay: number;
  punctuationDelay: number;
  newlineDelay: number;
  codeDelay: number;
  mathDelay: number;
  
  // Advanced features
  breathingEffect: boolean;
  smartPausing: boolean;
  adaptiveSpeed: boolean;
  highRefreshRate: boolean;
  predictiveGrouping: boolean;
  smoothScrolling: boolean;
  microInteractions: boolean;
  emojiSupport: boolean;
  
  // Performance settings
  maxGroupSize: number;
  frameRateLimit: number;
  memoryOptimization: boolean;
  
  // Visual effects
  cursorStyle: 'block' | 'line' | 'underline' | 'custom';
  cursorColor: string;
  breathingIntensity: number;
  hoverEffects: boolean;
  
  // Accessibility
  reduceMotion: boolean;
  highContrast: boolean;
  screenReaderSupport: boolean;
}

// 🚀 Default configuration for ChatGPT-level ultra-smooth performance
export const DEFAULT_TYPING_CONFIG: TypingAnimationUserConfig = {
  // Basic timing controls (optimized for ChatGPT-like smoothness)
  baseDelay: 4, // 🚀 Even faster for true buttery smoothness
  spaceDelay: 1, // 🚀 Instant spaces like ChatGPT
  punctuationDelay: 40, // 🚀 Half the pause for better flow
  newlineDelay: 80, // 🚀 Reduced for smoother paragraph transitions
  codeDelay: 8, // 🚀 Faster code typing
  mathDelay: 12, // 🚀 Smoother math rendering
  
  // Advanced features (all enabled for best experience)
  breathingEffect: true,
  smartPausing: true,
  adaptiveSpeed: true,
  highRefreshRate: true,
  predictiveGrouping: true,
  smoothScrolling: true,
  microInteractions: true,
  emojiSupport: true,
  
  // Performance settings (enhanced for ChatGPT-level smoothness)
  maxGroupSize: 8, // 🚀 Larger groups for smoother bursts
  frameRateLimit: 0, // 0 = auto-detect for highest performance
  memoryOptimization: true,
  
  // Visual effects (ChatGPT-inspired)
  cursorStyle: 'block',
  cursorColor: 'hsl(var(--primary))',
  breathingIntensity: 0.0012, // 🚀 Slightly more noticeable breathing
  hoverEffects: true,
  
  // Accessibility
  reduceMotion: false,
  highContrast: false,
  screenReaderSupport: true,
};

// 🚀 Performance presets for different devices (ChatGPT-optimized)
export const PERFORMANCE_PRESETS = {
  // ChatGPT-Ultra for high-end devices
  ultra: {
    ...DEFAULT_TYPING_CONFIG,
    baseDelay: 3, // 🚀 Insanely fast like ChatGPT Plus
    spaceDelay: 0, // 🚀 Instant spaces
    maxGroupSize: 10, // 🚀 Large bursts for ultra-smooth flow
    breathingIntensity: 0.0015,
  },
  
  // ChatGPT-Standard for most devices
  balanced: {
    ...DEFAULT_TYPING_CONFIG,
    baseDelay: 4, // 🚀 ChatGPT-like speed
    spaceDelay: 1,
    maxGroupSize: 8,
    breathingIntensity: 0.0012,
  },
  
  // Conservative for low-end devices (still smooth)
  conservative: {
    ...DEFAULT_TYPING_CONFIG,
    baseDelay: 6, // 🚀 Still faster than before
    spaceDelay: 2,
    maxGroupSize: 5,
    breathingIntensity: 0.0008,
    microInteractions: false,
    emojiSupport: false,
  },
  
  // Accessibility-focused
  accessible: {
    ...DEFAULT_TYPING_CONFIG,
    baseDelay: 15,
    breathingEffect: false,
    microInteractions: false,
    reduceMotion: true,
    highContrast: true,
    screenReaderSupport: true,
  },
};

// 🚀 Content-aware presets
export const CONTENT_PRESETS = {
  // Fast for conversational text
  conversational: {
    ...DEFAULT_TYPING_CONFIG,
    baseDelay: 6,
    punctuationDelay: 60,
    newlineDelay: 100,
  },
  
  // Slower for technical content
  technical: {
    ...DEFAULT_TYPING_CONFIG,
    baseDelay: 12,
    codeDelay: 20,
    mathDelay: 30,
    breathingIntensity: 0.0006,
  },
  
  // Balanced for mixed content
  mixed: {
    ...DEFAULT_TYPING_CONFIG,
    baseDelay: 8,
    adaptiveSpeed: true,
  },
};

// 🚀 Device-specific optimizations
export const DEVICE_OPTIMIZATIONS = {
  // Mobile devices
  mobile: {
    maxGroupSize: 3,
    breathingIntensity: 0.0005,
    microInteractions: false,
    smoothScrolling: false,
  },
  
  // Tablet devices
  tablet: {
    maxGroupSize: 4,
    breathingIntensity: 0.0007,
    microInteractions: true,
    smoothScrolling: true,
  },
  
  // Desktop devices
  desktop: {
    maxGroupSize: 5,
    breathingIntensity: 0.0008,
    microInteractions: true,
    smoothScrolling: true,
    highRefreshRate: true,
  },
  
  // High-refresh displays
  highRefresh: {
    maxGroupSize: 6,
    breathingIntensity: 0.001,
    microInteractions: true,
    smoothScrolling: true,
    highRefreshRate: true,
    frameRateLimit: 120,
  },
};

// 🚀 Utility functions for configuration management
export class TypingAnimationConfigManager {
  private config: TypingAnimationUserConfig;
  
  constructor(initialConfig?: Partial<TypingAnimationUserConfig>) {
    this.config = { ...DEFAULT_TYPING_CONFIG, ...initialConfig };
  }
  
  // Get current configuration
  getConfig(): TypingAnimationUserConfig {
    return { ...this.config };
  }
  
  // Update configuration
  updateConfig(updates: Partial<TypingAnimationUserConfig>): void {
    this.config = { ...this.config, ...updates };
  }
  
  // Apply performance preset
  applyPreset(presetName: keyof typeof PERFORMANCE_PRESETS): void {
    this.config = { ...this.config, ...PERFORMANCE_PRESETS[presetName] };
  }
  
  // Apply content preset
  applyContentPreset(presetName: keyof typeof CONTENT_PRESETS): void {
    this.config = { ...this.config, ...CONTENT_PRESETS[presetName] };
  }
  
  // Apply device optimizations
  applyDeviceOptimizations(deviceType: keyof typeof DEVICE_OPTIMIZATIONS): void {
    this.config = { ...this.config, ...DEVICE_OPTIMIZATIONS[deviceType] };
  }
  
  // Auto-detect and apply ChatGPT-level settings
  autoOptimize(): void {
    // 🚀 Enhanced device detection for optimal performance
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(navigator.userAgent);
    const isHighEnd = navigator.hardwareConcurrency >= 8; // 8+ CPU cores
    const hasHighMemory = (navigator as any).deviceMemory >= 8; // 8GB+ RAM
    
    // 🚀 Detect premium devices and apply ultra settings
    if (!isMobile && !isTablet && (isHighEnd || hasHighMemory)) {
      this.applyPreset('ultra'); // ChatGPT-Ultra for premium devices
    } else if (isMobile) {
      this.applyDeviceOptimizations('mobile');
    } else if (isTablet) {
      this.applyDeviceOptimizations('tablet');
    } else {
      this.applyPreset('balanced'); // ChatGPT-Standard for regular devices
    }
    
    // 🚀 Enhanced high refresh rate detection
    if (window.matchMedia('(min-resolution: 120dpi)').matches || 
        window.screen.width >= 2560) { // 4K+ displays
      this.applyDeviceOptimizations('highRefresh');
    }
    
    // Apply accessibility settings if needed
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.config.reduceMotion = true;
      this.config.breathingEffect = false;
      this.config.microInteractions = false;
    }
    
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      this.config.highContrast = true;
    }
  }
  
  // Validate configuration
  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (this.config.baseDelay < 1) errors.push('baseDelay must be at least 1ms');
    if (this.config.spaceDelay < 0) errors.push('spaceDelay must be at least 0ms');
    if (this.config.maxGroupSize < 1) errors.push('maxGroupSize must be at least 1');
    if (this.config.breathingIntensity < 0 || this.config.breathingIntensity > 0.01) {
      errors.push('breathingIntensity must be between 0 and 0.01');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
  
  // Export configuration
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }
  
  // Import configuration
  importConfig(configString: string): boolean {
    try {
      const imported = JSON.parse(configString);
      this.config = { ...DEFAULT_TYPING_CONFIG, ...imported };
      return true;
    } catch {
      return false;
    }
  }
}

// 🚀 Default instance
export const typingConfigManager = new TypingAnimationConfigManager();

// 🚀 Auto-optimize on import
if (typeof window !== 'undefined') {
  typingConfigManager.autoOptimize();
}
