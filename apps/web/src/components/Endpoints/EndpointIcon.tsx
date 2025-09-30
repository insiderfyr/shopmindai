import { isAssistantsEndpoint } from 'librechat-data-provider';
import type {
  TConversation,
  TEndpointsConfig,
  TPreset,
  TAssistantsMap,
} from 'librechat-data-provider';
import { icons } from '~/hooks/Endpoint/Icons';
import MinimalIcon from '~/components/Endpoints/MinimalIcon';
import { getEndpointField, getIconEndpoint } from '~/utils';

export default function EndpointIcon({
  conversation,
  endpointsConfig,
  className = 'mr-0',
  assistantMap,
  context,
}: {
  conversation: TConversation | TPreset | null;
  endpointsConfig: TEndpointsConfig;
  containerClassName?: string;
  context?: 'message' | 'nav' | 'landing' | 'menu-item';
  assistantMap?: TAssistantsMap;
  className?: string;
  size?: number;
}) {
  const convoIconURL = conversation?.iconURL ?? '';
  let endpoint = conversation?.endpoint;
  endpoint = getIconEndpoint({ endpointsConfig, iconURL: convoIconURL, endpoint });

  const endpointType = getEndpointField(endpointsConfig, endpoint, 'type');
  const endpointIconURL = getEndpointField(endpointsConfig, endpoint, 'iconURL');

  const assistant = isAssistantsEndpoint(endpoint)
    ? assistantMap?.[endpoint]?.[conversation?.assistant_id ?? '']
    : null;
  const assistantAvatar = (assistant && (assistant.metadata?.avatar as string)) || '';
  const assistantName = assistant && (assistant.name ?? '');

  const iconURL = assistantAvatar || convoIconURL;

  if (assistant && assistantAvatar) {
    return (
      <div className="icon-md">
        {icons.assistants && (
          <icons.assistants
            size={20}
            className="h-2/3 w-2/3"
            assistantName={assistantName ?? ''}
            avatar={assistantAvatar}
          />
        )}
      </div>
    );
  } else {
    return (
      <MinimalIcon
        size={20}
        iconURL={endpointIconURL}
        endpoint={endpoint}
        endpointType={endpointType}
        model={conversation?.model}
        error={false}
        className={className}
        isCreatedByUser={false}
        chatGptLabel={undefined}
        modelLabel={undefined}
      />
    );
  }
}
