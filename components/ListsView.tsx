'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Upload, 
  Copy, 
  Share2, 
  Trash2, 
  Check, 
  ShoppingCart, 
  UtensilsCrossed, 
  Leaf, 
  Sparkles, 
  ShoppingBasket,
  ChevronRight,
  Receipt,
  Flame
} from 'lucide-react';
import { GroceryList, ThemeColor, Currency } from '../lib/types';
import { safeFormatMoney, calculateItemSubtotal } from '../lib/utils';

export interface GasAlertData {
  show: boolean;
  message: string;
  badgeText: string;
  badgeBg: string;
  onAddToList: () => void;
  onViewGas: () => void;
}

interface ListsViewProps {
  lists: GroceryList[];
  onSelectList: (id: string) => void;
  onAddList: (name: string, budget: number) => void;
  onDeleteList: (id: string) => void;
  onDuplicateList: (list: GroceryList, newName: string) => void;
  onShareList: (list: GroceryList) => void;
  onOpenImport: () => void;
  onFinishList: (list: GroceryList, total: number) => void;
  gasAlert?: GasAlertData | null;
  currency: Currency;
  themeColor: ThemeColor;
}

export const ListsView: React.FC<ListsViewProps> = ({
  lists,
  onSelectList,
  onAddList,
  onDeleteList,
  onDuplicateList,
  onShareList,
  onOpenImport,
  onFinishList,
  gasAlert,
  currency,
  themeColor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListBudget, setNewListBudget] = useState('250');

  const [duplicatingList, setDuplicatingList] = useState<GroceryList | null>(null);
  const [duplicateName, setDuplicateName] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredLists = lists.filter(list => 
    list && (list.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const budget = parseFloat(newListBudget.replace(',', '.')) || 100;
    onAddList(newListName.trim(), budget);
    setNewListName('');
    setNewListBudget('250');
    setIsAddOpen(false);
  };

  const handleConfirmDuplicate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicatingList || !duplicateName.trim()) return;
    onDuplicateList(duplicatingList, duplicateName.trim());
    setDuplicatingList(null);
    setDuplicateName('');
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'UtensilsCrossed': return <UtensilsCrossed size={20} />;
      case 'Leaf': return <Leaf size={20} />;
      case 'Sparkles': return <Sparkles size={20} />;
      case 'ShoppingBasket': return <ShoppingBasket size={20} />;
      default: return <ShoppingCart size={20} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-20 px-4 max-w-2xl mx-auto pb-32"
    >
      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar listas..." 
          className={`w-full bg-white border border-slate-200/80 rounded-2xl py-3.5 pl-11 pr-4 shadow-xs text-sm focus:outline-none focus:ring-2 ${themeColor.ring} transition-all font-medium text-slate-800`}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setIsAddOpen(true)}
          className={`flex-1 py-3 px-4 ${themeColor.bg} text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:brightness-105 active:scale-98 transition-all`}
        >
          <Plus size={16} strokeWidth={3} />
          <span>Nova Lista</span>
        </button>
        <button
          onClick={onOpenImport}
          className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-slate-50 active:scale-98 transition-all"
        >
          <Upload size={16} className={themeColor.text} />
          <span>Importar (.JSON / .CSV)</span>
        </button>
      </div>

      {/* Gas Exchange Alert Banner (Integrated with Shopping List) */}
      {gasAlert && gasAlert.show && (
        <div className="mb-4 p-4 rounded-2xl bg-orange-50 border border-orange-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <span className="p-2.5 rounded-xl bg-orange-100 text-orange-600 shrink-0 mt-0.5 sm:mt-0">
              <Flame size={20} className="animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs font-black text-slate-900">
                  🔥 Gás — compra provavelmente próxima
                </p>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${gasAlert.badgeBg}`}>
                  {gasAlert.badgeText}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {gasAlert.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <button
              onClick={gasAlert.onViewGas}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 active:scale-95 transition-all"
            >
              Ver Gás
            </button>
            <button
              onClick={gasAlert.onAddToList}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Adicionar à lista</span>
            </button>
          </div>
        </div>
      )}

      {/* Lists Grid */}
      {filteredLists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredLists.map((list) => {
              const items = list.items || [];
              const checkedCount = items.filter(i => i && i.checked).length;
              const totalItems = items.length;
              const totalEstimated = items.reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);
              const isAllChecked = totalItems > 0 && checkedCount === totalItems && list.status === 'Em andamento';

              return (
                <motion.div 
                  layout
                  key={list.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/70 hover:shadow-md transition-all flex flex-col justify-between relative group cursor-pointer"
                  onClick={() => onSelectList(list.id)}
                >
                  {/* Top Bar inside card */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${list.color || 'bg-emerald-100 text-emerald-600'} rounded-2xl flex items-center justify-center`}>
                        {renderIcon(list.icon)}
                      </div>
                      <div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          list.status === 'Concluído' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {list.status}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => {
                          setDuplicatingList(list);
                          setDuplicateName(`${list.name} (Cópia)`);
                        }} 
                        title="Duplicar Lista"
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                      >
                        <Copy size={15} />
                      </button>
                      <button 
                        onClick={() => onShareList(list)} 
                        title="Compartilhar / Exportar"
                        className={`p-1.5 ${themeColor.text} hover:bg-slate-100 rounded-xl transition-all`}
                      >
                        <Share2 size={15} />
                      </button>
                      <button 
                        onClick={() => setDeletingId(list.id)} 
                        title="Excluir Lista"
                        className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1 mb-1">{list.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {checkedCount} de {totalItems} {totalItems === 1 ? 'item comprado' : 'itens comprados'}
                    </p>
                    
                    {/* Item progress bar */}
                    {totalItems > 0 && (
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${themeColor.bg}`}
                          style={{ width: `${Math.round((checkedCount / totalItems) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Previsto</span>
                      <p className="text-sm font-black text-slate-800">
                        {currency.symbol} {safeFormatMoney(totalEstimated)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {isAllChecked && (
                        <button
                          onClick={() => onFinishList(list, totalEstimated)}
                          className={`px-3 py-1.5 ${themeColor.bg} text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs hover:brightness-105 active:scale-95`}
                        >
                          <Check size={14} strokeWidth={3} /> Finalizar
                        </button>
                      )}
                      <div className="text-slate-400 group-hover:translate-x-1 transition-transform">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-slate-100 p-5 rounded-3xl mb-3 text-slate-400">
            <Receipt size={36} />
          </div>
          <h3 className="text-base font-bold text-slate-800">Nenhuma lista encontrada</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Crie sua primeira lista de compras ou toque em Nova Lista acima.
          </p>
        </div>
      )}

      {/* Floating Add List Button */}
      <button 
        onClick={() => setIsAddOpen(true)}
        className={`fixed bottom-24 right-5 z-30 flex items-center gap-2 ${themeColor.bg} text-white px-5 py-3.5 rounded-full shadow-lg hover:brightness-105 active:scale-95 transition-all text-sm font-bold`}
      >
        <Plus size={20} strokeWidth={3} />
        <span>Nova Lista</span>
      </button>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100"
            >
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">Nova Lista de Compras</h3>
              <form onSubmit={handleConfirmAdd} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nome da Lista</label>
                  <input 
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Ex: Supermercado Mensal"
                    className={`w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 ${themeColor.ring}`}
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Meta de Gastos ({currency.symbol})
                  </label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={newListBudget}
                    onChange={(e) => setNewListBudget(e.target.value)}
                    placeholder="250,00"
                    className={`w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 ${themeColor.ring}`}
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className={`flex-1 h-12 rounded-2xl ${themeColor.bg} text-white font-bold text-sm shadow-xs hover:brightness-105 active:scale-98 transition-all`}
                  >
                    Criar Lista
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Duplicate Modal */}
      <AnimatePresence>
        {duplicatingList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100"
            >
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">Duplicar Lista</h3>
              <form onSubmit={handleConfirmDuplicate} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nome da Cópia</label>
                  <input 
                    type="text"
                    value={duplicateName}
                    onChange={(e) => setDuplicateName(e.target.value)}
                    className={`w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-sm focus:outline-none focus:ring-2 ${themeColor.ring}`}
                    autoFocus
                    required
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setDuplicatingList(null)}
                    className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className={`flex-1 h-12 rounded-2xl ${themeColor.bg} text-white font-bold text-sm shadow-xs hover:brightness-105 active:scale-98 transition-all`}
                  >
                    Duplicar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100"
            >
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Excluir Lista?</h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Tem certeza que deseja apagar esta lista? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setDeletingId(null)}
                  className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
                >
                  Voltar
                </button>
                <button 
                  onClick={() => {
                    if (deletingId) onDeleteList(deletingId);
                    setDeletingId(null);
                  }}
                  className="flex-1 h-12 rounded-2xl bg-rose-600 text-white font-bold text-sm shadow-xs hover:bg-rose-700 active:scale-98 transition-all"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
