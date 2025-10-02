import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { CSSTransition } from 'react-transition-group';
import type { TMessage } from 'librechat-data-provider';
import { useMessageScrolling, useLocalize } from '~/hooks';
import ScrollToBottom from '~/components/Messages/ScrollToBottom';
import MultiMessage from './MultiMessage';
import { cn } from '~/utils';
import store from '~/store';

export default function MessagesView({
  messagesTree: _messagesTree,
}: {
  messagesTree?: TMessage[] | null;
}) {
  const localize = useLocalize();
  const fontSize = useRecoilValue(store.fontSize);
  const scrollButtonPreference = useRecoilValue(store.showScrollButton);
  const [currentEditId, setCurrentEditId] = useState<number | string | null>(-1);

  const {
    conversation,
    scrollableRef,
    messagesEndRef,
    showScrollButton,
    handleSmoothToRef,
    debouncedHandleScroll,
  } = useMessageScrolling(_messagesTree);

  const { conversationId } = conversation ?? {};

  return (
    <div className="relative flex-1 overflow-hidden overflow-y-auto bg-surface-chat dark:bg-[#182533]">
      <div className="relative h-full">
        <div
          className="scrollbar-gutter-stable bg-surface-chat dark:bg-[#182533]"
          onScroll={debouncedHandleScroll}
          ref={scrollableRef}
          style={{
            height: '100%',
            overflowY: 'auto',
            width: '100%',
          }}
        >
          <div className="flex flex-col bg-surface-chat pb-6 dark:bg-[#182533] sm:pb-8 md:pb-9">
            {(_messagesTree && _messagesTree.length === 0) || _messagesTree === null ? (
              <div
                className={cn(
                  'flex w-full items-center justify-center p-3 text-text-secondary',
                  fontSize,
                )}
              >
                {localize('com_ui_nothing_found')}
              </div>
            ) : (
              <MultiMessage
                key={conversationId}
                messagesTree={_messagesTree}
                messageId={conversationId ?? null}
                setCurrentEditId={setCurrentEditId}
                currentEditId={currentEditId ?? null}
              />
            )}

            <div
              id="messages-end"
              className="group h-0 w-full flex-shrink-0"
              ref={messagesEndRef}
            />
          </div>
        </div>

        <CSSTransition
          in={showScrollButton && scrollButtonPreference}
          timeout={{
            enter: 550,
            exit: 700,
          }}
          classNames="scroll-animation"
          unmountOnExit={true}
          appear={true}
        >
          <ScrollToBottom scrollHandler={handleSmoothToRef} />
        </CSSTransition>
      </div>
    </div>
  );
}
