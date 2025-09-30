import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { useAuthContext, useLocalize } from '~/hooks';
import type { TMessageProps, TMessageIcon } from '~/common';
import MinimalHoverButtons from '~/components/Chat/Messages/MinimalHoverButtons';
import Icon from '~/components/Chat/Messages/MessageIcon';
import SearchContent from './Content/SearchContent';
import SearchButtons from './SearchButtons';
import MessageContainer from '~/components/common/MessageContainer';
import { cn } from '~/utils';
import store from '~/store';

// CSS constants for reusability and performance
const SEARCH_MESSAGE_STYLES = {
  wrapper: 'text-token-text-primary w-full bg-transparent',
  container: 'm-auto p-4 py-2 md:gap-6',
  messageRender:
    'final-completion group mx-auto flex flex-1 gap-3 md:max-w-3xl md:px-5 lg:max-w-[40rem] lg:px-1 xl:max-w-[48rem] xl:px-5',
  avatar: 'relative flex flex-shrink-0 flex-col items-end',
  avatarInner: 'pt-0.5',
  avatarIcon: 'flex h-6 w-6 items-center justify-center overflow-hidden rounded-full',
} as const;

const MessageAvatar = ({ iconData }: { iconData: TMessageIcon }) => (
  <div className={SEARCH_MESSAGE_STYLES.avatar}>
    <div className={SEARCH_MESSAGE_STYLES.avatarInner}>
      <div className={SEARCH_MESSAGE_STYLES.avatarIcon}>
        <Icon iconData={iconData} />
      </div>
    </div>
  </div>
);

const MessageBody = ({ message, messageLabel, fontSize }) => {
  // SubRow content for search messages
  const subRowContent = useMemo(() => {
    return (
      <>
        <MinimalHoverButtons message={message} />
        <SearchButtons message={message} />
      </>
    );
  }, [message]);

  return (
    <MessageContainer
      isCreatedByUser={message.isCreatedByUser}
      showSubRow={true}
      hasActions={true}
      messageId={message.messageId}
      subRowContent={subRowContent}
    >
      <SearchContent message={message} />
    </MessageContainer>
  );
};

export default function SearchMessage({ message }: Pick<TMessageProps, 'message'>) {
  const UsernameDisplay = useRecoilValue<boolean>(store.UsernameDisplay);
  const fontSize = useRecoilValue(store.fontSize);
  const { user } = useAuthContext();
  const localize = useLocalize();

  const iconData: TMessageIcon = useMemo(
    () => ({
      endpoint: message?.endpoint ?? '',
      model: message?.model ?? '',
      iconURL: message?.iconURL ?? '',
      isCreatedByUser: message?.isCreatedByUser ?? false,
    }),
    [message?.endpoint, message?.model, message?.iconURL, message?.isCreatedByUser],
  );

  const messageLabel = useMemo(() => {
    if (message?.isCreatedByUser) {
      return UsernameDisplay
        ? (user?.name ?? '') || (user?.username ?? '')
        : localize('com_user_message');
    }
    return message?.sender ?? '';
  }, [
    message?.isCreatedByUser,
    message?.sender,
    UsernameDisplay,
    user?.name,
    user?.username,
    localize,
  ]);

  if (!message) {
    return null;
  }

  return (
    <div className={SEARCH_MESSAGE_STYLES.wrapper}>
      <div className={SEARCH_MESSAGE_STYLES.container}>
        <div className={SEARCH_MESSAGE_STYLES.messageRender}>
          <MessageAvatar iconData={iconData} />
          <MessageBody message={message} messageLabel={messageLabel} fontSize={fontSize} />
        </div>
      </div>
    </div>
  );
}
