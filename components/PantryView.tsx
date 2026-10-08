'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Plus, 
  Minus, 
  Package, 
  Search, 
  Trash2, 
  Edit3, 
  Sparkles, 
  ShoppingCart,
  AlertTriangle,
  History,
  BarChart2,
  Calendar,
  Clock
} from 'lucide-react';
import { PantryItem, GroceryList, ThemeColor, PantryHistoryEntry } from '../lib/types';
import { PANTRY_CATEGORIES, PANTRY_UNITS } from '../lib/constants';
import { safeNumber, generateId, safeFormatMoney } from '../lib/utils';

interface PantryViewProps {
  items: PantryItem[];
  onUpdateItems: (items: PantryItem[]) => void;
  lists: GroceryList[];
  onAddToList: (listId: string, item: { name: string; category: string; quantity: number; unit?: string; notes?: string }) => void;
  onNavigateToList: (listId: string) => void;
  themeColor: ThemeColor;
}

export const PantryView: React.FC<PantryViewProps> = ({
  items,
  onUpdateItems,
  lists,
  onAddToList,
  onNavigateToList,
  themeColor
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'summary'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'warning' | 'ok' | 'finished'>('all');

  // Form State (Add / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formInUseQuantity, setFormInUseQuantity] = useState('1');
  const [formStockQuantity, setFormStockQuantity] = useState('0');
  const [formUnit, setFormUnit] = useState('pacotes');
  const [formCategory, setFormCategory] = useState('Alimentos');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formMinQuantity, setFormMinQuantity] = useState('1');
  const [formRestockBuyQuantity, setFormRestockBuyQuantity] = useState('2');

  // History Modal State
  const [historyModalItem, setHistoryModalItem] = useState<PantryItem | null>(null);

  // Replenishment Alert Modal
  const [alertProduct, setAlertProduct] = useState<PantryItem | null>(null);
  const [selectedListIdForAlert, setSelectedListIdForAlert] = useState<string>('');
  const [alertBuyQuantity, setAlertBuyQuantity] = useState<number>(2);

  // In-app Notification Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; listId?: string } | null>(null);

  const showToast = (text: string, listId?: string) => {
    setToastMessage({ text, listId });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Helper stats calculation per item
  const getItemStats = (item: PantryItem) => {
    const history = item.history || [];
    let totalDurationDays = 0;
    let finishedCount = 0;

    history.forEach(h => {
      if (h.durationDays && h.durationDays > 0) {
        totalDurationDays += h.durationDays;
        finishedCount++;
      }
    });

    const avgDays = finishedCount > 0 ? Math.round(totalDurationDays / finishedCount) : (item.averageConsumptionDays || 0);
    const totalQty = (item.inUseQuantity || 0) + (item.stockQuantity || 0);
    
    // Status indicators: 🔴 Acabou (0), 🟠 Próximo de acabar (<= minQty), 🟡 Atenção (== minQty + 1), 🟢 Normal (> minQty + 1)
    let statusBadge = '🟢 Normal';
    let badgeColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (totalQty <= 0) {
      statusBadge = '🔴 Acabou';
      badgeColor = 'bg-rose-100 text-rose-700 border-rose-200';
    } else if (totalQty <= (item.minQuantity || 1)) {
      statusBadge = '🟠 Próximo de acabar';
      badgeColor = 'bg-orange-100 text-orange-700 border-orange-200';
    } else if (totalQty === (item.minQuantity || 1) + 1) {
      statusBadge = '🟡 Atenção';
      badgeColor = 'bg-amber-100 text-amber-700 border-amber-200';
    }

    let estimatedDaysLeft: number | null = null;
    if (avgDays > 0 && totalQty > 0) {
      const lastHistory = history[history.length - 1];
      const qtyPurchased = lastHistory ? lastHistory.quantityPurchased : (totalQty || 1);
      const daysPerUnit = qtyPurchased > 0 ? avgDays / qtyPurchased : avgDays;
      estimatedDaysLeft = Math.round(totalQty * daysPerUnit);
    }

    return { avgDays, statusBadge, badgeColor, estimatedDaysLeft, totalQty };
  };

  // Update In-Use Quantity (Em uso)
  const handleUpdateInUse = (item: PantryItem, newInUse: number) => {
    const diff = newInUse - item.inUseQuantity;
    const newTotal = newInUse + item.stockQuantity;
    const todayStr = new Date().toISOString().slice(0, 10);

    const history = [...(item.history || [])];
    const activeHistoryIdx = history.findIndex(h => h.status === 'active');
    const newHistory = [...history];

    if (diff < 0 && activeHistoryIdx >= 0) {
      const activeH = history[activeHistoryIdx];
      const amountWithdrawn = Math.abs(diff);
      const newReductions = [...activeH.reductions, { date: todayStr, amountWithdrawn, remaining: newTotal }];

      if (newTotal <= 0) {
        const diffTime = Math.abs(new Date(todayStr).getTime() - new Date(activeH.purchaseDate).getTime());
        const durationDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        newHistory[activeHistoryIdx] = {
          ...activeH,
          reductions: newReductions,
          endDate: todayStr,
          durationDays,
          status: 'finished'
        };
      } else {
        newHistory[activeHistoryIdx] = {
          ...activeH,
          reductions: newReductions
        };
      }
    }

    let totalDays = 0;
    let count = 0;
    newHistory.forEach(h => {
      if (h.durationDays && h.durationDays > 0 && h.status === 'finished') {
        totalDays += h.durationDays;
        count++;
      }
    });
    const avgDays = count > 0 ? Math.round(totalDays / count) : (item.averageConsumptionDays || 0);

    const shouldAlert = newTotal <= item.minQuantity && !item.alertDismissedForMinQty;

    const updated = items.map(p => p.id === item.id ? {
      ...p,
      inUseQuantity: newInUse,
      quantity: newTotal,
      history: newHistory,
      averageConsumptionDays: avgDays,
      updatedAt: Date.now()
    } : p);

    onUpdateItems(updated);

    if (shouldAlert || newTotal === 0) {
      setAlertProduct({ ...item, inUseQuantity: newInUse, stockQuantity: item.stockQuantity, quantity: newTotal });
      setAlertBuyQuantity(item.restockBuyQuantity || 2);
      if (lists.length > 0) {
        const active = lists.find(l => l.status === 'Em andamento') || lists[0];
        setSelectedListIdForAlert(active.id);
      }
    }
  };

  // Update Stock Quantity (Estoque)
  const handleUpdateStock = (item: PantryItem, newStock: number) => {
    const newTotal = item.inUseQuantity + newStock;
    const cycleReset = newTotal > item.minQuantity;

    const updated = items.map(p => p.id === item.id ? {
      ...p,
      stockQuantity: newStock,
      quantity: newTotal,
      alertDismissedForMinQty: cycleReset ? false : p.alertDismissedForMinQty,
      updatedAt: Date.now()
    } : p);
    onUpdateItems(updated);
  };

  // Open New (Abrir novo: -1 stock, +1 inUse)
  const handleOpenNew = (item: PantryItem) => {
    if (item.stockQuantity <= 0) {
      showToast(`⚠️ Não há unidades fechadas em estoque para abrir em "${item.name}".`);
      return;
    }
    const newStock = item.stockQuantity - 1;
    const newInUse = item.inUseQuantity + 1;
    const newTotal = newInUse + newStock;

    const updated = items.map(p => p.id === item.id ? {
      ...p,
      stockQuantity: newStock,
      inUseQuantity: newInUse,
      quantity: newTotal,
      updatedAt: Date.now()
    } : p);
    onUpdateItems(updated);
    showToast(`🔓 1 unidade de "${item.name}" aberta para uso!`);
  };

  // Confirm Replenishment to Grocery List with Duplicate Check
  const handleConfirmAddToList = () => {
    if (!alertProduct) return;
    let targetListId = selectedListIdForAlert;
    if (!targetListId && lists.length > 0) {
      targetListId = lists[0].id;
    }
    const targetList = lists.find(l => l.id === targetListId) || lists[0];
    if (!targetList) return;

    const itemNameLower = alertProduct.name.toLowerCase().trim();
    const alreadyExists = (targetList.items || []).some(li => (li.name || '').toLowerCase().trim() === itemNameLower);

    if (alreadyExists) {
      showToast(`⚠️ ${alertProduct.name} já está na sua lista de compras (${targetList.name}).`);
      setAlertProduct(null);
      return;
    }

    const itemNameToAdd = `${alertProduct.name}${alertProduct.brand ? ` ${alertProduct.brand}` : ''}`.trim();
    onAddToList(targetListId, {
      name: itemNameToAdd,
      category: alertProduct.category || 'Despensa',
      quantity: alertBuyQuantity > 0 ? alertBuyQuantity : 1,
      unit: alertProduct.unit,
      notes: `Reposição da despensa (estoque total atual: ${alertProduct.quantity} ${alertProduct.unit})`
    });

    const updated = items.map(p => p.id === alertProduct.id ? { ...p, alertDismissedForMinQty: true, updatedAt: Date.now() } : p);
    onUpdateItems(updated);

    showToast(`🛒 ${itemNameToAdd} adicionado à lista "${targetList.name}"!`, targetListId);
    setAlertProduct(null);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormBrand('');
    setFormInUseQuantity('1');
    setFormStockQuantity('0');
    setFormUnit('pacotes');
    setFormCategory('Alimentos');
    setFormExpiryDate('');
    setFormMinQuantity('1');
    setFormRestockBuyQuantity('2');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: PantryItem) => {
    setEditingItem(item);
    setFormName(item.name || '');
    setFormBrand(item.brand || '');
    setFormInUseQuantity((item.inUseQuantity ?? 1).toString());
    setFormStockQuantity((item.stockQuantity ?? 0).toString());
    setFormUnit(item.unit || 'pacotes');
    setFormCategory(item.category || 'Alimentos');
    setFormExpiryDate(item.expiryDate || '');
    setFormMinQuantity((item.minQuantity ?? 1).toString());
    setFormRestockBuyQuantity((item.restockBuyQuantity ?? 2).toString());
    setIsFormOpen(true);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parsedInUse = Math.max(0, safeNumber(formInUseQuantity, 1));
    const parsedStock = Math.max(0, safeNumber(formStockQuantity, 0));
    const totalQty = parsedInUse + parsedStock;
    const parsedMin = Math.max(0, safeNumber(formMinQuantity, 1));
    const parsedRestock = Math.max(1, safeNumber(formRestockBuyQuantity, 2));

    if (editingItem) {
      const updated = items.map(p => p.id === editingItem.id ? {
        ...p,
        name: formName.trim(),
        brand: formBrand.trim(),
        inUseQuantity: parsedInUse,
        stockQuantity: parsedStock,
        quantity: totalQty,
        unit: formUnit,
        category: formCategory,
        expiryDate: formExpiryDate || undefined,
        minQuantity: parsedMin,
        restockBuyQuantity: parsedRestock,
        updatedAt: Date.now()
      } : p);
      onUpdateItems(updated);
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      const historyEntry: PantryHistoryEntry = {
        id: generateId('history'),
        purchaseDate: todayStr,
        quantityPurchased: totalQty,
        unit: formUnit,
        brand: formBrand.trim(),
        reductions: [],
        status: 'active'
      };

      const newItem: PantryItem = {
        id: generateId('pantry'),
        name: formName.trim(),
        brand: formBrand.trim(),
        inUseQuantity: parsedInUse,
        stockQuantity: parsedStock,
        quantity: totalQty,
        unit: formUnit,
        category: formCategory,
        expiryDate: formExpiryDate || undefined,
        minQuantity: parsedMin,
        restockBuyQuantity: parsedRestock,
        reminderEnabled: true,
        alertDismissedForMinQty: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastPurchaseDate: todayStr,
        history: [historyEntry]
      };
      onUpdateItems([newItem, ...items]);
    }

    setIsFormOpen(false);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateItems(items.filter(p => p.id !== id));
  };

  // Metrics
  const criticalCount = useMemo(() => items.filter(i => i && ((i.inUseQuantity ?? 0) + (i.stockQuantity ?? 0)) <= (i.minQuantity ?? 1) && ((i.inUseQuantity ?? 0) + (i.stockQuantity ?? 0)) > 0).length, [items]);
  const finishedCount = useMemo(() => items.filter(i => i && ((i.inUseQuantity ?? 0) + (i.stockQuantity ?? 0)) <= 0).length, [items]);
  const warningCount = useMemo(() => items.filter(i => i && ((i.inUseQuantity ?? 0) + (i.stockQuantity ?? 0)) === (i.minQuantity ?? 1) + 1).length, [items]);
  const okCount = useMemo(() => items.filter(i => i && ((i.inUseQuantity ?? 0) + (i.stockQuantity ?? 0)) > (i.minQuantity ?? 1) + 1).length, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!item) return false;
      const term = (searchTerm || '').toLowerCase();
      const matchName = (item.name || '').toLowerCase().includes(term);
      const matchBrand = (item.brand || '').toLowerCase().includes(term);
      const matchesSearch = matchName || matchBrand;

      const matchesCat = selectedCategory === 'Todas' || item.category === selectedCategory;

      let matchesFilter = true;
      const total = (item.inUseQuantity ?? 0) + (item.stockQuantity ?? 0);
      const min = item.minQuantity ?? 1;
      if (activeFilter === 'critical') matchesFilter = total <= min && total > 0;
      if (activeFilter === 'finished') matchesFilter = total <= 0;
      if (activeFilter === 'warning') matchesFilter = total === min + 1;
      if (activeFilter === 'ok') matchesFilter = total > min + 1;

      return matchesSearch && matchesCat && matchesFilter;
    });
  }, [items, searchTerm, selectedCategory, activeFilter]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-20 px-4 max-w-2xl mx-auto pb-32"
    >
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className="fixed top-18 left-4 right-4 max-w-md mx-auto z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400 shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
            {toastMessage.listId && (
              <button
                onClick={() => {
                  onNavigateToList(toastMessage.listId!);
                  setToastMessage(null);
                }}
                className="font-bold text-emerald-400 hover:underline shrink-0"
              >
                Ver Lista →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-3xl shadow-sm mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Home size={15} /> Despensa Inteligente
          </div>
          <span className="text-[11px] bg-white/10 px-2.5 py-0.5 rounded-full font-semibold">
            {items.length} {items.length === 1 ? 'produto' : 'produtos'}
          </span>
        </div>
        <h2 className="text-xl font-black mb-1">Controle de Estoque & Consumo</h2>
        <p className="text-xs text-slate-300 leading-relaxed">
          Gerencie o que está em uso e o que está fechado em estoque. O app calcula seu consumo e avisa quando repor.
        </p>

        {/* Tabs inside Header */}
        <div className="flex bg-white/10 p-1 rounded-2xl mt-4 gap-1">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'inventory' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            📦 Estoque Atual
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'summary' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            📊 Meu Consumo
          </button>
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button
              onClick={() => setActiveFilter(activeFilter === 'critical' ? 'all' : 'critical')}
              className={`p-2.5 rounded-2xl border text-center transition-all ${
                activeFilter === 'critical' ? 'bg-orange-50 border-orange-300 shadow-xs' : 'bg-white border-slate-200/80'
              }`}
            >
              <span className="text-base font-black text-orange-600 block">{criticalCount}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Baixo</span>
            </button>

            <button
              onClick={() => setActiveFilter(activeFilter === 'finished' ? 'all' : 'finished')}
              className={`p-2.5 rounded-2xl border text-center transition-all ${
                activeFilter === 'finished' ? 'bg-rose-50 border-rose-300 shadow-xs' : 'bg-white border-slate-200/80'
              }`}
            >
              <span className="text-base font-black text-rose-600 block">{finishedCount}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Acabou</span>
            </button>

            <button
              onClick={() => setActiveFilter(activeFilter === 'warning' ? 'all' : 'warning')}
              className={`p-2.5 rounded-2xl border text-center transition-all ${
                activeFilter === 'warning' ? 'bg-amber-50 border-amber-300 shadow-xs' : 'bg-white border-slate-200/80'
              }`}
            >
              <span className="text-base font-black text-amber-600 block">{warningCount}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Atenção</span>
            </button>

            <button
              onClick={() => setActiveFilter(activeFilter === 'ok' ? 'all' : 'ok')}
              className={`p-2.5 rounded-2xl border text-center transition-all ${
                activeFilter === 'ok' ? 'bg-emerald-50 border-emerald-300 shadow-xs' : 'bg-white border-slate-200/80'
              }`}
            >
              <span className="text-base font-black text-emerald-600 block">{okCount}</span>
              <span className="text-[9px] font-bold text-slate-500 uppercase">Normal</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2 mb-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar produto na despensa..."
                className={`w-full bg-white border border-slate-200/80 rounded-2xl py-2.5 pl-10 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${themeColor.ring} shadow-xs text-slate-800`}
              />
            </div>

            {/* Categories Bar */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {['Todas', ...PANTRY_CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat 
                      ? `${themeColor.bg} text-white` 
                      : 'bg-white border border-slate-200/70 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Add New Product Button */}
          <button
            onClick={handleOpenAdd}
            className={`w-full py-3.5 ${themeColor.bg} text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:brightness-105 active:scale-98 transition-all mb-4`}
          >
            <Plus size={16} strokeWidth={3} />
            <span>Cadastrar Produto na Despensa</span>
          </button>

          {/* Product List */}
          <div className="space-y-3">
            <AnimatePresence>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const stats = getItemStats(item);
                  const total = (item.inUseQuantity || 0) + (item.stockQuantity || 0);

                  return (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/70 space-y-3 hover:shadow-sm transition-all"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Left: Metadata + Name */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${stats.badgeColor}`}>
                              {stats.statusBadge}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                              {item.category}
                            </span>
                            {stats.estimatedDaysLeft !== null && stats.estimatedDaysLeft > 0 && (
                              <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                <Clock size={11} /> ~{stats.estimatedDaysLeft} dias est.
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm sm:text-base font-bold text-slate-900 break-words leading-snug">{item.name}</h4>
                          <p className="text-xs text-slate-500 break-words mt-1">
                            {item.brand ? <strong className="text-slate-700">{item.brand}</strong> : ''}{item.brand ? ' • ' : ''}Mínimo: {item.minQuantity} {item.unit}
                            {stats.avgDays > 0 ? ` • Média: 1 un a cada ${Math.round(stats.avgDays / (item.history?.[0]?.quantityPurchased || 1))} dias` : ''}
                          </p>
                        </div>

                        {/* Right: Em uso & Estoque Independent Controls */}
                        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                          
                          {/* Em uso & Estoque Steppers Box */}
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200/70">
                            {/* Em uso */}
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">🔓 Em uso</span>
                              <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 gap-1 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateInUse(item, Math.max(0, item.inUseQuantity - 1))}
                                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-75 transition-transform"
                                  title="Diminuir em uso (-1)"
                                >
                                  <Minus size={13} strokeWidth={2.5} />
                                </button>
                                <span className="text-xs font-black min-w-7 text-center text-slate-900">
                                  {item.inUseQuantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateInUse(item, item.inUseQuantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-75 transition-transform"
                                  title="Aumentar em uso (+1)"
                                >
                                  <Plus size={13} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>

                            <div className="w-px h-9 bg-slate-200 self-center mx-0.5"></div>

                            {/* Estoque */}
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] font-bold text-slate-600 mb-1 flex items-center gap-1">📦 Estoque</span>
                              <div className="flex items-center bg-white rounded-xl border border-slate-200 p-0.5 gap-1 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStock(item, Math.max(0, item.stockQuantity - 1))}
                                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-75 transition-transform"
                                  title="Diminuir estoque (-1)"
                                >
                                  <Minus size={13} strokeWidth={2.5} />
                                </button>
                                <span className="text-xs font-black min-w-7 text-center text-slate-900">
                                  {item.stockQuantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStock(item, item.stockQuantity + 1)}
                                  className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-slate-900 active:scale-75 transition-transform"
                                  title="Aumentar estoque (+1)"
                                >
                                  <Plus size={13} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenNew(item)}
                              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                item.stockQuantity > 0 
                                  ? `${themeColor.bg} text-white shadow-xs hover:brightness-105 active:scale-98` 
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                              title={item.stockQuantity > 0 ? "Abrir 1 unidade do estoque" : "Sem estoque fechado"}
                            >
                              🔓 Abrir Novo
                            </button>

                            {total <= (item.minQuantity || 1) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setAlertProduct(item);
                                  setAlertBuyQuantity(item.restockBuyQuantity || 2);
                                  if (lists.length > 0) {
                                    setSelectedListIdForAlert(lists[0].id);
                                  }
                                }}
                                className={`p-2.5 rounded-xl ${themeColor.light} ${themeColor.text} hover:opacity-80 transition-opacity`}
                                title="Adicionar à lista de compras"
                              >
                                <ShoppingCart size={16} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setHistoryModalItem(item)}
                              className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all"
                              title="Ver histórico de consumo"
                            >
                              <History size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                              title="Editar"
                            >
                              <Edit3 size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Summary footer & Quick consume */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="font-bold text-slate-700 flex items-center gap-2">
                          <span>Total: <strong className="text-slate-900">{total} {item.unit}</strong></span>
                          <span className="text-slate-300">|</span>
                          <span className="text-[11px] text-slate-500 font-normal">🔓 Em uso: {item.inUseQuantity} | 📦 Estoque: {item.stockQuantity}</span>
                        </div>

                        {item.inUseQuantity > 0 && (
                          <button
                            onClick={() => handleUpdateInUse(item, item.inUseQuantity - 1)}
                            className="text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors"
                          >
                            Consumir Em uso (-1)
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Package size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold text-slate-600">Nenhum produto cadastrado na despensa.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Cadastre itens da sua casa para controlar o que está em uso e em estoque.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        /* --- Meu Consumo Summary Tab --- */
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl shadow-xs border border-slate-200/70">
            <h3 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-2">
              <BarChart2 size={18} className={themeColor.text} />
              <span>Resumo Analítico do Consumo</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total na Despensa</span>
                <span className="text-lg font-black text-slate-900">{items.length} itens</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Precisam de Reposição</span>
                <span className="text-lg font-black text-rose-600">
                  {items.filter(i => ((i.inUseQuantity ?? 0) + (i.stockQuantity ?? 0)) <= (i.minQuantity ?? 1)).length} itens
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Produtos com Histórico de Duração</h4>
              {items.filter(i => i.history && i.history.length > 0).length > 0 ? (
                items.filter(i => i.history && i.history.length > 0).map(item => {
                  const stats = getItemStats(item);
                  return (
                    <div key={item.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{item.name} {item.brand ? `(${item.brand})` : ''}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {stats.avgDays > 0 ? `Duração média: ${stats.avgDays} dias` : 'Aprendendo padrão...'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${stats.badgeColor}`}>
                          {stats.totalQty} {item.unit}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">
                  Nenhum histórico de consumo registrado ainda. Dê baixa nos produtos para gerar estatísticas!
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      <AnimatePresence>
        {historyModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <History size={18} className={themeColor.text} />
                  <span>Histórico: {historyModalItem.name}</span>
                </h3>
                <button
                  onClick={() => setHistoryModalItem(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-bold text-slate-700">Média de Consumo:</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5">
                    {getItemStats(historyModalItem).avgDays > 0 
                      ? `Aprox. 1 unidade a cada ${Math.round(getItemStats(historyModalItem).avgDays / (historyModalItem.history?.[0]?.quantityPurchased || 1))} dias` 
                      : 'Dados insuficientes para calcular média.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lotes e Registros de Baixa:</p>
                  {historyModalItem.history && historyModalItem.history.length > 0 ? (
                    historyModalItem.history.map((h, hIdx) => (
                      <div key={h.id || hIdx} className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            <Calendar size={13} className="text-emerald-600" /> Compra em {h.purchaseDate}
                          </span>
                          <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            +{h.quantityPurchased} {h.unit}
                          </span>
                        </div>

                        {h.pricePaid !== undefined && h.pricePaid > 0 && (
                          <p className="text-[11px] text-slate-500">Valor pago: R$ {safeFormatMoney(h.pricePaid)}</p>
                        )}

                        {h.reductions.length > 0 && (
                          <div className="pl-3 border-l-2 border-slate-200 space-y-1 pt-1">
                            {h.reductions.map((r, rIdx) => (
                              <p key={rIdx} className="text-[11px] text-slate-600">
                                • {r.date}: Usou {r.amountWithdrawn} → restaram {r.remaining} {h.unit}
                              </p>
                            ))}
                          </div>
                        )}

                        {h.status === 'finished' && h.endDate && (
                          <p className="text-[11px] font-bold text-rose-600 pt-1 border-t border-slate-100">
                            Acabou em {h.endDate} (Durou {h.durationDays} dias)
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4">Nenhum registro histórico para este produto.</p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setHistoryModalItem(null)}
                className={`w-full mt-5 h-11 rounded-2xl ${themeColor.bg} text-white font-bold text-xs`}
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto"
            >
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">
                {editingItem ? 'Editar Produto na Despensa' : 'Novo Produto na Despensa'}
              </h3>
              <form onSubmit={handleSaveForm} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nome do Produto</label>
                  <input 
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Arroz, Leite, Café..."
                    className={`w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 ${themeColor.ring}`}
                    autoFocus
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Marca (opcional)</label>
                    <input 
                      type="text"
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="Ex: Camil, Tio João"
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Categoria</label>
                    <select 
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                    >
                      {PANTRY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Independent Em uso & Estoque form fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">🔓 Em uso (aberto)</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={formInUseQuantity}
                      onChange={(e) => setFormInUseQuantity(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">📦 Estoque (fechado)</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={formStockQuantity}
                      onChange={(e) => setFormStockQuantity(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Unidade</label>
                    <select 
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                    >
                      {PANTRY_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Estoque Mínimo</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={formMinQuantity}
                      onChange={(e) => setFormMinQuantity(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Qtd Sugerida Compra</label>
                    <input 
                      type="text"
                      inputMode="decimal"
                      value={formRestockBuyQuantity}
                      onChange={(e) => setFormRestockBuyQuantity(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Validade (opcional)</label>
                    <input 
                      type="date"
                      value={formExpiryDate}
                      onChange={(e) => setFormExpiryDate(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className={`flex-1 h-11 rounded-xl ${themeColor.bg} text-white font-bold text-xs shadow-xs`}
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Replenishment Alert to Grocery List Modal */}
      <AnimatePresence>
        {alertProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100"
            >
              <div className="flex items-center gap-3 mb-3 text-amber-600">
                <AlertTriangle size={24} />
                <h3 className="text-base font-extrabold text-slate-900">Hora de Repor!</h3>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                O produto <strong>{alertProduct.name}</strong> está com estoque baixo (Total: {alertProduct.quantity} {alertProduct.unit}). Deseja adicioná-lo à sua lista de compras?
              </p>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Qual lista?</label>
                  <select
                    value={selectedListIdForAlert}
                    onChange={(e) => setSelectedListIdForAlert(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                  >
                    {lists.map(l => <option key={l.id} value={l.id}>{l.name} ({l.status})</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Quantidade para comprar:</label>
                  <input
                    type="number"
                    min="1"
                    value={alertBuyQuantity}
                    onChange={(e) => setAlertBuyQuantity(parseInt(e.target.value, 10) || 1)}
                    className="w-full h-11 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setAlertProduct(null)}
                  className="flex-1 h-11 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  Agora Não
                </button>
                <button
                  onClick={handleConfirmAddToList}
                  className={`flex-1 h-11 rounded-2xl ${themeColor.bg} text-white font-bold text-xs shadow-xs`}
                >
                  Adicionar à Lista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
