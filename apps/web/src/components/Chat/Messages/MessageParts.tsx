import React, { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import type { TMessageContentParts } from 'librechat-data-provider';
import type { TMessageProps } from '~/common';
import { useMessageActions, useLocalize, useAttachments } from '~/hooks';

import ContentParts from './Content/ContentParts';
import SiblingSwitch from './SiblingSwitch';

import MultiMessage from './MultiMessage';
import HoverButtons from './HoverButtons';
import MessageContainer from '~/components/common/MessageContainer';
import { cn } from '~/utils';
import store from '~/store';

// CSS constants for reusability and performance
const MESSAGE_STYLES = {
  wrapper: 'w-full border-0 bg-transparent dark:border-0 dark:bg-transparent',
  container: 'm-auto justify-center p-4 py-2 md:gap-6',
  messageRender: 'group mx-auto flex flex-1 gap-3 transition-all duration-300 transform-gpu',
  chat: {
    full: 'w-full max-w-full md:px-5 lg:px-1 xl:px-5',
    limited: 'md:max-w-[47rem] xl:max-w-[55rem]',
  },
  content: 'flex flex-col gap-1',
  contentInner: 'flex max-w-full flex-grow flex-col gap-0',
  placeholder: 'mt-1 h-[27px] bg-transparent',
} as const;

export default function Message(props: TMessageProps) {
  const localize = useLocalize();
  const { message, siblingIdx, siblingCount, setSiblingIdx, currentEditId, setCurrentEditId } =
    props;
  const { attachments, searchResults } = useAttachments({
    messageId: message?.messageId,
    attachments: message?.attachments,
  });
  const {
    edit,
    index,
    agent,
    isLast,
    enterEdit,
    assistant,
    handleScroll,
    conversation,
    isSubmitting,
    latestMessage,
    handleContinue,
    copyToClipboard,
    regenerateMessage,
    handleFeedback,
  } = useMessageActions({
    message,
    currentEditId,
    setCurrentEditId,
    searchResults,
  });

  const fontSize = useRecoilValue(store.fontSize);
  const maximizeChatSpace = useRecoilValue(store.maximizeChatSpace);
  const { children, messageId = null, isCreatedByUser } = message ?? {};

  const name = useMemo(() => {
    let result = '';
    if (isCreatedByUser === true) {
      result = localize('com_user_message');
    } else if (assistant) {
      result = assistant.name ?? localize('com_ui_assistant');
    } else if (agent) {
      result = agent.name ?? localize('com_ui_agent');
    }

    return result;
  }, [assistant, agent, isCreatedByUser, localize]);

  const baseClasses = useMemo(
    () => ({
      common: MESSAGE_STYLES.messageRender,
      chat: maximizeChatSpace ? MESSAGE_STYLES.chat.full : MESSAGE_STYLES.chat.limited,
    }),
    [maximizeChatSpace],
  );

  // Helper function to determine if SubRow should be shown
  const shouldShowSubRow = useMemo(() => {
    return !(isLast && isSubmitting);
  }, [isLast, isSubmitting]);

  // SubRow content
  const subRowContent = useMemo(() => {
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
          message={message}
          enterEdit={enterEdit}
          isSubmitting={isSubmitting}
          conversation={conversation ?? null}
          regenerate={() => regenerateMessage()}
          copyToClipboard={copyToClipboard}
          handleContinue={handleContinue}
          latestMessage={latestMessage}
          isLast={isLast}
          handleFeedback={handleFeedback}
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
    message,
    enterEdit,
    isSubmitting,
    conversation,
    regenerateMessage,
    copyToClipboard,
    handleContinue,
    latestMessage,
    isLast,
    handleFeedback,
  ]);

  if (!message) {
    return null;
  }

  return (
    <>
      <div className={MESSAGE_STYLES.wrapper} onWheel={handleScroll} onTouchMove={handleScroll}>
        <div className={MESSAGE_STYLES.container}>
          <div
            id={messageId ?? ''}
            aria-label={`message-${message.depth}-${messageId}`}
            className={cn(baseClasses.common, baseClasses.chat, 'message-render')}
          >
            <MessageContainer
              isCreatedByUser={isCreatedByUser}
              showSubRow={shouldShowSubRow}
              isSubmitting={isSubmitting}
              hasActions={true}
              messageId={message.messageId}
              subRowContent={subRowContent}
            >
              <div className={MESSAGE_STYLES.content}>
                <div className={MESSAGE_STYLES.contentInner}>
                  <ContentParts
                    edit={edit}
                    isLast={isLast}
                    enterEdit={enterEdit}
                    siblingIdx={siblingIdx}
                    attachments={attachments}
                    isSubmitting={isSubmitting}
                    searchResults={searchResults}
                    messageId={message.messageId}
                    setSiblingIdx={setSiblingIdx}
                    isCreatedByUser={message.isCreatedByUser}
                    conversationId={conversation?.conversationId}
                    content={message.content as Array<TMessageContentParts | undefined>}
                  />
                </div>
                {isLast && isSubmitting ? <div className={MESSAGE_STYLES.placeholder} /> : null}
              </div>
            </MessageContainer>
          </div>
        </div>
      </div>
      <MultiMessage
        key={messageId}
        messageId={messageId}
        conversation={conversation}
        messagesTree={children ?? []}
        currentEditId={currentEditId}
        setCurrentEditId={setCurrentEditId}
      />
    </>
  );
}
