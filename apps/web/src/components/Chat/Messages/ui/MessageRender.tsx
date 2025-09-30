import React, { useCallback, useMemo, memo } from 'react';
import { useRecoilValue } from 'recoil';
import { type TMessage } from 'librechat-data-provider';
import type { TMessageProps } from '~/common';
import MessageContent from '~/components/Chat/Messages/Content/MessageContent';
import PlaceholderRow from '~/components/Chat/Messages/ui/PlaceholderRow';
import SiblingSwitch from '~/components/Chat/Messages/SiblingSwitch';
import HoverButtons from '~/components/Chat/Messages/HoverButtons';

import { Plugin } from '~/components/Messages/Content';
import MessageContainer from '~/components/common/MessageContainer';
import { MessageContext } from '~/Providers';
import { useMessageActions } from '~/hooks';
import { cn, logger } from '~/utils';
import store from '~/store';

type MessageRenderProps = {
  message?: TMessage;
  isCard?: boolean;
  isMultiMessage?: boolean;
  isSubmittingFamily?: boolean;
} & Pick<
  TMessageProps,
  'currentEditId' | 'setCurrentEditId' | 'siblingIdx' | 'setSiblingIdx' | 'siblingCount'
>;

const MessageRender = memo(
  ({
    message: msg,
    isCard = false,
    siblingIdx,
    siblingCount,
    setSiblingIdx,
    currentEditId,
    isMultiMessage = false,
    setCurrentEditId,
    isSubmittingFamily = false,
  }: MessageRenderProps) => {
    const {
      ask,
      edit,
      index,
      agent,
      assistant,
      enterEdit,
      conversation,
      messageLabel,
      isSubmitting,
      latestMessage,
      handleContinue,
      copyToClipboard,
      setLatestMessage,
      regenerateMessage,
      handleFeedback,
    } = useMessageActions({
      message: msg,
      currentEditId,
      isMultiMessage,
      setCurrentEditId,
    });
    const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);
    const fontSize = useRecoilValue(store.fontSize);

    const handleRegenerateMessage = useCallback(() => regenerateMessage(), [regenerateMessage]);
    const hasNoChildren = !(msg?.children?.length ?? 0);
    const isLast = useMemo(
      () => hasNoChildren && (msg?.depth === latestMessage?.depth || msg?.depth === -1),
      [hasNoChildren, msg?.depth, latestMessage?.depth],
    );
    const isLatestMessage = msg?.messageId === latestMessage?.messageId;
    const showCardRender = isLast && !isSubmittingFamily && isCard;
    const isLatestCard = isCard && !isSubmittingFamily && isLatestMessage;

    const clickHandler = useMemo(
      () =>
        showCardRender && !isLatestMessage
          ? () => {
              logger.log(`Message Card click: Setting ${msg?.messageId} as latest message`);
              logger.dir(msg);
              setLatestMessage(msg!);
            }
          : undefined,
      [showCardRender, isLatestMessage, msg, setLatestMessage],
    );

    const baseClasses = useMemo(
      () => ({
        common: 'group mx-auto flex flex-1 gap-3 transition-all duration-300 transform-gpu ',
        card: 'relative w-full gap-1 rounded-lg border border-border-medium bg-surface-primary-alt p-2 md:w-1/2 md:gap-3 md:p-4',
        chat: maximizeChatSpace
          ? 'w-full max-w-full md:px-5 lg:px-1 xl:px-5'
          : 'md:max-w-[47rem] xl:max-w-[55rem]',
      }),
      [maximizeChatSpace],
    );

    if (!msg) {
      return null;
    }

    const conditionalClasses = useMemo(
      () => ({
        latestCard: isLatestCard ? 'bg-surface-secondary' : '',
        cardRender: showCardRender ? 'cursor-pointer transition-colors duration-300' : '',
        focus: 'focus:outline-none focus:ring-2 focus:ring-border-xheavy',
      }),
      [isLatestCard, showCardRender],
    );

    // Helper function to determine if SubRow should be shown
    const shouldShowSubRow = useMemo(() => {
      return !hasNoChildren && !(isSubmittingFamily === true || isSubmitting);
    }, [hasNoChildren, isSubmittingFamily, isSubmitting]);

    // SubRow content for user messages
    const userSubRowContent = useMemo(() => {
      if (!shouldShowSubRow) return null;

      return (
        <>
          <SiblingSwitch
            siblingIdx={siblingIdx}
            siblingCount={siblingCount}
            setSiblingIdx={setSiblingIdx}
          />
          <HoverButtons
            index={index}
            isEditing={edit}
            message={msg}
            enterEdit={enterEdit}
            isSubmitting={isSubmitting}
            conversation={conversation ?? null}
            regenerate={handleRegenerateMessage}
            copyToClipboard={copyToClipboard}
            handleContinue={handleContinue}
            latestMessage={latestMessage}
            handleFeedback={handleFeedback}
            isLast={isLast}
          />
        </>
      );
    }, [
      shouldShowSubRow,
      siblingIdx,
      siblingCount,
      setSiblingIdx,
      index,
      edit,
      msg,
      enterEdit,
      isSubmitting,
      conversation,
      handleRegenerateMessage,
      copyToClipboard,
      handleContinue,
      latestMessage,
      handleFeedback,
      isLast,
    ]);

    // SubRow content for agent messages
    const agentSubRowContent = useMemo(() => {
      if (!shouldShowSubRow) return null;

      return (
        <>
          <SiblingSwitch
            siblingIdx={siblingIdx}
            siblingCount={siblingCount}
            setSiblingIdx={setSiblingIdx}
          />
          <HoverButtons
            index={index}
            isEditing={edit}
            message={msg}
            enterEdit={enterEdit}
            isSubmitting={isSubmitting}
            conversation={conversation ?? null}
            regenerate={handleRegenerateMessage}
            copyToClipboard={copyToClipboard}
            handleContinue={handleContinue}
            latestMessage={latestMessage}
            handleFeedback={handleFeedback}
            isLast={isLast}
          />
        </>
      );
    }, [
      shouldShowSubRow,
      siblingIdx,
      siblingCount,
      setSiblingIdx,
      index,
      edit,
      msg,
      enterEdit,
      isSubmitting,
      conversation,
      handleRegenerateMessage,
      copyToClipboard,
      handleContinue,
      latestMessage,
      handleFeedback,
      isLast,
    ]);

    return (
      <div
        id={msg.messageId}
        aria-label={`message-${msg.depth}-${msg.messageId}`}
        className={cn(
          baseClasses.common,
          isCard ? baseClasses.card : baseClasses.chat,
          conditionalClasses.latestCard,
          conditionalClasses.cardRender,
          conditionalClasses.focus,
          'message-render',
        )}
        onClick={clickHandler}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && clickHandler) {
            clickHandler();
          }
        }}
        role={showCardRender ? 'button' : undefined}
        tabIndex={showCardRender ? 0 : undefined}
      >
        {isLatestCard && (
          <div className="absolute right-0 top-0 m-2 h-3 w-3 rounded-full bg-text-primary" />
        )}

        <MessageContainer
          isCreatedByUser={msg.isCreatedByUser}
          showSubRow={shouldShowSubRow}
          isSubmitting={isSubmitting}
          hasActions={true}
          isCard={isCard}
          messageId={msg.messageId}
          subRowContent={msg.isCreatedByUser ? userSubRowContent : agentSubRowContent}
        >
          <div className="flex flex-col gap-1">
            <div className="flex max-w-full flex-grow flex-col gap-0">
              <MessageContext.Provider
                value={{
                  messageId: msg.messageId,
                  conversationId: conversation?.conversationId,
                  isExpanded: false,
                }}
              >
                {msg.plugin && <Plugin plugin={msg.plugin} />}
                <MessageContent
                  ask={ask}
                  edit={edit}
                  isLast={isLast}
                  text={msg.text || ''}
                  message={msg}
                  enterEdit={enterEdit}
                  error={!!(msg.error ?? false)}
                  isSubmitting={isSubmitting}
                  unfinished={msg.unfinished ?? false}
                  isCreatedByUser={msg.isCreatedByUser ?? true}
                  siblingIdx={siblingIdx ?? 0}
                  setSiblingIdx={setSiblingIdx ?? (() => ({}))}
                />
              </MessageContext.Provider>
            </div>

            {hasNoChildren && (isSubmittingFamily === true || isSubmitting) ? (
              <PlaceholderRow isCard={isCard} />
            ) : null}
          </div>
        </MessageContainer>
      </div>
    );
  },
);

MessageRender.displayName = 'MessageRender';

export default MessageRender;
