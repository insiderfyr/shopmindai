// 🚀 SIMPLE TYPING ANIMATION TEST UTILITY

export const enableTypingDebug = () => {
  localStorage.setItem('typing-debug', 'true');
  console.log('🚀 Typing Animation Debug ENABLED - Check console for debug info');
  console.log('💡 Tip: Try sending a message and watch the console logs');
};

export const disableTypingDebug = () => {
  localStorage.setItem('typing-debug', 'false');
  console.log('🚀 Typing Animation Debug DISABLED');
};

export const testTypingSpeed = () => {
  console.log('🚀 TYPING ANIMATION SPEED TEST');
  console.log('================================');
  
  // Show current config
  const savedConfig = localStorage.getItem('typing-animation-config');
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      console.log('Current Configuration:');
      console.log(`  Base Delay: ${config.baseDelay}ms`);
      console.log(`  Space Delay: ${config.spaceDelay}ms`);
      console.log(`  Punctuation Delay: ${config.punctuationDelay}ms`);
      console.log(`  Max Group Size: ${config.maxGroupSize}`);
    } catch (e) {
      console.log('Using default configuration');
    }
  } else {
    console.log('Using default configuration:');
    console.log('  Base Delay: 4ms (ChatGPT-level)');
    console.log('  Space Delay: 1ms');
    console.log('  Punctuation Delay: 40ms');
    console.log('  Max Group Size: 8');
  }
  
  console.log('\n💡 To test:');
  console.log('1. Send a message to the AI');
  console.log('2. Watch the typing animation in real-time');
  console.log('3. Check console for debug info (if enabled)');
  
  console.log('\n🎯 Expected behavior:');
  console.log('- Text appears character by character very quickly (4ms per char)');
  console.log('- Spaces appear almost instantly (1ms delay)');
  console.log('- Brief pause at punctuation (40ms)');
  console.log('- Characters appear in groups for smoother flow');
};

export const forceTypingAnimation = () => {
  console.log('🚀 FORCE TYPING ANIMATION TEST');
  console.log('===============================');
  console.log('This will make typing animation work on ALL AI messages (not just streaming)');
  
  // Store original CinematicTyping logic override
  localStorage.setItem('force-typing-animation', 'true');
  
  console.log('✅ Forced typing animation enabled');
  console.log('💡 Refresh the page and all AI messages should animate');
  console.log('⚠️ Remember to disable this for normal usage');
};

export const normalTypingAnimation = () => {
  localStorage.removeItem('force-typing-animation');
  console.log('✅ Typing animation returned to normal (only streaming messages)');
};

// Global functions for browser console
if (typeof window !== 'undefined') {
  (window as any).enableTypingDebug = enableTypingDebug;
  (window as any).disableTypingDebug = disableTypingDebug;
  (window as any).testTypingSpeed = testTypingSpeed;
  (window as any).forceTypingAnimation = forceTypingAnimation;
  (window as any).normalTypingAnimation = normalTypingAnimation;
  
  // Show available functions on page load
  console.log('🚀 TYPING ANIMATION TEST UTILITIES LOADED');
  console.log('=========================================');
  console.log('Available console commands:');
  console.log('  enableTypingDebug()   - Show debug info for all messages');
  console.log('  disableTypingDebug()  - Hide debug info');
  console.log('  testTypingSpeed()     - Show speed test info');
  console.log('  forceTypingAnimation() - Make all AI messages animate');
  console.log('  normalTypingAnimation() - Return to normal behavior');
}
