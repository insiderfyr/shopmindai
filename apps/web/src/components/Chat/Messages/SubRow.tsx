import React, { useMemo } from 'react';
import { cn } from '~/utils';

type TSubRowProps = {
  children: React.ReactNode;
  classes?: string;
  subclasses?: string;
  onClick?: () => void;
  isCreatedByUser: boolean; // Changed from isUserMessage for consistency
};

// CSS constants for reusability and performance
const SUBROW_STYLES = {
  base: 'mt-1 flex gap-3 empty:hidden lg:flex text-xs',
  user: 'opacity-0 group-hover:opacity-100 transition-opacity duration-200 justify-end',
  agent: 'justify-start',
} as const;

const SubRow = React.memo(({ children, classes = '', onClick, isCreatedByUser }: TSubRowProps) => {
  const containerClasses = useMemo(() => {
    return cn(
      SUBROW_STYLES.base,
      isCreatedByUser ? SUBROW_STYLES.user : SUBROW_STYLES.agent,
      classes,
    );
  }, [isCreatedByUser, classes]);

  return (
    <div
      className={containerClasses}
      onClick={onClick}
      role="toolbar"
      aria-label={isCreatedByUser ? 'User message actions' : 'Assistant message actions'}
    >
      {children}
    </div>
  );
});

SubRow.displayName = 'SubRow';

export default SubRow;
