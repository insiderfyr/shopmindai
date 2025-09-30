import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { useCallback, useMemo } from 'react';
import { useUpdateFeedbackMutation } from 'librechat-data-provider/react-query';
import {
  isAssistantsEndpoint,
  isAgentsEndpoint,
  TUpdateFeedbackRequest,
  getTagByKey,
  TFeedback,
  toMinimalFeedback,
  SearchResultData,
} from 'librechat-data-provider';
import type { TMessageProps } from '~/common';
import {
  useChatContext,
  useAddedChatContext,
} from '~/Providers';
import useCopyToClipboard from './useCopyToClipboard';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';
import store from '~/store';

export type TMessageActions = Pick<
  TMessageProps,
  'message' | 'currentEditId' | 'setCurrentEditId'
> & {
  isMultiMessage?: boolean;
  searchResults?: { [key: string]: SearchResultData };
};

export default function useMessageActions(props: TMessageActions) {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const UsernameDisplay = useRecoilValue<boolean>(store.UsernameDisplay);
  const { message, currentEditId, setCurrentEditId, isMultiMessage, searchResults } = props;

  const {
    ask,
    index,
    regenerate,
    latestMessage,
    handleContinue,
    setLatestMessage,
    conversation: rootConvo,
    isSubmitting: isSubmittingRoot,
  } = useChatContext();
  const { conversation: addedConvo, isSubmitting: isSubmittingAdditional } = useAddedChatContext();
  const conversation = useMemo(
    () => (isMultiMessage === true ? addedConvo : rootConvo),
    [isMultiMessage, addedConvo, rootConvo],
  );

  const { text, content, messageId = null, isCreatedByUser } = message ?? {};
  const edit = useMemo(() => messageId === currentEditId, [messageId, currentEditId]);

  const [feedback, setFeedback] = useState<TFeedback | undefined>(() => {
    if (message?.feedback) {
      const tag = getTagByKey(message.feedback?.tag?.key);
      return {
        rating: message.feedback.rating,
        tag,
        text: message.feedback.text,
      };
    }
    return undefined;
  });

  const enterEdit = useCallback(
    (cancel?: boolean) => setCurrentEditId && setCurrentEditId(cancel === true ? -1 : messageId),
    [messageId, setCurrentEditId],
  );

  // Eliminăm logica referitoare la assistantMap și agentsMap
  const isSubmitting = useMemo(
    () => (isMultiMessage === true ? isSubmittingAdditional : isSubmittingRoot),
    [isMultiMessage, isSubmittingAdditional, isSubmittingRoot],
  );

  const regenerateMessage = useCallback(() => {
    if ((isSubmitting && isCreatedByUser === true) || !message) {
      return;
    }

    regenerate(message);
  }, [isSubmitting, isCreatedByUser, message, regenerate]);

  const copyToClipboard = useCopyToClipboard({ text, content, searchResults });

  const messageLabel = useMemo(() => {
    if (message?.isCreatedByUser === true) {
      return UsernameDisplay ? (user?.name ?? '') || user?.username : localize('com_user_message');
    } else {
      return message?.sender;
    }
  }, [message, UsernameDisplay, user, localize]);

  const feedbackMutation = useUpdateFeedbackMutation(
    conversation?.conversationId || '',
    message?.messageId || '',
  );

  const handleFeedback = useCallback(
    ({ feedback: newFeedback }: { feedback: TFeedback | undefined }) => {
      const payload: TUpdateFeedbackRequest = {
        feedback: newFeedback ? toMinimalFeedback(newFeedback) : undefined,
      };

      feedbackMutation.mutate(payload, {
        onSuccess: (data) => {
          if (!data.feedback) {
            setFeedback(undefined);
          } else {
            const tag = getTagByKey(data.feedback?.tag ?? undefined);
            setFeedback({
              rating: data.feedback.rating,
              tag,
              text: data.feedback.text,
            });
          }
        },
        onError: (error) => {
          console.error('Failed to update feedback:', error);
        },
      });
    },
    [feedbackMutation],
  );

  return {
    ask,
    edit,
    index,
    conversation,
    messageLabel,
    isSubmitting,
    latestMessage,
    handleContinue,
    copyToClipboard,
    setLatestMessage,
    regenerateMessage,
    handleFeedback,
    feedback,
  };
}
