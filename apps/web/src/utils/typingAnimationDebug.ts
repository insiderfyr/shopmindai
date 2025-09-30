// 🚀 DEBUG UTILITY FOR TYPING ANIMATION TROUBLESHOOTING

export interface TypingDebugInfo {
  isActive: boolean;
  reason: string;
  config: any;
  performance: any;
  suggestions: string[];
}

export const debugTypingAnimation = (
  isCreatedByUser: boolean,
  showCursor: boolean,
  isSubmitting: boolean,
  text: string,
  isLatestMessage: boolean,
  typingConfig: any
): TypingDebugInfo => {
  const debugInfo: TypingDebugInfo = {
    isActive: false,
    reason: '',
    config: typingConfig,
    performance: {},
    suggestions: []
  };

  // Check conditions step by step
  if (isCreatedByUser) {
    debugInfo.reason = 'Animation disabled: User message (only AI messages animate)';
    debugInfo.suggestions.push('Typing animation only works for AI responses');
    return debugInfo;
  }

  if (text.length === 0) {
    debugInfo.reason = 'Animation disabled: No text content';
    debugInfo.suggestions.push('Message needs content to animate');
    return debugInfo;
  }

  const showCursorState = showCursor && isSubmitting;
  
  if (!showCursorState && !isLatestMessage) {
    debugInfo.reason = 'Animation disabled: Not actively streaming and not latest message';
    debugInfo.suggestions.push('Animation activates during streaming or for the latest AI message');
    return debugInfo;
  }

  // Animation should be active!
  debugInfo.isActive = true;
  debugInfo.reason = showCursorState 
    ? 'Animation active: Message is currently streaming'
    : 'Animation active: Latest AI message';

  // Performance check
  if (typingConfig.baseDelay > 10) {
    debugInfo.suggestions.push('Consider reducing baseDelay for faster typing');
  }

  if (!typingConfig.predictiveGrouping) {
    debugInfo.suggestions.push('Enable predictiveGrouping for smoother flow');
  }

  if (!typingConfig.highRefreshRate) {
    debugInfo.suggestions.push('Enable highRefreshRate for smoother animation on high-end devices');
  }

  return debugInfo;
};

export const logTypingDebug = (debugInfo: TypingDebugInfo, messageId: string) => {
  console.group(`🚀 Typing Animation Debug - Message ${messageId.slice(0, 8)}`);
  console.log('Status:', debugInfo.isActive ? '✅ ACTIVE' : '❌ INACTIVE');
  console.log('Reason:', debugInfo.reason);
  console.log('Config:', debugInfo.config);
  
  if (debugInfo.suggestions.length > 0) {
    console.log('Suggestions:');
    debugInfo.suggestions.forEach(suggestion => console.log('  -', suggestion));
  }
  
  console.groupEnd();
};

// Global debug function for browser console
if (typeof window !== 'undefined') {
  (window as any).debugTypingAnimation = (enable: boolean = true) => {
    if (enable) {
      console.log('🚀 Typing Animation Debug Mode ENABLED');
      console.log('Check the console for debug info on each message render');
    } else {
      console.log('🚀 Typing Animation Debug Mode DISABLED');
    }
    localStorage.setItem('typing-debug', enable.toString());
  };
  
  (window as any).testTypingSpeed = () => {
    const testTexts = [
      'This is a quick test of our typing animation.',
      'Let\'s see how smooth this looks with punctuation!',
      'Code blocks: `const test = "hello world";`',
      'Math equations: E = mc² and α + β = γ'
    ];
    
    console.log('🚀 Testing typing speeds with different content types:');
    testTexts.forEach((text, index) => {
      console.log(`Test ${index + 1}: "${text.slice(0, 30)}..."`);
      console.log(`  - Length: ${text.length} characters`);
      console.log(`  - Estimated duration: ${text.length * 4}ms (4ms per char)`);
    });
  };
}
