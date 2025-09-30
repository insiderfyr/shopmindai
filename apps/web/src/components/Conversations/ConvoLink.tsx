import React from 'react';
import { cn } from '~/utils';

interface ConvoLinkProps {
  isActiveConvo: boolean;
  title: string | null;
  onRename: () => void;
  isSmallScreen: boolean;
  localize: (key: any, options?: any) => string;
  children: React.ReactNode;
}

const ConvoLink: React.FC<ConvoLinkProps> = ({
  isActiveConvo,
  title,
  onRename,
  isSmallScreen,
  localize,
  children,
}) => {
  return (
    <div
      className={cn('flex grow items-center gap-2 overflow-hidden rounded-lg px-2')}
      title={title ?? undefined}
      aria-current={isActiveConvo ? 'page' : undefined}
      style={{ width: '100%' }}
    >
      {children}
      <div
        className="relative flex-1 grow overflow-hidden whitespace-nowrap"
        style={{ textOverflow: 'clip' }}
        onDoubleClick={(e) => {
          if (isSmallScreen) {
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          onRename();
        }}
        role="button"
        aria-label={isSmallScreen ? undefined : title || localize('com_ui_untitled')}
      >
        {title || localize('com_ui_untitled')}
      </div>
      <div className={cn('absolute bottom-0 right-0 top-0 w-20 rounded-r-lg')} aria-hidden="true" />
    </div>
  );
};

export default ConvoLink;
