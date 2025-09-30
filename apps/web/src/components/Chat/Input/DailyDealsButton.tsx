import React, { useState } from 'react';

const DailyDealsButton = () => {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(!isActive);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex transform items-center rounded-2xl px-2.5 py-1.5 text-sm transition-all duration-300 ease-in-out active:scale-[0.98] sm:px-3 ${
        isActive
          ? 'bg-gray-700 text-white shadow-lg'
          : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
      }`}
      title="Discover today's best deals and offers"
    >
      <span className="hidden sm:inline">Daily Deals</span>
      <span className="sm:hidden">Deals</span>
    </button>
  );
};

export default DailyDealsButton;
