import debounce from 'lodash/debounce';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useRecoilValue, useRecoilState } from 'recoil';
import type { KeyboardEvent } from 'react';
import {
  forceResize,
  insertTextAtCursor,
  checkIfScrollable,
} from '~/utils';
import useGetSender from '~/hooks/Conversations/useGetSender';
import useFileHandling from '~/hooks/Files/useFileHandling';
import { useInteractionHealthCheck } from '~/data-provider';
import { useChatContext } from '~/Providers/ChatContext';
import useLocalize from '~/hooks/useLocalize';
import { globalAudioId } from '~/common';
import store from '~/store';

type KeyEvent = KeyboardEvent<HTMLTextAreaElement>;

export default function useTextarea({
  textAreaRef,
  submitButtonRef,
  setIsScrollable,
  disabled = false,
}: {
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
  submitButtonRef: React.RefObject<HTMLButtonElement>;
  setIsScrollable: React.Dispatch<React.SetStateAction<boolean>>;
  disabled?: boolean;
}) {
  const localize = useLocalize();
  const getSender = useGetSender();
  const isComposing = useRef(false);
  const { handleFiles } = useFileHandling();
  const checkHealth = useInteractionHealthCheck();
  const enterToSend = useRecoilValue(store.enterToSend);

  const { index, conversation, isSubmitting, filesLoading, latestMessage, setFilesLoading } =
    useChatContext();
  const [activePrompt, setActivePrompt] = useRecoilState(store.activePromptByIndex(index));

  const isNotAppendable =
    (latestMessage?.unfinished ?? false) && !isSubmitting;

  // Inserare prompt în textarea
  useEffect(() => {
    const prompt = activePrompt ?? '';
    if (prompt && textAreaRef.current) {
      insertTextAtCursor(textAreaRef.current, prompt);
      forceResize(textAreaRef.current);
      setActivePrompt(undefined);
    }
  }, [activePrompt, setActivePrompt, textAreaRef]);

  // Placeholder-uri dinamice pentru e-commerce
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const ecommerceMessages = [
    'What are you looking for today?',
    'Describe your perfect product',
    'I can help you find anything',
    'Tell me your shopping needs',
    "What's your style preference?",
    'Looking for gifts or personal items?',
    "I'll find the best deals for you",
    "What's your budget range?",
    "Let me discover products you'll love",
    "I'm your personal shopping assistant",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % ecommerceMessages.length);
    }, 15000);
    return () => clearInterval(interval);
  }, [ecommerceMessages.length]);

  // Actualizare placeholder
  useEffect(() => {
    const currentValue = textAreaRef.current?.value ?? '';
    if (currentValue) return;

    const getPlaceholderText = () => {
      if (disabled) return localize('com_endpoint_config_placeholder');
      if (isNotAppendable) return localize('com_endpoint_message_not_appendable');
      return ecommerceMessages[currentMessageIndex];
    };

    const placeholder = getPlaceholderText();
    if (textAreaRef.current?.getAttribute('placeholder') === placeholder) return;

    const setPlaceholder = () => {
      const newPlaceholder = getPlaceholderText();
      if (textAreaRef.current?.getAttribute('placeholder') !== newPlaceholder) {
        textAreaRef.current?.setAttribute('placeholder', newPlaceholder);
        forceResize(textAreaRef.current);
      }
    };

    const debouncedSetPlaceholder = debounce(setPlaceholder, 50);
    debouncedSetPlaceholder();

    return () => debouncedSetPlaceholder.cancel();
  }, [localize, disabled, textAreaRef, latestMessage, isNotAppendable, currentMessageIndex, ecommerceMessages]);

  // Key handlers
  const handleKeyDown = useCallback(
    (e: KeyEvent) => {
      if (textAreaRef.current && checkIfScrollable(textAreaRef.current)) {
        setIsScrollable(true);
      }
      if (e.key === 'Enter' && isSubmitting) return;

      checkHealth();

      const isNonShiftEnter = e.key === 'Enter' && !e.shiftKey;
      const isCtrlEnter = e.key === 'Enter' && (e.ctrlKey || e.metaKey);
      const isComposingInput = isComposing.current || e.key === 'Process' || e.keyCode === 229;

      if (isNonShiftEnter && filesLoading) {
        e.preventDefault();
      }

      if (isNonShiftEnter) {
        e.preventDefault();
      }

      if (
        e.key === 'Enter' &&
        !enterToSend &&
        !isCtrlEnter &&
        textAreaRef.current &&
        !isComposingInput
      ) {
        e.preventDefault();
        insertTextAtCursor(textAreaRef.current, '\n');
        forceResize(textAreaRef.current);
        return;
      }

      if ((isNonShiftEnter || isCtrlEnter) && !isComposingInput) {
        const globalAudio = document.getElementById(globalAudioId) as HTMLAudioElement | undefined;
        if (globalAudio) {
          globalAudio.muted = false;
        }
        submitButtonRef.current?.click();
      }
    },
    [isSubmitting, checkHealth, filesLoading, enterToSend, setIsScrollable, textAreaRef, submitButtonRef],
  );

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = () => {
    isComposing.current = false;
  };

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const textArea = textAreaRef.current;
      if (!textArea) return;

      const clipboardData = e.clipboardData as DataTransfer | undefined;
      if (!clipboardData) return;

      if (clipboardData.files.length > 0) {
        setFilesLoading(true);
        const timestampedFiles: File[] = [];
        for (const file of clipboardData.files) {
          const newFile = new File([file], `clipboard_${+new Date()}_${file.name}`, {
            type: file.type,
          });
          timestampedFiles.push(newFile);
        }
        handleFiles(timestampedFiles);
      }
    },
    [handleFiles, setFilesLoading, textAreaRef],
  );

  return {
    textAreaRef,
    handlePaste,
    handleKeyDown,
    isNotAppendable,
    handleCompositionEnd,
    handleCompositionStart,
  };
}
