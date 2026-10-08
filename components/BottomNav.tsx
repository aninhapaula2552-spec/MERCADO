'use client';

import React from 'react';
import { ReceiptText, Flame, Home, Zap, Gamepad2, History, Settings } from 'lucide-react';
import { View, ThemeColor } from '../lib/types';

interface BottomNavProps {
  activeView: View;
  setView: (v: View) => void;
  themeColor: ThemeColor;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeView, setView, themeColor }) => {
  const navItems: Array<{ id: View; label: string; icon: React.ElementType }> = [
    { id: 'lists', label: 'Listas', icon: ReceiptText },
    { id: 'gas', label: 'Gás', icon: Flame },
    { id: 'pantry', label: 'Despensa', icon: Home },
    { id: 'offers', label: 'Ofertas', icon: Zap },
    { id: 'games', label: 'Jogos', icon: Gamepad2 },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-lg pb-5 pt-1.5 no-print">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const isGas = item.id === 'gas';
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 py-1 min-w-0 ${
                isActive ? (isGas ? 'text-orange-600' : themeColor.text) : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all relative ${
                isActive ? (isGas ? 'bg-orange-50' : themeColor.light) : ''
              }`}>
                <Icon size={19} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? 'currentColor' : 'none'} />
              </div>
              <span className={`text-[9px] sm:text-[10px] truncate max-w-full px-0.5 ${isActive ? 'font-black' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
