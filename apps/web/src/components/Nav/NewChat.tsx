import React, { useCallback } from 'react';
import { useRecoilValue } from 'recoil';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { QueryKeys, Constants } from 'librechat-data-provider';
import type { TMessage, TStartupConfig } from 'librechat-data-provider';
import { NewChatIcon } from '~/components/svg';
import { getDefaultModelSpec, getModelSpecPreset } from '~/utils';
import { TooltipAnchor, Button } from '~/components/ui';
import { useLocalize, useNewConvo } from '~/hooks';
import store from '~/store';

export default function NewChat({
  index = 0,
  toggleNav,
  subHeaders,
  isSmallScreen,
  headerButtons,
}: {
  index?: number;
  toggleNav: () => void;
  isSmallScreen?: boolean;
  subHeaders?: React.ReactNode;
  headerButtons?: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  /** Note: this component needs an explicit index passed if using more than one */
  const { newConversation: newConvo } = useNewConvo(index);
  const navigate = useNavigate();
  const localize = useLocalize();
  const { conversation } = store.useCreateConversationAtom(index);

  const clickHandler: React.MouseEventHandler<HTMLButtonElement> = useCallback(
    (e) => {
      if (e.button === 0 && (e.ctrlKey || e.metaKey)) {
        window.open('/c/new', '_blank');
        return;
      }
      queryClient.setQueryData<TMessage[]>(
        [QueryKeys.messages, conversation?.conversationId ?? Constants.NEW_CONVO],
        [],
      );
      queryClient.invalidateQueries([QueryKeys.messages]);
      newConvo();
      navigate('/c/new', { state: { focusChat: true } });
      if (isSmallScreen) {
        toggleNav();
      }
    },
    [queryClient, conversation, newConvo, navigate, toggleNav, isSmallScreen],
  );

  return (
    <>
      <div className="flex items-center justify-between py-[2px] md:py-2">
        <TooltipAnchor
          description={localize('com_nav_close_sidebar')}
          render={
            <Button
              size="icon"
              variant="outline"
              data-testid="close-sidebar-button"
              aria-label={localize('com_nav_close_sidebar')}
              className="rounded-md border-none bg-transparent p-2 hover:bg-gray-200 dark:hover:bg-slate-800 md:rounded-md"
              onClick={toggleNav}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="max-md:hidden text-slate-700 dark:text-white"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="m-1 inline-flex size-10 items-center justify-center text-slate-700 dark:text-white md:hidden"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Button>
          }
        />
        <div className="flex">
          {headerButtons}
          <TooltipAnchor
            description={localize('com_ui_new_chat')}
            render={
              <Button
                size="icon"
                variant="outline"
                data-testid="nav-new-chat-button"
                aria-label={localize('com_ui_new_chat')}
                className="rounded-md border-none bg-transparent p-2 hover:bg-gray-200 dark:hover:bg-slate-800 md:rounded-md"
                onClick={clickHandler}
              >
                <NewChatIcon className="icon-md md:h-6 md:w-6" />
              </Button>
            }
          />
        </div>
      </div>
      {subHeaders != null ? subHeaders : null}
    </>
  );
}
