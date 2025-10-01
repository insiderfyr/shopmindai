import React, { useState } from 'react';
import { useLocalize } from '~/hooks';
import { Dropdown } from '../ui';
import type { Option } from '~/common';
import { cn } from '~/utils';

// Lista de retaileri e-commerce
const retailers = [
  { id: 'alibaba', name: 'Alibaba' },
  { id: 'amazon', name: 'Amazon' },
  { id: 'asos', name: 'ASOS' },
  { id: 'ebay', name: 'eBay' },
  { id: 'etsy', name: 'Etsy' },
  { id: 'flipkart', name: 'Flipkart' },
  { id: 'rakuten', name: 'Rakuten' },
  { id: 'shopify', name: 'Shopify' },
  { id: 'target', name: 'Target' },
  { id: 'walmart', name: 'Walmart' },
];

interface StoresDropdownProps {
  className?: string;
  onStoreChange?: (storeId: string) => void;
}

export default function StoresDropdown({ className, onStoreChange }: StoresDropdownProps) {
  const localize = useLocalize();
  const [selectedStore, setSelectedStore] = useState<string>(retailers[0].id);
  const handleStoreChange = (storeId: string) => {
    setSelectedStore(storeId);
    onStoreChange?.(storeId);
  };

  const options: Option[] = retailers.map((store) => ({
    value: store.id,
    label: store.name,
  }));

  const renderStoreIcon = (size = 'h-5 w-5', className = '') => (
    <svg
      className={cn(size, className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  );

  const triggerClasses = cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-text-primary hover:text-accent-foreground rounded-xl border border-border-light bg-surface-secondary p-2 hover:bg-surface-hover',
    'px-3',
    'dark:border-white/20 dark:bg-surface-secondary dark:text-white dark:hover:bg-surface-hover',
  );

  const containerClasses = cn('stores-dropdown relative', className);

  return (
    <Dropdown
      value={selectedStore}
      onChange={handleStoreChange}
      options={options}
      className={containerClasses}
      triggerClassName={triggerClasses}
      popoverClassName="bg-white/95 dark:bg-slate-900 border border-border-light dark:border-white/10 rounded-xl shadow-lg"
      ariaLabel={localize('com_ui_select_store') || 'Select store'}
      testId="stores-dropdown"
      renderValue={(option) => (
        <div className="flex items-center gap-2 text-text-primary dark:text-white">
          {renderStoreIcon('h-5 w-5', 'text-text-primary dark:text-white')}
          <span className="truncate font-medium">{option.label}</span>
        </div>
      )}
      renderOption={(option) => (
        <div className="flex items-center gap-2">
          {renderStoreIcon('h-4 w-4', 'text-slate-500 dark:text-slate-200')}
          <span className="truncate text-slate-700 dark:text-slate-100">{option.label}</span>
        </div>
      )}
    />
  );
}
