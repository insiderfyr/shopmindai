import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import type { ContextType } from '~/common';
import {
  useAuthContext,
  useFileMap,
  useSearchEnabled,
} from '~/hooks';
import {
  FileMapContext,
  SetConvoProvider,
} from '~/Providers';
import TermsAndConditionsModal from '~/components/ui/TermsAndConditionsModal';
import { useUserTermsQuery, useGetStartupConfig, useHealthCheck } from '~/data-provider';
import { Nav } from '~/components/Nav';

export default function Root() {
  const [showTerms, setShowTerms] = useState(false);
  const [navVisible, setNavVisible] = useState(() => {
    const savedNavVisible = localStorage.getItem('navVisible');
    return savedNavVisible !== null ? JSON.parse(savedNavVisible) : true;
  });

  const { isAuthenticated, logout } = useAuthContext();

  // Global health check - runs once per authenticated session
  useHealthCheck(isAuthenticated);

  const fileMap = useFileMap({ isAuthenticated });

  const { data: config } = useGetStartupConfig();
  const { data: termsData } = useUserTermsQuery({
    enabled: isAuthenticated && config?.interface?.termsOfService?.modalAcceptance === true,
  });

  useSearchEnabled(isAuthenticated);

  useEffect(() => {
    if (termsData) {
      setShowTerms(!termsData.termsAccepted);
    }
  }, [termsData]);

  const handleAcceptTerms = () => {
    setShowTerms(false);
  };

  const handleDeclineTerms = () => {
    setShowTerms(false);
    logout('/login?redirect=false');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SetConvoProvider>
      <FileMapContext.Provider value={fileMap}>
        <div className="flex h-full">
          <div className="relative z-0 flex h-full w-full overflow-hidden">
            <Nav navVisible={navVisible} setNavVisible={setNavVisible} />
            <div className="relative flex h-full max-w-full flex-1 flex-col overflow-hidden">
              <Outlet context={{ navVisible, setNavVisible } satisfies ContextType} />
            </div>
          </div>
        </div>
        {config?.interface?.termsOfService?.modalAcceptance === true && (
          <TermsAndConditionsModal
            open={showTerms}
            onOpenChange={setShowTerms}
            onAccept={handleAcceptTerms}
            onDecline={handleDeclineTerms}
            title={config.interface.termsOfService.modalTitle}
            modalContent={config.interface.termsOfService.modalContent}
          />
        )}
      </FileMapContext.Provider>
    </SetConvoProvider>
  );
}
