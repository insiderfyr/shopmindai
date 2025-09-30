import React, { memo, useMemo, Suspense } from 'react';
import { useRecoilValue } from 'recoil';
import { useChatContext } from '~/Providers';
import { cn } from '~/utils';
import store from '~/store';
import Markdown from './Markdown';
import MarkdownLite from './MarkdownLite';
import Container from './Container';
import { DelayedRender } from '~/components/ui';
import type { TMessageContentProps, TDisplayProps } from '~/common';
import type { TMessage } from 'librechat-data-provider';
import EditMessage from './EditMessage';

export const ErrorMessage = ({ message, text }: { message: TMessage; text: string }) => (
  <Container message={message}>
    <div className="markdown prose dark:prose-invert light w-full break-words">
      <div className="flex items-center gap-2 text-red-500">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white">
          <svg
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <span className="text-sm font-medium">Error: {text}</span>
      </div>
    </div>
  </Container>
);

const DisplayMessage = ({ text, isCreatedByUser, message, showCursor }: TDisplayProps) => {
  const { isSubmitting, latestMessage } = useChatContext();
  const enableUserMsgMarkdown = useRecoilValue(store.enableUserMsgMarkdown);
  const showCursorState = useMemo(
    () => showCursor === true && isSubmitting,
    [showCursor, isSubmitting],
  );
  const isLatestMessage = useMemo(
    () => message.messageId === latestMessage?.messageId,
    [message.messageId, latestMessage?.messageId],
  );

  return (
    <Container message={message}>
      {/* Removed CinematicTyping, replaced with simple text display */}
      <div
        className={cn(
          isSubmitting ? 'submitting' : '',
          showCursorState && !!text.length ? 'result-streaming' : '',
          'markdown prose message-content dark:prose-invert light w-full break-words',
          isCreatedByUser && !enableUserMsgMarkdown && 'whitespace-pre-wrap',
          isCreatedByUser ? 'dark:text-gray-20' : 'dark:text-gray-100',
        )}
      >
        {isCreatedByUser && enableUserMsgMarkdown ? (
          <MarkdownLite content={text} />
        ) : (
          <Markdown content={text} isLatestMessage={isLatestMessage} />
        )}
      </div>
    </Container>
  );
};

export const UnfinishedMessage = ({ message }: { message: TMessage }) => (
  <Container message={message}>
    <div className="markdown prose dark:prose-invert light w-full break-words">
      <div className="flex items-center gap-2 text-gray-500">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-500 text-white">
          <svg
            stroke="currentColor"
            fill="none"
            strokeWidth="2"
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </div>
        <span className="text-sm font-medium">Message was cut off</span>
      </div>
    </div>
  </Container>
);

const MessageContent = ({
  text,
  edit,
  error,
  unfinished,
  isSubmitting,
  isLast,
  ...props
}: TMessageContentProps) => {
  const { message } = props;
  const { messageId } = message;

  const { thinkingContent, regularContent } = useMemo(() => {
    const thinkingMatch = text.match(/:::thinking([\s\S]*?):::/);
    return {
      thinkingContent: thinkingMatch ? thinkingMatch[1].trim() : '',
      regularContent: thinkingMatch ? text.replace(/:::thinking[\s\S]*?:::/, '').trim() : text,
    };
  }, [text]);

  const showRegularCursor = useMemo(() => isLast && isSubmitting, [isLast, isSubmitting]);

  const unfinishedMessage = useMemo(
    () =>
      !isSubmitting && unfinished ? (
        <Suspense>
          <DelayedRender delay={250}>
            <UnfinishedMessage message={message} />
          </DelayedRender>
        </Suspense>
      ) : null,
    [isSubmitting, unfinished, message],
  );

  if (error) {
    return <ErrorMessage message={props.message} text={text} />;
  } else if (edit) {
    return <EditMessage text={text} isSubmitting={isSubmitting} {...props} />;
  }

  return (
    <>
      {thinkingContent.length > 0 && (
        <div key={`thinking-${messageId}`} className="text-gray-500 italic">
          {thinkingContent}
        </div>
      )}
      <DisplayMessage
        key={`display-${messageId}`}
        showCursor={showRegularCursor}
        text={regularContent}
        {...props}
      />
      {unfinishedMessage}
    </>
  );
};

export default memo(MessageContent);
