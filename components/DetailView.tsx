'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Minus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  Star, 
  Scale, 
  Share2, 
  Upload, 
  Lightbulb, 
  Award, 
  ArrowLeft,
  Flame
} from 'lucide-react';
import { GroceryList, ListItem, Currency, ThemeColor } from '../lib/types';
import { ITEM_CATEGORIES } from '../lib/constants';
import { 
  safeNumber, 
  safeFormatMoney, 
  parseItemAmount, 
  calculateItemPrice, 
  calculateItemSubtotal,
  generateId 
} from '../lib/utils';

interface DetailViewProps {
  list: GroceryList;
  onBack: () => void;
  onUpdateList: (updatedList: GroceryList) => void;
  onFinishList: (list: GroceryList, total: number) => void;
  onOpenExportModal: (list: GroceryList) => void;
  onOpenImportModal: (list?: GroceryList) => void;
  onNavigateToGas?: (prefilledPrice?: number) => void;
  currency: Currency;
  themeColor: ThemeColor;
}

export const DetailView: React.FC<DetailViewProps> = ({
  list,
  onBack,
  onUpdateList,
  onFinishList,
  onOpenExportModal,
  onOpenImportModal,
  onNavigateToGas,
  currency,
  themeColor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // New Item State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Geral');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('1');
  const [notes, setNotes] = useState('');
  const [isWeightBased, setIsWeightBased] = useState(false);
  const [importanceLevel, setImportanceLevel] = useState(0);
  const [hasWholesale, setHasWholesale] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [minWholesaleQty, setMinWholesaleQty] = useState('');

  // Edit Item State
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Geral');
  const [editPrice, setEditPrice] = useState('');
  const [editAmount, setEditAmount] = useState('1');
  const [editNotes, setEditNotes] = useState('');
  const [editIsWeightBased, setEditIsWeightBased] = useState(false);
  const [editImportance, setEditImportance] = useState(0);
  const [editHasWholesale, setEditHasWholesale] = useState(false);
  const [editWholesalePrice, setEditWholesalePrice] = useState('');
  const [editMinWholesaleQty, setEditMinWholesaleQty] = useState('');

  // Budget Modal State
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [tempBudget, setTempBudget] = useState(list.budgetLimit.toString());

  const items = useMemo(() => (list?.items || []).filter(Boolean), [list?.items]);
  
  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item && (item.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );
  }, [items, searchQuery]);

  const totalCarrinho = useMemo(() => {
    return items.filter(i => i && i.checked).reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);
  }, [items]);

  const totalEstimado = useMemo(() => {
    return items.reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);
  }, [items]);

  const budget = list.budgetLimit || 100;
  const remaining = Math.max(0, budget - totalCarrinho);
  const budgetUsagePercent = Math.min((totalCarrinho / (budget || 1)) * 100, 100);

  // Add Item Handler
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedPrice = safeNumber(price, 0);
    const parsedAmount = safeNumber(amount, 1);
    let wPrice: number | undefined = undefined;
    let minQty: number | undefined = undefined;

    if (hasWholesale) {
      const p = safeNumber(wholesalePrice, 0);
      const q = safeNumber(minWholesaleQty, 0);
      if (p > 0) wPrice = p;
      if (q > 0) minQty = q;
    }

    const newItem: ListItem = {
      id: generateId('item'),
      name: name.trim(),
      category: category.trim() || 'Geral',
      price: parsedPrice,
      quantity: isWeightBased ? 1 : Math.max(1, Math.round(parsedAmount)),
      weight: isWeightBased ? parsedAmount.toString().replace('.', ',') : undefined,
      unit: isWeightBased ? 'kg' : 'un',
      notes: notes.trim() || undefined,
      checked: false,
      wholesalePrice: wPrice,
      minWholesaleQty: minQty,
      importanceLevel: importanceLevel
    };

    onUpdateList({
      ...list,
      items: [newItem, ...(list.items || [])]
    });

    setName('');
    setCategory('Geral');
    setPrice('');
    setAmount('1');
    setNotes('');
    setHasWholesale(false);
    setWholesalePrice('');
    setMinWholesaleQty('');
    setImportanceLevel(0);
    setShowAddForm(false);
  };

  // Edit Handlers
  const handleOpenEdit = (item: ListItem) => {
    setEditingItem(item);
    setEditName(item.name || '');
    setEditCategory(item.category || 'Geral');
    setEditPrice(item.price > 0 ? item.price.toString().replace('.', ',') : '');
    const isWeight = !!item.weight;
    setEditIsWeightBased(isWeight);
    setEditAmount(isWeight ? (item.weight || '1') : (item.quantity?.toString() || '1'));
    setEditNotes(item.notes || '');
    setEditImportance(item.importanceLevel || 0);
    setEditHasWholesale(!!item.wholesalePrice);
    setEditWholesalePrice(item.wholesalePrice ? item.wholesalePrice.toString().replace('.', ',') : '');
    setEditMinWholesaleQty(item.minWholesaleQty ? item.minWholesaleQty.toString().replace('.', ',') : '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const parsedPrice = safeNumber(editPrice, 0);
    const parsedAmount = safeNumber(editAmount, 1);
    let wPrice: number | undefined = undefined;
    let minQty: number | undefined = undefined;

    if (editHasWholesale) {
      const p = safeNumber(editWholesalePrice, 0);
      const q = safeNumber(editMinWholesaleQty, 0);
      if (p > 0) wPrice = p;
      if (q > 0) minQty = q;
    }

    const updatedItems = (list.items || []).map(i => {
      if (i.id === editingItem.id) {
        return {
          ...i,
          name: editName.trim() || i.name,
          category: editCategory.trim() || 'Geral',
          price: parsedPrice,
          quantity: editIsWeightBased ? 1 : Math.max(1, Math.round(parsedAmount)),
          weight: editIsWeightBased ? parsedAmount.toString().replace('.', ',') : undefined,
          unit: editIsWeightBased ? 'kg' : (i.unit && i.unit !== 'kg' ? i.unit : 'un'),
          notes: editNotes.trim() || undefined,
          importanceLevel: editImportance,
          wholesalePrice: wPrice,
          minWholesaleQty: minQty
        };
      }
      return i;
    });

    onUpdateList({ ...list, items: updatedItems });
    setEditingItem(null);
  };

  const handleToggleChecked = (itemId: string) => {
    const updated = (list.items || []).map(i => i.id === itemId ? { ...i, checked: !i.checked } : i);
    onUpdateList({ ...list, items: updated });
  };

  const handleToggleImportance = (itemId: string, current: number) => {
    const next = (current + 1) % 4;
    const updated = (list.items || []).map(i => i.id === itemId ? { ...i, importanceLevel: next } : i);
    onUpdateList({ ...list, items: updated });
  };

  const handleQuantityChange = (item: ListItem, delta: number) => {
    if (item.weight) {
      const current = safeNumber(item.weight, 1);
      const next = Math.max(0.1, Number((current + (delta * 0.1)).toFixed(2)));
      const updated = (list.items || []).map(i => i.id === item.id ? { ...i, weight: next.toString().replace('.', ',') } : i);
      onUpdateList({ ...list, items: updated });
    } else {
      const current = typeof item.quantity === 'number' ? item.quantity : 1;
      const next = Math.max(1, current + delta);
      const updated = (list.items || []).map(i => i.id === item.id ? { ...i, quantity: next } : i);
      onUpdateList({ ...list, items: updated });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const updated = (list.items || []).filter(i => i.id !== itemId);
    onUpdateList({ ...list, items: updated });
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = safeNumber(tempBudget, list.budgetLimit);
    if (val > 0) {
      onUpdateList({ ...list, budgetLimit: val });
    }
    setIsBudgetOpen(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      className="pb-44 flex flex-col min-h-screen"
    >
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-40 flex items-center justify-between px-4 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-xs no-print">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={onBack}
            className={`p-2 ${themeColor.light} rounded-full transition-all active:scale-95 ${themeColor.text}`}
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
            {list.name}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={() => onOpenImportModal(list)}
            title="Importar itens para esta lista"
            className="p-2 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-full transition-all active:scale-95"
          >
            <Upload size={16} />
          </button>
          <button 
            onClick={() => onOpenExportModal(list)}
            title="Compartilhar / Exportar lista"
            className={`flex items-center gap-1.5 px-3 py-1.5 ${themeColor.bg} text-white rounded-full text-xs font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all`}
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mt-16 px-4 max-w-2xl mx-auto w-full pt-4">
        {/* Budget Card */}
        <section className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/70 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Meta de Gastos</span>
              <button 
                onClick={() => {
                  setTempBudget(list.budgetLimit.toString().replace('.', ','));
                  setIsBudgetOpen(true);
                }}
                className="flex items-center gap-1.5 text-lg font-black text-slate-900 hover:opacity-75 transition-opacity"
              >
                <span>{currency.symbol} {safeFormatMoney(budget)}</span>
                <Edit2 size={13} className={themeColor.text} />
              </button>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Disponível</span>
              <span className={`text-lg font-black ${totalCarrinho > budget ? 'text-rose-500' : themeColor.text}`}>
                {currency.symbol} {safeFormatMoney(remaining)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${totalCarrinho > budget ? 'bg-rose-500' : themeColor.bg}`}
              style={{ width: `${budgetUsagePercent}%` }}
            />
          </div>

          <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
            <span>{budgetUsagePercent.toFixed(0)}% UTILIZADO</span>
            <span>{currency.symbol} {safeFormatMoney(totalCarrinho)} NO CARRINHO</span>
          </div>

          {totalCarrinho > budget && (
            <div className="mt-3 p-2.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-2 text-rose-700 text-xs font-bold">
              <Lightbulb size={16} className="shrink-0" />
              <span>Atenção: Você ultrapassou sua meta em {currency.symbol} {safeFormatMoney(totalCarrinho - budget)}!</span>
            </div>
          )}
        </section>

        {/* Search Bar inside list */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar produto nesta lista..." 
            className={`w-full bg-white border border-slate-200/80 rounded-2xl py-3 pl-11 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${themeColor.ring} shadow-xs text-slate-800`}
          />
        </div>

        {/* Add Product Trigger & Form */}
        <div className="mb-4">
          {!showAddForm ? (
            <button 
              onClick={() => setShowAddForm(true)}
              className={`w-full py-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 hover:border-slate-300 font-bold text-sm transition-all active:scale-98`}
            >
              <Plus size={18} /> Adicionar novo produto
            </button>
          ) : (
            <motion.form 
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleAddItem}
              className="bg-white p-5 rounded-3xl shadow-md border border-slate-200/80 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Novo Item</span>
                <button
                  type="button"
                  onClick={() => setImportanceLevel((importanceLevel + 1) % 4)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                    importanceLevel > 0 
                      ? 'bg-amber-50 text-amber-600 border-amber-200' 
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <Star size={13} fill={importanceLevel > 0 ? 'currentColor' : 'none'} />
                  <span>Prioridade {importanceLevel > 0 ? importanceLevel : ''}</span>
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Nome do Produto</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Leite Integral, Arroz 5kg, Maçã..."
                  className={`w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 ${themeColor.ring}`}
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Categoria</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 ${themeColor.ring}`}
                  >
                    {ITEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Tipo de Medida</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                    <button 
                      type="button"
                      onClick={() => setIsWeightBased(false)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${!isWeightBased ? `bg-white shadow-xs ${themeColor.text}` : 'text-slate-500'}`}
                    >
                      Unidades
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsWeightBased(true)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${isWeightBased ? `bg-white shadow-xs ${themeColor.text}` : 'text-slate-500'}`}
                    >
                      Peso (KG)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    {isWeightBased ? 'Peso (ex: 1,5 kg)' : 'Quantidade'}
                  </label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={isWeightBased ? "1,0" : "1"}
                    className={`w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 ${themeColor.ring}`}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    {isWeightBased ? `Preço p/ KG (${currency.symbol})` : `Preço Unitário (${currency.symbol})`}
                  </label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0,00"
                    className={`w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 ${themeColor.ring}`}
                  />
                </div>
              </div>

              {/* Wholesale discount toggle */}
              <div className="pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={hasWholesale}
                    onChange={(e) => setHasWholesale(e.target.checked)}
                    className="rounded border-slate-300 text-green-600 focus:ring-green-500 w-4 h-4"
                  />
                  <span>Possui preço de atacado com desconto?</span>
                </label>

                {hasWholesale && (
                  <div className="grid grid-cols-2 gap-3 mt-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">A partir de (Qtd/KG)</label>
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={minWholesaleQty}
                        onChange={(e) => setMinWholesaleQty(e.target.value)}
                        placeholder="Ex: 3"
                        className="w-full h-10 px-3 rounded-xl bg-white border border-amber-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-1">Preço c/ Desconto ({currency.symbol})</label>
                      <input 
                        type="text"
                        inputMode="decimal"
                        value={wholesalePrice}
                        onChange={(e) => setWholesalePrice(e.target.value)}
                        placeholder="Ex: 4,99"
                        className="w-full h-10 px-3 rounded-xl bg-white border border-amber-200 text-xs font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Observações (opcional)</label>
                <input 
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Marca específica, embalagem verde..."
                  className={`w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 ${themeColor.ring}`}
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className={`flex-1 h-11 rounded-xl ${themeColor.bg} text-white font-bold text-xs shadow-xs hover:brightness-105 active:scale-98 transition-all`}
                >
                  Adicionar Item
                </button>
              </div>
            </motion.form>
          )}
        </div>

        {/* Item List */}
        <div className="space-y-2.5">
          <AnimatePresence>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const itemAmount = parseItemAmount(item);
                const unitPrice = calculateItemPrice(item);
                const itemSubtotal = calculateItemSubtotal(item);
                const isWholesaleApplied = item.minWholesaleQty && itemAmount >= item.minWholesaleQty && item.wholesalePrice;

                return (
                  <motion.div 
                    layout
                    key={item.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-white p-3.5 sm:p-4 rounded-2xl shadow-xs border transition-all ${
                      item.checked ? 'border-slate-100 bg-slate-50/60 opacity-80' : 'border-slate-200/70 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Star + Checkbox + Details */}
                      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                        {/* Star Priority Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleImportance(item.id, item.importanceLevel || 0)}
                          className={`transition-transform active:scale-75 shrink-0 mt-0.5 sm:mt-0 ${
                            item.importanceLevel === 1 ? 'text-amber-400' :
                            item.importanceLevel === 2 ? 'text-blue-500' :
                            item.importanceLevel === 3 ? 'text-orange-500' : 'text-slate-300 hover:text-slate-400'
                          }`}
                        >
                          <Star size={18} fill={(item.importanceLevel || 0) > 0 ? 'currentColor' : 'none'} />
                        </button>

                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleChecked(item.id)}
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shrink-0 mt-0.5 sm:mt-0 ${
                            item.checked 
                              ? `${themeColor.bg} ${themeColor.border} text-white` 
                              : 'border-slate-300 hover:border-slate-400 bg-white'
                          }`}
                        >
                          {item.checked && <Check size={14} strokeWidth={3} />}
                        </button>

                        {/* Name & metadata */}
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm sm:text-base font-bold break-words leading-snug ${item.checked ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {item.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              {item.category || 'Geral'}
                            </span>
                            {item.weight && (
                              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Scale size={11} /> {item.weight} kg
                              </span>
                            )}
                            {isWholesaleApplied && (
                              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                Atacado
                              </span>
                            )}
                            {item.notes && (
                              <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md break-words block">
                                📝 {item.notes}
                              </span>
                            )}
                          </div>

                          {/* Direct Gas Control integration button */}
                          {onNavigateToGas && (item.name.toLowerCase().includes('gás') || item.name.toLowerCase().includes('gas') || item.name.toLowerCase().includes('botijão') || item.name.toLowerCase().includes('botijao')) && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigateToGas(item.price);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-black text-orange-600 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-lg border border-orange-200 active:scale-95 transition-all mt-1.5"
                            >
                              <Flame size={11} className="shrink-0" />
                              <span>Registrar no Controle do Gás</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right: Stepper + Price + Edit/Delete */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        {/* Stepper */}
                        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, -1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-75 transition-transform"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <span className="text-xs font-bold text-slate-800 min-w-6 text-center">
                            {item.weight ? `${item.weight}kg` : item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, 1)}
                            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-75 transition-transform"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right min-w-16">
                          <span className="text-xs sm:text-sm font-black text-slate-900 block">
                            {unitPrice > 0 ? `${currency.symbol} ${safeFormatMoney(itemSubtotal)}` : 'Sem preço'}
                          </span>
                          {unitPrice > 0 && itemAmount > 1 && (
                            <span className="text-[9px] text-slate-400 block font-medium">
                              {currency.symbol} {safeFormatMoney(unitPrice)} un/kg
                            </span>
                          )}
                        </div>

                        {/* Edit & Delete Actions */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                            title="Editar item"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Excluir item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 text-slate-400">
                <p className="text-sm font-semibold">Nenhum produto cadastrado ou encontrado.</p>
                <p className="text-xs mt-1">Toque no botão acima para adicionar itens.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Sticky Bottom Checkout Footer */}
      <footer className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-xl z-40 no-print">
        <div className="max-w-2xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Estimado</span>
              <span className="text-sm font-bold text-slate-500">
                {currency.symbol} {safeFormatMoney(totalEstimado)}
              </span>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-bold ${themeColor.text} uppercase tracking-widest block`}>Total no Carrinho</span>
              <span className={`text-xl font-black ${themeColor.text}`}>
                {currency.symbol} {safeFormatMoney(totalCarrinho)}
              </span>
            </div>
          </div>

          {list.status === 'Concluído' ? (
            <div className="w-full h-13 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-sm border border-emerald-200">
              <Award size={18} /> Compra Finalizada ({list.completedAt || 'Concluída'})
            </div>
          ) : (
            <button
              onClick={() => onFinishList(list, totalCarrinho > 0 ? totalCarrinho : totalEstimado)}
              className={`w-full h-13 ${themeColor.bg} text-white rounded-2xl font-black text-base shadow-sm hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2`}
            >
              <Check size={20} strokeWidth={3} /> FINALIZAR COMPRA
            </button>
          )}
        </div>
      </footer>

      {/* Edit Item Modal */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">Editar Produto</h3>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nome</label>
                  <input 
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={`w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 ${themeColor.ring}`}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Categoria</label>
                    <select 
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                    >
                      {ITEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Prioridade</label>
                    <button
                      type="button"
                      onClick={() => setEditImportance((editImportance + 1) % 4)}
                      className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <Star size={14} fill={editImportance > 0 ? 'currentColor' : 'none'} className="text-amber-500" />
                      <span>{editImportance > 0 ? `Nível ${editImportance}` : 'Nenhuma'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      {editIsWeightBased ? 'Peso (KG)' : 'Quantidade'}
                    </label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">
                      {editIsWeightBased ? 'Preço p/ KG' : 'Preço Unitário'}
                    </label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                    />
                  </div>
                </div>

                {/* Wholesale edit */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={editHasWholesale}
                      onChange={(e) => setEditHasWholesale(e.target.checked)}
                      className="rounded border-slate-300 text-green-600 w-4 h-4"
                    />
                    <span>Desconto por quantidade/atacado</span>
                  </label>

                  {editHasWholesale && (
                    <div className="grid grid-cols-2 gap-3 mt-2 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Qtd Mínima</label>
                        <input 
                          type="text"
                          inputMode="decimal"
                          value={editMinWholesaleQty}
                          onChange={(e) => setEditMinWholesaleQty(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg bg-white border border-amber-200 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-1">Preço c/ Desconto</label>
                        <input 
                          type="text"
                          inputMode="decimal"
                          value={editWholesalePrice}
                          onChange={(e) => setEditWholesalePrice(e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg bg-white border border-amber-200 text-xs font-bold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Observações</label>
                  <input 
                    type="text"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Opcional"
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className={`flex-1 h-11 rounded-xl ${themeColor.bg} text-white font-bold text-xs shadow-xs`}
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Budget Modal */}
      <AnimatePresence>
        {isBudgetOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100"
            >
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">Meta de Gastos</h3>
              <form onSubmit={handleSaveBudget} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Novo Limite ({currency.symbol})
                  </label>
                  <input 
                    type="text"
                    inputMode="decimal"
                    value={tempBudget}
                    onChange={(e) => setTempBudget(e.target.value)}
                    className={`w-full h-12 px-4 rounded-2xl bg-slate-50 border border-slate-200 text-lg font-bold focus:outline-none focus:ring-2 ${themeColor.ring}`}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsBudgetOpen(false)}
                    className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className={`flex-1 h-12 rounded-2xl ${themeColor.bg} text-white font-bold text-sm shadow-xs`}
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
