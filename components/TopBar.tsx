'use client';

import React from 'react';
import { ArrowLeft, ShoppingBasket } from 'lucide-react';
import { ThemeColor } from '../lib/types';

interface TopBarProps {
  title?: string;
  onBack?: () => void;
  themeColor: ThemeColor;
  rightContent?: React.ReactNode;
  icon?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({
  title = "Mercado Fresh",
  onBack,
  themeColor,
  rightContent,
  icon
}) => {
  return (
    <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-4 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-xs no-print">
      <div className="flex items-center gap-3 min-w-0">
        {onBack ? (
          <button 
            onClick={onBack} 
            className={`p-2 ${themeColor.light} rounded-full transition-all active:scale-95 ${themeColor.text}`}
            aria-label="Voltar"
          >
            <ArrowLeft size={22} />
          </button>
        ) : (
          icon || <ShoppingBasket className={themeColor.text} size={26} />
        )}
        <h1 className={`text-lg sm:text-xl font-extrabold tracking-tight truncate ${themeColor.text}`}>
          {title}
        </h1>
      </div>
      {rightContent && <div className="flex items-center shrink-0">{rightContent}</div>}
    </header>
  );
};
