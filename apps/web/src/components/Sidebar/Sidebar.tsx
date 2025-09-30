import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, User } from 'lucide-react';
import { cn } from '~/utils';
import './Sidebar.css';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const navigate = useNavigate();

  const handleHistory = () => {
    // Navigate to history or main page
    navigate('/');
  };

  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-50 h-full w-20 border-r border-gray-200/50 bg-white/80 backdrop-blur-sm',
        'flex flex-col items-center gap-6 py-4',
        className,
      )}
    >
      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 transition-transform duration-300 hover:scale-105">
          <span className="text-lg font-bold text-white">S</span>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => navigate('/c/new')}
          className="group flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 transition-all duration-300 hover:scale-105 hover:bg-gray-300 active:scale-[0.97]"
        >
          <svg
            className="h-5 w-5 text-gray-600 group-hover:text-gray-800"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <span className="text-2xs font-medium text-gray-500">New</span>
      </div>

      {/* History */}
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={handleHistory}
          className="group flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 transition-all duration-300 hover:scale-105 hover:bg-blue-300 active:scale-[0.97]"
        >
          <History className="h-5 w-5 text-blue-600 group-hover:text-blue-800" />
        </button>
        <span className="text-2xs font-medium text-gray-500">History</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Profile */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-gray-200 transition-opacity duration-200 hover:opacity-80">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          {/* Online status indicator */}
          <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-white bg-green-500"></div>
        </div>
        <span className="text-2xs font-medium text-gray-500">Cont</span>
      </div>
    </div>
  );
};


export default Sidebar;
