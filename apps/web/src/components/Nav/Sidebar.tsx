import React, { useState, useCallback } from 'react';
import { Home, Search, FolderOpen, User, RefreshCw, Download, Plus, Sparkles } from 'lucide-react';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

interface SidebarItem {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  isActive?: boolean;
  hasNotification?: boolean;
  notificationColor?: 'blue' | 'red';
  onClick?: () => void;
}

interface SidebarProps {
  className?: string;
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className, activeItem = 'home', onItemClick }) => {
  const localize = useLocalize();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleItemClick = useCallback(
    (itemId: string) => {
      onItemClick?.(itemId);
    },
    [onItemClick],
  );

  const sidebarItems: SidebarItem[] = [
    {
      id: 'logo',
      icon: Sparkles,
      label: 'ShopMindAI',
      onClick: () => handleItemClick('logo'),
    },
    {
      id: 'add',
      icon: Plus,
      label: 'Adaugă',
      onClick: () => handleItemClick('add'),
    },
    {
      id: 'home',
      icon: Home,
      label: 'Acasă',
      isActive: activeItem === 'home',
      onClick: () => handleItemClick('home'),
    },
    {
      id: 'discover',
      icon: Search,
      label: 'Descoperă',
      isActive: activeItem === 'discover',
      onClick: () => handleItemClick('discover'),
    },
    {
      id: 'spaces',
      icon: FolderOpen,
      label: 'Spații',
      isActive: activeItem === 'spaces',
      onClick: () => handleItemClick('spaces'),
    },
    {
      id: 'account',
      icon: User,
      label: 'Cont',
      isActive: activeItem === 'account',
      hasNotification: true,
      notificationColor: 'blue',
      onClick: () => handleItemClick('account'),
    },
    {
      id: 'update',
      icon: RefreshCw,
      label: 'Actualizare',
      onClick: () => handleItemClick('update'),
    },
    {
      id: 'install',
      icon: Download,
      label: 'Instalare',
      hasNotification: true,
      notificationColor: 'red',
      onClick: () => handleItemClick('install'),
    },
  ];

  const renderSidebarItem = (item: SidebarItem) => {
    const IconComponent = item.icon;
    const isHovered = hoveredItem === item.id;
    const showLabel = isExpanded || isHovered;

    return (
      <div
        key={item.id}
        className="relative"
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        {/* Active indicator dot */}
        {item.isActive && (
          <div className="absolute left-0 top-1/2 h-1.5 w-1 -translate-y-1/2 rounded-full bg-blue-500" />
        )}

        {/* Notification badge */}
        {item.hasNotification && (
          <div
            className={cn(
              'absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full',
              item.notificationColor === 'blue' ? 'bg-blue-500' : 'bg-red-500',
            )}
          />
        )}

        <button
          onClick={item.onClick}
          className={cn(
            'group relative flex h-12 w-full items-center justify-center rounded-xl transition-all duration-200 ease-in-out',
            'hover:bg-gray-200 dark:hover:bg-slate-800',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2',
            item.isActive && 'bg-blue-50 dark:bg-slate-800',
            item.id === 'logo' && 'mb-6 h-16',
          )}
          style={{
            paddingLeft: item.isActive ? '1.5rem' : '1rem',
            paddingRight: '1rem',
          }}
        >
          <div
            className={cn(
              'flex items-center transition-all duration-200',
              showLabel ? 'w-full justify-start gap-3' : 'w-full justify-center',
            )}
          >
            <IconComponent
              size={item.id === 'logo' ? 32 : 20}
              className={cn(
                'transition-all duration-200',
                item.isActive
                  ? 'text-blue-600 dark:text-white'
                  : 'text-gray-600 dark:text-slate-300',
                item.id === 'logo' && 'text-blue-500 dark:text-white',
              )}
            />

            {showLabel && (
              <span
                className={cn(
                  'text-sm font-medium transition-all duration-200',
                  item.isActive
                    ? 'text-blue-700 dark:text-white'
                    : 'text-gray-700 dark:text-slate-200',
                  item.id === 'logo' && 'text-lg font-bold text-blue-600 dark:text-white',
                )}
              >
                {item.label}
              </span>
            )}
          </div>
        </button>

        {/* Tooltip for collapsed state */}
        {!isExpanded && !isHovered && (
          <div className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {item.label}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'fixed left-0 top-0 h-full border-r border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-slate-900',
        'z-40 transition-all duration-300 ease-in-out',
        isExpanded ? 'w-64' : 'w-20',
        className,
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Sidebar content */}
      <div className="flex h-full flex-col p-3">
        {/* Logo section */}
        <div className="flex-1">{sidebarItems.slice(0, 2).map(renderSidebarItem)}</div>

        {/* Navigation items */}
        <div className="flex-1 space-y-1">{sidebarItems.slice(2, 6).map(renderSidebarItem)}</div>

        {/* Bottom section */}
        <div className="flex flex-1 flex-col justify-end space-y-1">
          {sidebarItems.slice(6).map(renderSidebarItem)}
        </div>
      </div>

      {/* Mobile overlay */}
      <div className="absolute inset-0 bg-black/20 lg:hidden" />
    </div>
  );
};

export default Sidebar;
