import { useMemo } from 'react';
import { useGetModelsQuery } from 'librechat-data-provider/react-query';
import {
  Permissions,
  alternateName,
  EModelEndpoint,
  PermissionTypes,
  isAssistantsEndpoint,
  getConfigDefaults,
} from 'librechat-data-provider';
import type { TAssistantsMap, TEndpointsConfig } from 'librechat-data-provider';
import type { MentionOption } from '~/common';
import {
  useGetPresetsQuery,
  useGetEndpointsQuery,
  useGetStartupConfig,
} from '~/data-provider';
import useAssistantListMap from '~/hooks/Assistants/useAssistantListMap';
import { mapEndpoints, getPresetTitle } from '~/utils';
import { EndpointIcon } from '~/components/Endpoints';

const defaultInterface = getConfigDefaults().interface;

export default function useMentions({
  assistantMap,
  includeAssistants,
}: {
  assistantMap: TAssistantsMap;
  includeAssistants: boolean;
}) {
  const { data: presets } = useGetPresetsQuery();
  const { data: modelsConfig } = useGetModelsQuery();
  const { data: startupConfig } = useGetStartupConfig();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const { data: endpoints = [] } = useGetEndpointsQuery({
    select: mapEndpoints,
  });
  const listMap = useAssistantListMap((res) =>
    res.data.map(({ id, name, description }) => ({
      id,
      name,
      description,
    })),
  );
  const interfaceConfig = useMemo(
    () => startupConfig?.interface ?? defaultInterface,
    [startupConfig?.interface],
  );

  const assistantListMap = useMemo(
    () => ({
      [EModelEndpoint.assistants]: listMap[EModelEndpoint.assistants]
        ?.map(
          ({ id, name, description }) => ({
            type: EModelEndpoint.assistants,
            label: name ?? '',
            value: id,
            description: description ?? '',
            icon: EndpointIcon({
              conversation: { assistant_id: id, endpoint: EModelEndpoint.assistants },
              containerClassName: 'shadow-stroke overflow-hidden rounded-full',
              endpointsConfig: endpointsConfig,
              context: 'menu-item',
              size: 20,
            }),
          })
        )
        .filter(Boolean),
      [EModelEndpoint.azureAssistants]: listMap[EModelEndpoint.azureAssistants]
        ?.map(
          ({ id, name, description }) => ({
            type: EModelEndpoint.azureAssistants,
            label: name ?? '',
            value: id,
            description: description ?? '',
            icon: EndpointIcon({
              conversation: { assistant_id: id, endpoint: EModelEndpoint.azureAssistants },
              containerClassName: 'shadow-stroke overflow-hidden rounded-full',
              endpointsConfig: endpointsConfig,
              context: 'menu-item',
              size: 20,
            }),
          })
        )
        .filter(Boolean),
    }),
    [listMap, assistantMap, endpointsConfig],
  );

  const modelSpecs = useMemo(() => startupConfig?.modelSpecs?.list ?? [], [startupConfig]);

  const options: MentionOption[] = useMemo(() => {
    let validEndpoints = endpoints;
    if (!includeAssistants) {
      validEndpoints = endpoints.filter((endpoint) => !isAssistantsEndpoint(endpoint));
    }

    const modelOptions = validEndpoints.flatMap((endpoint) => {
      if (isAssistantsEndpoint(endpoint)) {
        return [];
      }

      if (interfaceConfig.modelSelect !== true) {
        return [];
      }

      const models = (modelsConfig?.[endpoint] ?? []).map((model) => ({
        value: endpoint,
        label: model,
        type: 'model' as const,
        icon: EndpointIcon({
          conversation: { endpoint, model },
          endpointsConfig,
          context: 'menu-item',
          size: 20,
        }),
      }));
      return models;
    });

    const mentions = [
      ...(modelSpecs.length > 0 ? modelSpecs : []).map((modelSpec) => ({
        value: modelSpec.name,
        label: modelSpec.label,
        description: modelSpec.description,
        icon: EndpointIcon({
          conversation: {
            ...modelSpec.preset,
            iconURL: modelSpec.iconURL,
          },
          endpointsConfig,
          context: 'menu-item',
          size: 20,
        }),
        type: 'modelSpec' as const,
      })),
      ...(interfaceConfig.modelSelect === true ? validEndpoints : []).map((endpoint) => ({
        value: endpoint,
        label: alternateName[endpoint as string] ?? endpoint ?? '',
        type: 'endpoint' as const,
        icon: EndpointIcon({
          conversation: { endpoint },
          endpointsConfig,
          context: 'menu-item',
          size: 20,
        }),
      })),
      ...((interfaceConfig.modelSelect === true && interfaceConfig.presets === true
        ? presets
        : []
      )?.map((preset, index) => ({
        value: preset.presetId ?? `preset-${index}`,
        label: preset.title ?? preset.modelLabel ?? preset.chatGptLabel ?? '',
        description: getPresetTitle(preset, true),
        icon: EndpointIcon({
          conversation: preset,
          containerClassName: 'shadow-stroke overflow-hidden rounded-full',
          endpointsConfig: endpointsConfig,
          context: 'menu-item',
          assistantMap,
          size: 20,
        }),
        type: 'preset' as const,
      })) ?? []),
      ...modelOptions,
    ];

    return mentions;
  }, [
    presets,
    endpoints,
    modelSpecs,
    assistantMap,
    modelsConfig,
    endpointsConfig,
    assistantListMap,
    includeAssistants,
    interfaceConfig.presets,
    interfaceConfig.modelSelect,
  ]);

  return {
    options,
    presets,
    modelSpecs,
    modelsConfig,
    endpointsConfig,
    assistantListMap,
  };
}
