import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getConfigDefaults, PermissionTypes, Permissions } from 'librechat-data-provider';
import type { ContextType } from '~/common';
import ModelSelector from './Menus/Endpoints/ModelSelector';
import { HeaderNewChat, OpenSidebar } from './Menus';
import { useGetStartupConfig } from '~/data-provider';
import ExportAndShareMenu from './ExportAndShareMenu';
import { useMediaQuery, useHasAccess } from '~/hooks';

import { TemporaryChat } from './TemporaryChat';
import StoresDropdown from '~/components/Nav/StoresDropdown';

const defaultInterface = getConfigDefaults().interface;

export default function Header() {
  const { data: startupConfig } = useGetStartupConfig();
  const { navVisible, setNavVisible } = useOutletContext<ContextType>();
  const _interfaceConfig = useMemo(
    () => startupConfig?.interface ?? defaultInterface,
    [startupConfig],
  );

  const isSmallScreen = useMediaQuery('(max-width: 768px)');

  return (
    <div className="sticky top-0 z-10 -mt-2 flex h-12 w-full items-center justify-between bg-surface-chat p-1 font-semibold text-text-primary dark:bg-[#182533] sm:h-14 sm:p-2">
      <div className="hide-scrollbar flex w-full items-center justify-between gap-2 overflow-x-auto">
        <div className="mx-1 flex items-center gap-1 sm:gap-2">
          <div
            className={`flex items-center gap-1 sm:gap-2 ${
              !isSmallScreen ? 'transition-all duration-200 ease-in-out' : ''
            } ${
              !navVisible
                ? 'translate-x-0 opacity-100'
                : 'pointer-events-none translate-x-[-100px] opacity-0'
            }`}
          >
            <OpenSidebar setNavVisible={setNavVisible} />
            <HeaderNewChat />
          </div>
          <div
            className={`flex items-center gap-1 sm:gap-2 ${
              !isSmallScreen ? 'transition-all duration-200 ease-in-out' : ''
            } ${!navVisible ? 'translate-x-0' : 'translate-x-[-100px]'}`}
          >
            {/* <ModelSelector startupConfig={startupConfig} /> */}
            <StoresDropdown className="max-w-[200px]" />

            {isSmallScreen && (
              <>
                <ExportAndShareMenu
                  isSharedButtonEnabled={startupConfig?.sharedLinksEnabled ?? false}
                />
                <TemporaryChat />
              </>
            )}
          </div>
        </div>
        {!isSmallScreen && (
          <div className="flex items-center gap-2">
            <ExportAndShareMenu
              isSharedButtonEnabled={startupConfig?.sharedLinksEnabled ?? false}
            />
            <TemporaryChat />
          </div>
        )}
      </div>
      {/* Empty div for spacing */}
      <div />
    </div>
  );
}
