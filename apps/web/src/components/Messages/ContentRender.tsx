import { useRecoilValue } from 'recoil';
import { useCallback, useMemo, memo } from 'react';
import type { TMessage, TMessageContentParts } from 'librechat-data-provider';
import type { TMessageProps } from '~/common';
import ContentParts from '~/components/Chat/Messages/Content/ContentParts';
import PlaceholderRow from '~/components/Chat/Messages/ui/PlaceholderRow';
import SiblingSwitch from '~/components/Chat/Messages/SiblingSwitch';
import HoverButtons from '~/components/Chat/Messages/HoverButtons';

import { useAttachments, useMessageActions } from '~/hooks';
import MessageContainer from '~/components/common/MessageContainer';
import { cn, logger } from '~/utils';
import store from '~/store';

type ContentRenderProps = {
  message?: TMessage;
  isCard?: boolean;
  isMultiMessage?: boolean;
  isSubmittingFamily?: boolean;
} & Pick<
  TMessageProps,
  'currentEditId' | 'setCurrentEditId' | 'siblingIdx' | 'setSiblingIdx' | 'siblingCount'
>;

// Helper function to create SubRow content - extracted to reduce duplication
const createSubRowContent = (
  shouldShowSubRow: boolean,
  siblingIdx: number | undefined,
  siblingCount: number | undefined,
  setSiblingIdx: ((value: number) => void) | null | undefined,
  index: number,
  edit: boolean,
  msg: TMessage,
  enterEdit: (cancel?: boolean) => void,
  isSubmitting: boolean,
  conversation: any,
  handleRegenerateMessage: () => void,
  copyToClipboard: (setIsCopied: React.Dispatch<React.SetStateAction<boolean>>) => void,
  handleContinue: (e: React.MouseEvent<HTMLButtonElement>) => void,
  latestMessage: TMessage | null,
  handleFeedback: ({ feedback }: { feedback: any }) => void,
  isLast: boolean,
) => {
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
};

const ContentRender = memo(
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
  }: ContentRenderProps) => {
    const { attachments, searchResults } = useAttachments({
      messageId: msg?.messageId,
      attachments: msg?.attachments,
    });

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
      searchResults,
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
        card: 'relative w-full gap-1 rounded-2xl border border-border-medium bg-surface-primary-alt p-2 md:w-1/2 md:gap-3 md:p-4',
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
      return !((isSubmittingFamily || isSubmitting) && !(msg.children?.length ?? 0));
    }, [isSubmittingFamily, isSubmitting, msg.children?.length]);

    // SubRow content - using the helper function
    const subRowContent = useMemo(() => {
      return createSubRowContent(
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
          subRowContent={subRowContent}
        >
          <div className="flex flex-col gap-1">
            <div className="flex max-w-full flex-grow flex-col gap-0">
              <ContentParts
                edit={edit}
                isLast={isLast}
                enterEdit={enterEdit}
                siblingIdx={siblingIdx}
                messageId={msg.messageId}
                attachments={attachments}
                isSubmitting={isSubmitting}
                searchResults={searchResults}
                setSiblingIdx={setSiblingIdx}
                isCreatedByUser={msg.isCreatedByUser}
                conversationId={conversation?.conversationId}
                content={msg.content as Array<TMessageContentParts | undefined>}
              />
            </div>

            {(isSubmittingFamily || isSubmitting) && !(msg.children?.length ?? 0) ? (
              <PlaceholderRow isCard={isCard} />
            ) : null}
          </div>
        </MessageContainer>
      </div>
    );
  },
);

ContentRender.displayName = 'ContentRender';

export default ContentRender;
