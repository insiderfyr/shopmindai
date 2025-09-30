import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface TypingAnimationConfig {
  baseDelay: number;
  spaceDelay: number;
  punctuationDelay: number;
  newlineDelay: number;
  codeDelay: number;
  mathDelay: number;
  breathingEffect: boolean;
  smartPausing: boolean;
  adaptiveSpeed: boolean;
  highRefreshRate: boolean;
  predictiveGrouping: boolean;
  smoothScrolling: boolean;
  microInteractions: boolean;
  emojiSupport: boolean;
}

interface TypingState {
  displayText: string;
  currentIndex: number;
  isTyping: boolean;
  isComplete: boolean;
  phase: 'pre-animation' | 'entrance' | 'typing' | 'completion' | 'settled';
}

interface CharacterInfo {
  char: string;
  type: 'space' | 'punctuation' | 'newline' | 'code' | 'math' | 'regular' | 'emoji';
  delay: number;
  groupable: boolean;
  weight: number;
}

const DEFAULT_CONFIG: TypingAnimationConfig = {
  baseDelay: 4,
  spaceDelay: 1,
  punctuationDelay: 40,
  newlineDelay: 80,
  codeDelay: 8,
  mathDelay: 12,
  breathingEffect: true,
  smartPausing: true,
  adaptiveSpeed: true,
  highRefreshRate: true,
  predictiveGrouping: true,
  smoothScrolling: true,
  microInteractions: true,
  emojiSupport: true,
};

