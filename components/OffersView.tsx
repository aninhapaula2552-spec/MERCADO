'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Check, Award, Lightbulb } from 'lucide-react';
import { Currency, ThemeColor } from '../lib/types';
import { safeNumber, safeFormatMoney } from '../lib/utils';

interface OffersViewProps {
  currency: Currency;
  themeColor: ThemeColor;
}

export const OffersView: React.FC<OffersViewProps> = ({ currency, themeColor }) => {
  const [optAPrice, setOptAPrice] = useState('14.90');
  const [optAWeight, setOptAWeight] = useState('500');
  const [optBPrice, setOptBPrice] = useState('26.50');
  const [optBWeight, setOptBWeight] = useState('1000');

  const calcUnitPrice = (priceStr: string, weightStr: string) => {
    const p = safeNumber(priceStr, 0);
    const w = safeNumber(weightStr, 0);
    if (p <= 0 || w <= 0) return 0;
    return p / w;
  };

  const unitA = calcUnitPrice(optAPrice, optAWeight);
  const unitB = calcUnitPrice(optBPrice, optBWeight);

  const betterOption = unitA > 0 && unitB > 0 ? (unitA < unitB ? 'A' : unitB < unitA ? 'B' : 'equal') : null;
  
  const savings = betterOption === 'A' && unitB > 0
    ? (1 - unitA / unitB) * 100 
    : betterOption === 'B' && unitA > 0
      ? (1 - unitB / unitA) * 100 
      : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-20 px-4 max-w-2xl mx-auto pb-32"
    >
      <header className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 mb-1 flex items-center gap-2">
          <Zap className={themeColor.text} /> Vale a Pena?
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm">
          Compare o preço por peso/volume e descubra qual embalagem é mais econômica.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Opção A */}
        <div className={`p-5 rounded-3xl border-2 transition-all ${
          betterOption === 'A' 
            ? `${themeColor.light} ${themeColor.border} shadow-md` 
            : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
              betterOption === 'A' ? `${themeColor.bg} text-white` : 'bg-slate-100 text-slate-600'
            }`}>
              Opção A
            </span>
            {betterOption === 'A' && (
              <span className={`flex items-center gap-1 text-xs font-bold ${themeColor.text}`}>
                <Check size={16} strokeWidth={3} /> Mais Econômico
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Preço ({currency.symbol})
              </label>
              <input 
                type="text" 
                inputMode="decimal"
                value={optAPrice}
                onChange={(e) => setOptAPrice(e.target.value)}
                placeholder="0,00"
                className={`w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold focus:outline-none focus:ring-2 ${themeColor.ring}`}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Peso ou Volume (g ou ml)
              </label>
              <input 
                type="text" 
                inputMode="decimal"
                value={optAWeight}
                onChange={(e) => setOptAWeight(e.target.value)}
                placeholder="500"
                className={`w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold focus:outline-none focus:ring-2 ${themeColor.ring}`}
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Preço p/ 100g/ml:</span>
            <span className="text-lg font-black text-slate-900">
              {currency.symbol} {safeFormatMoney(unitA * 100)}
            </span>
          </div>
        </div>

        {/* Opção B */}
        <div className={`p-5 rounded-3xl border-2 transition-all ${
          betterOption === 'B' 
            ? `${themeColor.light} ${themeColor.border} shadow-md` 
            : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
              betterOption === 'B' ? `${themeColor.bg} text-white` : 'bg-slate-100 text-slate-600'
            }`}>
              Opção B
            </span>
            {betterOption === 'B' && (
              <span className={`flex items-center gap-1 text-xs font-bold ${themeColor.text}`}>
                <Check size={16} strokeWidth={3} /> Mais Econômico
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Preço ({currency.symbol})
              </label>
              <input 
                type="text" 
                inputMode="decimal"
                value={optBPrice}
                onChange={(e) => setOptBPrice(e.target.value)}
                placeholder="0,00"
                className={`w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold focus:outline-none focus:ring-2 ${themeColor.ring}`}
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Peso ou Volume (g ou ml)
              </label>
              <input 
                type="text" 
                inputMode="decimal"
                value={optBWeight}
                onChange={(e) => setOptBWeight(e.target.value)}
                placeholder="1000"
                className={`w-full h-11 px-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold focus:outline-none focus:ring-2 ${themeColor.ring}`}
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Preço p/ 100g/ml:</span>
            <span className="text-lg font-black text-slate-900">
              {currency.symbol} {safeFormatMoney(unitB * 100)}
            </span>
          </div>
        </div>
      </div>

      {/* Comparison Verdict */}
      {betterOption && betterOption !== 'equal' && savings > 0 && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`${themeColor.bg} text-white p-5 rounded-3xl text-center shadow-lg mb-6`}
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
            <Award size={22} />
          </div>
          <h3 className="text-lg font-black tracking-tight mb-1">
            A OPÇÃO {betterOption} É A MAIS VANTAJOSA!
          </h3>
          <p className="text-xs text-white/90">
            Você economiza <span className="font-extrabold underline">{savings.toFixed(1)}%</span> comprando esta opção.
          </p>
        </motion.div>
      )}

      {betterOption === 'equal' && (
        <div className="bg-slate-100 text-slate-700 p-4 rounded-2xl text-center text-xs font-bold mb-6">
          Ambas as opções possuem exatamente o mesmo valor por grama/ml!
        </div>
      )}

      {/* Shopping Tip */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <h4 className="font-bold text-slate-900 text-sm mb-1.5 flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500" /> Dica de Compra Inteligente
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          Muitas embalagens promocionais (&quot;Tamanho Família&quot; ou &quot;Leve 3 Pague 2&quot;) aparentam ser mais vantajosas, mas cobram mais por unidade. Use este comparador diretamente no corredor do mercado!
        </p>
      </div>
    </motion.div>
  );
};
