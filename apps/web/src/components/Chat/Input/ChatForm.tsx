import { memo, useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import { useRecoilState, useRecoilValue } from 'recoil';
import { Constants, isAssistantsEndpoint } from 'librechat-data-provider';
import {
  useChatContext,
  useChatFormContext,
  useAddedChatContext,
} from '~/Providers';
import {
  useTextarea,
  useAutoSave,
  useRequiresKey,
  useHandleKeyUp,
  useQueryParams,
  useSubmitMessage,
  useFocusChatEffect,
} from '~/hooks';
import { mainTextareaId, BadgeItem } from '~/common';
import AttachFileChat from './Files/AttachFileChat';
import DailyDealsButton from './DailyDealsButton';
import DiscountHunterButton from './DiscountHunterButton';
import FileFormChat from './Files/FileFormChat';
import { TextareaAutosize } from '~/components';
import { cn, removeFocusRings } from '~/utils';
import TextareaHeader from './TextareaHeader';
import PromptsCommand from './PromptsCommand';
import './placeholder-animations.css';

import CollapseChat from './CollapseChat';
import StreamAudio from './StreamAudio';
import StopButton from './StopButton';
import SendButton from './SendButton';
import EditBadges from './EditBadges';
import BadgeRow from './BadgeRow';
import Mention from './Mention';
import store from '~/store';

const ChatForm = memo(({ index = 0 }: { index?: number }) => {
  const submitButtonRef = useRef<HTMLButtonElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  useFocusChatEffect(textAreaRef);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [, setIsScrollable] = useState(false);
  const [visualRowCount, setVisualRowCount] = useState(1);
  const [isTextAreaFocused, setIsTextAreaFocused] = useState(false);
  const [backupBadges, setBackupBadges] = useState<Pick<BadgeItem, 'id'>[]>([]);

  const TextToSpeech = useRecoilValue(store.textToSpeech);
  const chatDirection = useRecoilValue(store.chatDirection);
  const automaticPlayback = useRecoilValue(store.automaticPlayback);
  const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);
  const centerFormOnLanding = useRecoilValue(store.centerFormOnLanding);
  const isTemporary = useRecoilValue(store.isTemporary);

  const {
    addedIndex,
    generateConversation,
    conversation: addedConvo,
    setConversation: setAddedConvo,
    isSubmitting: isSubmittingAdded,
  } = useAddedChatContext();

  const [badges, setBadges] = useRecoilState(store.chatBadges);
  const [isEditingBadges, setIsEditingBadges] = useRecoilState(store.isEditingBadges);
  const [showStopButton, setShowStopButton] = useRecoilState(store.showStopButtonByIndex(index));
  const [showStopAdded, setShowStopAdded] = useRecoilState(store.showStopButtonByIndex(addedIndex));
  const [showPlusPopover, setShowPlusPopover] = useRecoilState(store.showPlusPopoverFamily(index));
  const [showMentionPopover, setShowMentionPopover] = useRecoilState(
    store.showMentionPopoverFamily(index),
  );

  const { requiresKey } = useRequiresKey();
  const methods = useChatFormContext();
  const {
    files,
    setFiles,
    conversation,
    isSubmitting,
    filesLoading,
    newConversation,
    handleStopGenerating,
  } = useChatContext();

  const endpoint = useMemo(
    () => conversation?.endpointType ?? conversation?.endpoint,
    [conversation?.endpointType, conversation?.endpoint],
  );
  const conversationId = useMemo(
    () => conversation?.conversationId ?? Constants.NEW_CONVO,
    [conversation?.conversationId],
  );

  const isRTL = useMemo(
    () => (chatDirection != null ? chatDirection?.toLowerCase() === 'rtl' : false),
    [chatDirection],
  );

  const disableInputs = useMemo(() => requiresKey, [requiresKey]);

  const handleContainerClick = useCallback(() => {
    /** Check if the device is a touchscreen */
    if (window.matchMedia?.('(pointer: coarse)').matches) {
      return;
    }
    textAreaRef.current?.focus();
  }, []);

  const handleFocusOrClick = useCallback(() => {
    if (isCollapsed) {
      setIsCollapsed(false);
    }
  }, [isCollapsed]);

  useAutoSave({
    files,
    setFiles,
    textAreaRef,
    conversationId,
    isSubmitting: isSubmitting || isSubmittingAdded,
  });

  const { submitMessage, submitPrompt } = useSubmitMessage();

  const handleKeyUp = useHandleKeyUp({
    index,
    textAreaRef,
    setShowPlusPopover,
    setShowMentionPopover,
  });
  const {
    isNotAppendable,
    handlePaste,
    handleKeyDown,
    handleCompositionStart,
    handleCompositionEnd,
  } = useTextarea({
    textAreaRef,
    submitButtonRef,
    setIsScrollable,
    disabled: disableInputs,
  });

  useQueryParams({ textAreaRef });

  const { ref, ...registerProps } = methods.register('text', {
    required: true,
    onChange: useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        methods.setValue('text', e.target.value, { shouldValidate: true }),
      [methods],
    ),
  });

  const textValue = useWatch({ control: methods.control, name: 'text' });

  useEffect(() => {
    if (textAreaRef.current) {
      const style = window.getComputedStyle(textAreaRef.current);
      const lineHeight = parseFloat(style.lineHeight);
      setVisualRowCount(Math.floor(textAreaRef.current.scrollHeight / lineHeight));
    }
  }, [textValue]);

  useEffect(() => {
    if (isEditingBadges && backupBadges.length === 0) {
      setBackupBadges([...badges]);
    }
  }, [isEditingBadges, badges, backupBadges.length]);

  const handleSaveBadges = useCallback(() => {
    setIsEditingBadges(false);
    setBackupBadges([]);
  }, [setIsEditingBadges, setBackupBadges]);

  const handleCancelBadges = useCallback(() => {
    if (backupBadges.length > 0) {
      setBadges([...backupBadges]);
    }
    setIsEditingBadges(false);
    setBackupBadges([]);
  }, [backupBadges, setBadges, setIsEditingBadges]);

  const isMoreThanThreeRows = visualRowCount > 3;

  const baseClasses = useMemo(
    () =>
      cn(
        'md:py-1.5 m-0 w-full resize-none py-[4px] placeholder-black/50 bg-transparent dark:placeholder-slate-300/80',
        'text-sm md:text-base font-light leading-relaxed font-["DM Sans"]', // DM Sans for e-commerce
        isCollapsed ? 'max-h-[36px]' : 'max-h-[26vh] md:max-h-[32vh]',
        isMoreThanThreeRows ? 'pl-4' : 'px-4',
      ),
    [isCollapsed, isMoreThanThreeRows],
  );

  return (
    <form
      onSubmit={methods.handleSubmit(submitMessage)}
      className={cn(
        // Responsive width and layout
        'mx-auto flex flex-row gap-1.5 transition-all duration-300 ease-in-out sm:gap-2',
        // Mobile-first responsive design - slightly wider
        'w-full px-2 sm:w-[94%] sm:px-3 md:w-[92%] md:px-4 lg:w-[90%]',
        // Responsive max-width - slightly wider for better UX
        'xl:max-w-none 2xl:max-w-none max-w-none sm:max-w-none md:max-w-none lg:max-w-none',
        // Responsive margins - moved up more
        centerFormOnLanding &&
          (conversationId == null || conversationId === Constants.NEW_CONVO) &&
          !isSubmitting &&
          conversation?.messages?.length === 0
          ? '-mb-8 transition-all duration-200 sm:-mb-7 md:-mb-6 lg:-mb-5'
          : '-mb-8 sm:-mb-7 md:-mb-6 lg:-mb-5',
      )}
    >
      <div className="relative flex h-full flex-1 items-stretch md:flex-col">
        <div className={cn('flex w-full items-center', isRTL && 'flex-row-reverse')}>
          {showPlusPopover && !isAssistantsEndpoint(endpoint) && (
            <Mention
              setShowMentionPopover={setShowPlusPopover}
              newConversation={generateConversation}
              textAreaRef={textAreaRef}
              commandChar="+"
              placeholder="com_ui_add_model_preset"
              includeAssistants={false}
            />
          )}
          {showMentionPopover && (
            <Mention
              setShowMentionPopover={setShowMentionPopover}
              newConversation={newConversation}
              textAreaRef={textAreaRef}
            />
          )}
          <PromptsCommand index={index} textAreaRef={textAreaRef} submitPrompt={submitPrompt} />
          <div
            onClick={handleContainerClick}
            className={cn(
              'relative mt-2 flex w-full min-w-full flex-grow flex-col overflow-hidden rounded-t-[1.5rem] border-[1.5px] pb-1 text-text-primary transition-all duration-200 sm:rounded-[1.75rem] sm:pb-1 shadow-[0_10px_20px_-5px_rgba(0,0,0,0.09),0_-10px_20px_-5px_rgba(0,0,0,0.09)]',
              // Elevated, layered shadows above and below for better separation from background
              'dark:shadow-[0_22px_50px_-24px_rgba(2,6,23,0.7),0_-14px_32px_-24px_rgba(2,6,23,0.45),inset_0_1px_4px_rgba(59,130,246,0.08)]',
              isTemporary
                ? 'border-black/10 bg-violet-50/90 dark:border-white/10 dark:bg-violet-950/40'
                : 'border-black/10 bg-white dark:border-white/10 dark:bg-slate-900',
            )}
          >
            <TextareaHeader addedConvo={addedConvo} setAddedConvo={setAddedConvo} />
            <EditBadges
              isEditingChatBadges={isEditingBadges}
              handleCancelBadges={handleCancelBadges}
              handleSaveBadges={handleSaveBadges}
              setBadges={setBadges}
            />
            <FileFormChat disableInputs={disableInputs} />
            {endpoint && (
              <div className={cn('flex w-full', isRTL ? 'flex-row-reverse' : 'flex-row')}>
                <TextareaAutosize
                  {...registerProps}
                  ref={(e) => {
                    ref(e);
                    (textAreaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = e;
                  }}
                  disabled={disableInputs || isNotAppendable}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleKeyUp}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  id={mainTextareaId}
                  tabIndex={0}
                  data-testid="text-input"
                  rows={1}
                  onFocus={() => {
                    handleFocusOrClick();
                    setIsTextAreaFocused(true);
                  }}
                  onBlur={setIsTextAreaFocused.bind(null, false)}
                  onClick={handleFocusOrClick}
                  className={cn(
                    baseClasses,
                    removeFocusRings,
                    'transition-[max-height,opacity] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-60',
                    // Add special styling for dynamic placeholder with smooth appearance animation
                    'placeholder:text-gray-500 placeholder:dark:text-gray-400',
                    'placeholder:duration-800 placeholder:ease-[cubic-bezier(0.4,0,0.2,1)] placeholder:transition-all',
                    'dynamic-placeholder dynamic-placeholder-transition',
                    // Responsive textarea styling - reduced height
                    'max-h-[88px] min-h-[36px] w-full text-base sm:max-h-[120px] mt-2',
                  )}
                />
                <div className="flex flex-col items-start justify-start pt-1.5">
                  <CollapseChat
                    isCollapsed={isCollapsed}
                    isScrollable={isMoreThanThreeRows}
                    setIsCollapsed={setIsCollapsed}
                  />
                </div>
              </div>
            )}
            {/* BadgeRow rămâne în poziția actuală */}
            <div
              className={cn(
                'items-between flex gap-2 bg-transparent pb-1.5',
                isRTL ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              <BadgeRow
                showEphemeralBadges={!isAssistantsEndpoint(endpoint)}
                isSubmitting={isSubmitting || isSubmittingAdded}
                conversationId={conversationId}
                onChange={setBadges}
                isInChat={
                  Array.isArray(conversation?.messages) && conversation.messages.length >= 1
                }
              />
            </div>

            {/* Butoanele mutate mai jos */}
            <div className={cn(
              'flex items-center justify-between mt-2 px-1',
              isRTL ? 'flex-row-reverse' : 'flex-row'
            )}>
              <div className={`${isRTL ? 'mr-1' : 'ml-1'} flex items-center gap-1.5 sm:gap-2`}>
                <AttachFileChat disableInputs={disableInputs} />

                {/* Premium Shopping Buttons - Separate Components */}
                <DailyDealsButton />
                <DiscountHunterButton />
              </div>

              <div className={`${isRTL ? 'ml-1.5' : 'mr-1.5'}`}>
                {(isSubmitting || isSubmittingAdded) && (showStopButton || showStopAdded) ? (
                  <StopButton
  stop={handleStopGenerating}
  setShowStopButton={setShowStopButton}
  setShowStopAdded={setShowStopAdded}
/>
                ) : (
                  endpoint && (
                    <SendButton
                      ref={submitButtonRef}
                      control={methods.control}
                      disabled={filesLoading || isSubmitting || disableInputs || isNotAppendable}
                    />
                  )
                )}
              </div>
            </div>
            {TextToSpeech && automaticPlayback && <StreamAudio index={index} />}
          </div>
        </div>
      </div>
    </form>
  );
});

export default ChatForm;