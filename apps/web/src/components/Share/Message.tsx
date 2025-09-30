import { useRecoilValue } from 'recoil';
import type { TMessageProps } from '~/common';
import MinimalHoverButtons from '~/components/Chat/Messages/MinimalHoverButtons';
import MessageContent from '~/components/Chat/Messages/Content/MessageContent';
import SearchContent from '~/components/Chat/Messages/Content/SearchContent';
import SiblingSwitch from '~/components/Chat/Messages/SiblingSwitch';
import { Plugin } from '~/components/Messages/Content';
import MessageContainer from '~/components/common/MessageContainer';
import { MessageContext } from '~/Providers';
import { useAttachments } from '~/hooks';

import MultiMessage from './MultiMessage';
import { cn } from '~/utils';
import store from '~/store';

import Icon from './MessageIcon';

// CSS constants for reusability and performance
const SHARE_MESSAGE_STYLES = {
  wrapper:
    'text-token-text-primary w-full border-0 bg-transparent dark:border-0 dark:bg-transparent',
  container: 'm-auto justify-center p-4 py-2 md:gap-6',
  messageRender:
    'final-completion group mx-auto flex flex-1 gap-3 md:max-w-[47rem] md:px-5 lg:px-1 xl:max-w-[55rem] xl:px-5',
  avatar: 'relative flex flex-shrink-0 flex-col items-end',
  avatarInner: 'pt-0.5',
  avatarIcon: 'flex h-6 w-6 items-center justify-center overflow-hidden rounded-full',
  content: 'flex-col gap-1 md:gap-3',
  contentInner: 'flex max-w-full flex-grow flex-col gap-0',
} as const;

export default function Message(props: TMessageProps) {
  const fontSize = useRecoilValue(store.fontSize);
  const {
    message,
    siblingIdx,
    siblingCount,
    conversation,
    setSiblingIdx,
    currentEditId,
    setCurrentEditId,
  } = props;

  const { attachments, searchResults } = useAttachments({
    messageId: message?.messageId,
    attachments: message?.attachments,
  });

  if (!message) {
    return null;
  }

  const {
    text = '',
    children,
    error = false,
    messageId = '',
    unfinished = false,
    isCreatedByUser = true,
  } = message;

  let messageLabel = '';
  if (isCreatedByUser) {
    messageLabel = 'anonymous';
  } else {
    messageLabel = message.sender ?? '';
  }

  // SubRow content for share messages
  const subRowContent = (
    <>
      <SiblingSwitch
        siblingIdx={siblingIdx}
        siblingCount={siblingCount}
        setSiblingIdx={setSiblingIdx}
      />
      <MinimalHoverButtons message={message} searchResults={searchResults} />
    </>
  );

  return (
    <>
      <div className={SHARE_MESSAGE_STYLES.wrapper}>
        <div className={SHARE_MESSAGE_STYLES.container}>
          <div className={SHARE_MESSAGE_STYLES.messageRender}>
            <div className={SHARE_MESSAGE_STYLES.avatar}>
              <div>
                <div className={SHARE_MESSAGE_STYLES.avatarInner}>
                  <div className={SHARE_MESSAGE_STYLES.avatarIcon}>
                    <Icon message={message} conversation={conversation} />
                  </div>
                </div>
              </div>
            </div>
            <MessageContainer
              isCreatedByUser={isCreatedByUser}
              showSubRow={true}
              hasActions={true}
              messageId={message.messageId}
              subRowContent={subRowContent}
            >
              <div className={SHARE_MESSAGE_STYLES.content}>
                <div className={SHARE_MESSAGE_STYLES.contentInner}>
                  <MessageContext.Provider
                    value={{
                      messageId,
                      isExpanded: false,
                      conversationId: conversation?.conversationId,
                    }}
                  >
                    {/* Legacy Plugins */}
                    {message.plugin && <Plugin plugin={message.plugin} />}
                    {message.content ? (
                      <SearchContent
                        message={message}
                        attachments={attachments}
                        searchResults={searchResults}
                      />
                    ) : (
                      <MessageContent
                        edit={false}
                        error={error}
                        isLast={false}
                        ask={() => ({})}
                        text={text || ''}
                        message={message}
                        isSubmitting={false}
                        enterEdit={() => ({})}
                        unfinished={unfinished}
                        siblingIdx={siblingIdx ?? 0}
                        isCreatedByUser={isCreatedByUser}
                        setSiblingIdx={setSiblingIdx ?? (() => ({}))}
                      />
                    )}
                  </MessageContext.Provider>
                </div>
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
