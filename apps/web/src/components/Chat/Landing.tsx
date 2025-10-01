import { useMemo } from 'react';
import { EModelEndpoint } from 'librechat-data-provider';
import { useChatContext } from '~/Providers';
import { useGetEndpointsQuery, useGetStartupConfig } from '~/data-provider';
import { useLocalize, useAuthContext } from '~/hooks';
import { getIconEndpoint } from '~/utils';
import LogoDarkIcon from '~/components/svg/LogoDarkIcon';
import LogoIcon from '~/components/svg/LogoIcon';

export default function Landing({ centerFormOnLanding }: { centerFormOnLanding: boolean }) {
  const { conversation } = useChatContext();
  const { data: startupConfig } = useGetStartupConfig();
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const { user } = useAuthContext();
  const localize = useLocalize();

  const endpointType = useMemo(() => {
    let ep = conversation?.endpoint ?? '';
    if (
      [
        EModelEndpoint.chatGPTBrowser,
        EModelEndpoint.azureOpenAI,
        EModelEndpoint.gptPlugins,
      ].includes(ep as EModelEndpoint)
    ) {
      ep = EModelEndpoint.openAI;
    }
    return getIconEndpoint({
      endpointsConfig,
      iconURL: conversation?.iconURL,
      endpoint: ep,
    });
  }, [conversation?.endpoint, conversation?.iconURL, endpointsConfig]);

  // Eliminat agentsMap și assistantMap
  const description = conversation?.greeting ?? '';

  return (
    <div
      className={`-mt-32 flex h-full transform-gpu flex-col items-center justify-center pb-20 transition-all duration-200 ${
        centerFormOnLanding ? 'max-h-full sm:max-h-0' : 'max-h-full'
      }`}
    >
      <div className="flex flex-col items-center gap-0 p-1">
        {/* Logo + ShopMindAI */}
        <div className="flex items-center justify-center gap-3 -mt-8">
          <div className="dark:hidden">
            <LogoIcon size={48} className="text-[#4d8eff]" />
          </div>
          <div className="hidden dark:block">
            <LogoDarkIcon size={48} />
          </div>
          <h1 className="text-[25px] font-bold text-foreground">
            {localize('com_ui_shopmind')}
            <span className="text-[#4d8eff]">{localize('com_ui_ai')}</span>
          </h1>
        </div>

        {description && (
          <div className="animate-fadeIn mt-1 max-w-md text-center text-sm font-normal text-text-primary">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}