export const useTypingAnimation = (
  text: string,
  isStreaming: boolean,
  isComplete: boolean,
  config: Partial<TypingAnimationConfig> = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<TypingState>({
    displayText: '',
    currentIndex: 0,
    isTyping: false,
    isComplete: false,
    phase: 'pre-animation',
  });

  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);
  const userScrollingRef = useRef<boolean>(false);
  const windowFocusedRef = useRef<boolean>(true);
  const displayBufferRef = useRef<string>('');
  const characterMapRef = useRef<CharacterInfo[]>([]);
  const refreshRateRef = useRef<number>(60);

  const performanceMetricsRef = useRef<{
    frameTime: number;
    jankCount: number;
    avgDelay: number;
    smoothness: number;
  }>({ frameTime: 16.67, jankCount: 0, avgDelay: 0, smoothness: 100 });

  const detectRefreshRate = useCallback(() => {
    if (!finalConfig.highRefreshRate) return 60;

    let lastTime = performance.now();
    let frameCount = 0;
    const samples: number[] = [];

    const testFrame = (currentTime: number) => {
      if (frameCount > 0) {
        const delta = currentTime - lastTime;
        if (delta > 0 && delta < 100) {
          samples.push(1000 / delta);
        }
      }
      lastTime = currentTime;
      frameCount++;

      if (frameCount < 15) {
        requestAnimationFrame(testFrame);
      } else {
        const avgFps = samples.reduce((a, b) => a + b, 0) / samples.length;
        refreshRateRef.current = Math.round(avgFps);
        performanceMetricsRef.current.frameTime = 1000 / refreshRateRef.current;
      }
    };

    requestAnimationFrame(testFrame);
  }, [finalConfig.highRefreshRate]);

  const analyzeText = useCallback((inputText: string): CharacterInfo[] => {
    const chars: CharacterInfo[] = [];
    const textLower = inputText.toLowerCase();
    
    const hasCode = textLower.includes('```') || textLower.includes('`');
    const hasMath = textLower.includes('$') || textLower.includes('\\');
    const hasEmojis = /[\u{1F600}-\u{1F64F}]/u.test(inputText);
    
    for (let i = 0; i < inputText.length; i++) {
      const char = inputText[i];
      let type: CharacterInfo['type'] = 'regular';
      let delay = finalConfig.baseDelay;
      let groupable = true;
      let weight = 1;

      if (char === ' ') {
        type = 'space';
        delay = finalConfig.spaceDelay;
        weight = 0.5;
      } else if (/[.!?]/.test(char)) {
        type = 'punctuation';
        delay = finalConfig.punctuationDelay;
        weight = 1.2;
      } else if (char === '\n') {
        type = 'newline';
        delay = finalConfig.newlineDelay;
        weight = 1.5;
      } else if (hasCode && (char === '`' || context.includes('```'))) {
        type = 'code';
        delay = finalConfig.codeDelay;
        weight = 0.8;
      } else if (hasMath && (char === '$' || char === '\\')) {
        type = 'math';
        delay = finalConfig.mathDelay;
        weight = 1.3;
      } else if (finalConfig.emojiSupport && /[\u{1F600}-\u{1F64F}]/u.test(char)) {
        type = 'emoji';
        delay = finalConfig.baseDelay * 0.6;
        weight = 1.4;
      }

      chars.push({ char, type, delay, groupable, weight });
    }

    return chars;
  }, [finalConfig]);

  const getOptimalGroup = useCallback((startIndex: number): number => {
    if (!finalConfig.predictiveGrouping) return 1;

    const chars = characterMapRef.current;
    let groupSize = 1;
    const maxGroupSize = 8;
    for (let i = startIndex; i < Math.min(startIndex + maxGroupSize, chars.length); i++) {
      const char = chars[i];
      if (!char.groupable) break;
      groupSize++;
    }

    return Math.min(groupSize, maxGroupSize);
  }, [finalConfig.predictiveGrouping]);

  const animateCharacters = useCallback(() => {
    if (!isStreaming || state.currentIndex >= text.length) {
      setState(prev => ({ ...prev, isTyping: false, isComplete: true, phase: 'completion' }));
      return;
    }

    const now = performance.now();
    const targetFrameTime = 1000 / refreshRateRef.current;

    if (now - lastUpdateRef.current < targetFrameTime) {
      animationRef.current = requestAnimationFrame(animateCharacters);
      return;
    }

    lastUpdateRef.current = now;
    const groupSize = getOptimalGroup(state.currentIndex);
    const nextIndex = Math.min(state.currentIndex + groupSize, text.length);

    for (let i = state.currentIndex; i < nextIndex; i++) {
      displayBufferRef.current += characterMapRef.current[i]?.char || text[i] || '';
    }

    setState(prev => ({
      ...prev,
      displayText: displayBufferRef.current,
      currentIndex: nextIndex,
      isTyping: nextIndex < text.length,
      phase: nextIndex < text.length ? 'typing' : 'completion',
    }));

    if (nextIndex < text.length) {
      const nextChar = characterMapRef.current[nextIndex];
      const delay = nextChar?.delay || finalConfig.baseDelay;
      const targetTime = now + delay;

      const waitForNextFrame = () => {
        const currentTime = performance.now();
        if (currentTime >= targetTime) {
          animationRef.current = requestAnimationFrame(animateCharacters);
        } else {
          animationRef.current = requestAnimationFrame(waitForNextFrame);
        }
      };
      
      animationRef.current = requestAnimationFrame(waitForNextFrame);
    }
  }, [text, isStreaming, state.currentIndex, getOptimalGroup, finalConfig.baseDelay]);

  useEffect(() => {
    if (isStreaming && text.length > 0 && state.phase === 'pre-animation') {
      detectRefreshRate();
      characterMapRef.current = analyzeText(text);
      displayBufferRef.current = '';
      setState(prev => ({ ...prev, phase: 'entrance' }));
      setTimeout(() => {
        setState(prev => ({ ...prev, phase: 'typing' }));
        animationRef.current = requestAnimationFrame(animateCharacters);
      }, 150);
    } else if (!isStreaming && text.length > 0) {
      setState(prev => ({
        ...prev,
        displayText: text,
        isTyping: false,
        isComplete: true,
        phase: 'settled',
      }));
    }
  }, [isStreaming, text, state.phase, animateCharacters, analyzeText, detectRefreshRate]);

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    displayBufferRef.current = '';
    characterMapRef.current = [];
    setState({
      displayText: '',
      currentIndex: 0,
      isTyping: false,
      isComplete: false,
      phase: 'pre-animation',
    });
  }, [text, isStreaming]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    displayText: state.displayText,
    isTyping: state.isTyping,
    isComplete: state.isComplete,
    phase: state.phase,
    animationClasses: state.phase === 'typing' ? 'typing-active' : '',
    progress: text.length > 0 ? state.currentIndex / text.length : 0,
    refreshRate: refreshRateRef.current,
    characterCount: characterMapRef.current.length,
    estimatedDuration: characterMapRef.current.reduce((total, char) => total + char.delay, 0),
    performanceMetrics: performanceMetricsRef.current,
  };
};
