'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBasket, 
  Home, 
  Zap, 
  Gamepad2, 
  History, 
  Settings, 
  Loader2,
  Flame
} from 'lucide-react';

import { View, GroceryList, PantryItem, Currency, ThemeColor, ListItem, GasCylinder, PantryHistoryEntry, PantryNotificationSettings } from '../lib/types';
import { 
  loadStoredLists, 
  saveStoredLists, 
  loadStoredPantry, 
  saveStoredPantry, 
  loadStoredGas,
  saveStoredGas,
  loadStoredSettings, 
  saveStoredSettings, 
  resetAllStorageData 
} from '../lib/storage';
import { generateId, safeNumber } from '../lib/utils';
import { 
  calculateGasMetrics, 
  getConsumptionIndicator, 
  predictNextExchangeDate, 
  getCylinderDuration 
} from '../lib/gasUtils';

import { ErrorBoundary } from '../components/ErrorBoundary';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';
import { ListsView } from '../components/ListsView';
import { DetailView } from '../components/DetailView';
import { PantryView } from '../components/PantryView';
import { GasView } from '../components/GasView';
import { OffersView } from '../components/OffersView';
import { HistoryView } from '../components/HistoryView';
import { SettingsView } from '../components/SettingsView';
import { GamesView } from '../components/GamesView';
import { checkAndTriggerScheduledNotifications } from '../lib/notifications';
import { ShareExportModal, ImportModal, PrintableList } from '../components/ExportImportModals';

function MercadoFreshAppContent() {
  const [hasMounted, setHasMounted] = useState(false);
  const [view, setView] = useState<View>('lists');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Core Data
  const [lists, setLists] = useState<GroceryList[]>(() => loadStoredLists());
  const [pantryItems, setPantryItems] = useState<PantryItem[]>(() => loadStoredPantry());
  const [gasCylinders, setGasCylinders] = useState<GasCylinder[]>(() => loadStoredGas());
  const [currency, setCurrency] = useState<Currency>(() => loadStoredSettings().currency);
  const [themeColor, setThemeColor] = useState<ThemeColor>(() => loadStoredSettings().theme);
  const [suggestions, setSuggestions] = useState<string>(() => loadStoredSettings().suggestions);
  const [pantryNotifications, setPantryNotifications] = useState<PantryNotificationSettings>(() => loadStoredSettings().pantryNotifications);
  const [isOffline, setIsOffline] = useState(false);

  // Export / Import & Pantry Integration Modals
  const [exportModalList, setExportModalList] = useState<GroceryList | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [targetListForImport, setTargetListForImport] = useState<GroceryList | null>(null);
  const [sharedListIncoming, setSharedListIncoming] = useState<GroceryList | null>(null);
  const [pendingFinishedList, setPendingFinishedList] = useState<{ list: GroceryList; total: number } | null>(null);
  const [isChoosingPantryItems, setIsChoosingPantryItems] = useState(false);
  const [selectedItemIdsForPantry, setSelectedItemIdsForPantry] = useState<Record<string, boolean>>({});

  // 1. Initial Load & Offline Listener
  useEffect(() => {
    setHasMounted(true);

    // Load persisted state
    const storedLists = loadStoredLists();
    setLists(storedLists);

    const storedPantry = loadStoredPantry();
    setPantryItems(storedPantry);

    const storedGas = loadStoredGas();
    setGasCylinders(storedGas);

    const storedSettings = loadStoredSettings();
    setCurrency(storedSettings.currency);
    setThemeColor(storedSettings.theme);
    setSuggestions(storedSettings.suggestions);

    // Online/Offline detection
    if (typeof window !== 'undefined') {
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      setIsOffline(!window.navigator.onLine);

      // Check for incoming shared list in URL param (?share=...)
      try {
        const params = new URLSearchParams(window.location.search);
        const shareData = params.get('share');
        if (shareData) {
          let decoded = '';
          try {
            const binary = atob(shareData);
            const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
            decoded = new TextDecoder().decode(bytes);
          } catch {
            decoded = decodeURIComponent(escape(atob(shareData)));
          }
          const parsed = JSON.parse(decoded) as GroceryList;
          if (parsed && parsed.name) {
            setSharedListIncoming(parsed);
          }
        }
      } catch (e) {
        console.warn('Erro ao processar link compartilhado:', e);
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Scheduled notifications background checker
  useEffect(() => {
    if (!pantryNotifications.enabled) return;

    checkAndTriggerScheduledNotifications(pantryNotifications);
    const interval = setInterval(() => {
      checkAndTriggerScheduledNotifications(pantryNotifications);
    }, 20000);

    return () => clearInterval(interval);
  }, [pantryNotifications]);

  // Auto-save on state change & unmount/beforeunload/visibilitychange
  useEffect(() => {
    if (!hasMounted) return;
    saveStoredLists(lists);
    saveStoredPantry(pantryItems);
    saveStoredGas(gasCylinders);
    saveStoredSettings({
      currency,
      theme: themeColor,
      suggestions,
      pantryNotifications
    });
  }, [lists, pantryItems, gasCylinders, currency, themeColor, suggestions, pantryNotifications, hasMounted]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      saveStoredLists(lists);
      saveStoredPantry(pantryItems);
      saveStoredGas(gasCylinders);
      saveStoredSettings({
        currency,
        theme: themeColor,
        suggestions,
        pantryNotifications
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveStoredLists(lists);
        saveStoredPantry(pantryItems);
        saveStoredGas(gasCylinders);
        saveStoredSettings({
          currency,
          theme: themeColor,
          suggestions,
          pantryNotifications
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lists, pantryItems, gasCylinders, currency, themeColor, suggestions, pantryNotifications]);

  // Sync selected list if deleted
  useEffect(() => {
    if (selectedListId && !lists.some(l => l.id === selectedListId)) {
      setSelectedListId(null);
    }
  }, [selectedListId, lists]);

  const selectedList = useMemo(() => {
    if (!selectedListId) return null;
    return lists.find(l => l.id === selectedListId) || null;
  }, [selectedListId, lists]);

  // --- Handlers for Grocery Lists ---

  const handleSelectList = (id: string) => {
    setSelectedListId(id);
  };

  const handleAddList = (name: string, budget: number) => {
    const newList: GroceryList = {
      id: generateId('list'),
      name,
      status: 'Em andamento',
      icon: 'ShoppingCart',
      color: 'bg-emerald-100 text-emerald-600',
      items: [],
      budgetLimit: budget > 0 ? budget : 200
    };
    const updated = [newList, ...lists];
    setLists(updated);
    saveStoredLists(updated);
    setSelectedListId(newList.id);
  };

  const handleUpdateList = (updatedList: GroceryList) => {
    const updated = lists.map(l => l.id === updatedList.id ? updatedList : l);
    setLists(updated);
    saveStoredLists(updated);
  };

  const handleDeleteList = (id: string) => {
    const updated = lists.filter(l => l.id !== id);
    setLists(updated);
    saveStoredLists(updated);
    if (selectedListId === id) {
      setSelectedListId(null);
    }
  };

  const handleDuplicateList = (list: GroceryList, newName: string) => {
    const copiedItems: ListItem[] = (list.items || []).map((item, idx) => ({
      ...item,
      id: generateId(`item-${idx}`),
      checked: false
    }));

    const newList: GroceryList = {
      ...list,
      id: generateId('list'),
      name: newName,
      status: 'Em andamento',
      completedAt: undefined,
      totalAmount: undefined,
      items: copiedItems
    };

    const updated = [newList, ...lists];
    setLists(updated);
    saveStoredLists(updated);
    setSelectedListId(newList.id);
  };

  const handleFinishList = (list: GroceryList, total: number) => {
    const now = new Date();
    const completedAt = `${now.getDate()} de ${now.toLocaleDateString('pt-BR', { month: 'short' })}`;

    const updatedList: GroceryList = {
      ...list,
      status: 'Concluído',
      completedAt,
      totalAmount: total
    };

    const updated = lists.map(l => l.id === list.id ? updatedList : l);
    setLists(updated);
    saveStoredLists(updated);
    setSelectedListId(null);

    setPendingFinishedList({ list: updatedList, total });
    const initialSelection: Record<string, boolean> = {};
    (updatedList.items || []).forEach(item => {
      initialSelection[item.id] = true;
    });
    setSelectedItemIdsForPantry(initialSelection);
    setIsChoosingPantryItems(false);
  };

  const handleAddFinishedListToPantry = (mode: 'all' | 'selected' | 'none') => {
    if (!pendingFinishedList) return;
    const { list } = pendingFinishedList;

    if (mode !== 'none') {
      const itemsToAdd = (list.items || []).filter(item => mode === 'all' || selectedItemIdsForPantry[item.id]);
      const todayStr = new Date().toISOString().slice(0, 10);

      const updatedPantry = [...pantryItems];

      itemsToAdd.forEach(item => {
        const existingIdx = updatedPantry.findIndex(p => p.name.toLowerCase().trim() === item.name.toLowerCase().trim());
        const qty = item.weight ? safeNumber(item.weight, 1) : (item.quantity || 1);
        const unit = item.unit || (item.weight ? 'kg' : 'un');
        const pricePaid = item.price || 0;

        const historyEntry: PantryHistoryEntry = {
          id: generateId('history'),
          purchaseDate: todayStr,
          quantityPurchased: qty,
          unit,
          brand: item.notes || '',
          pricePaid,
          reductions: [],
          status: 'active'
        };

        if (existingIdx >= 0) {
          const current = updatedPantry[existingIdx];
          const newHistory = [...(current.history || []), historyEntry];
          const newStock = current.stockQuantity + qty;
          const newTotal = current.inUseQuantity + newStock;
          updatedPantry[existingIdx] = {
            ...current,
            stockQuantity: newStock,
            quantity: newTotal,
            history: newHistory,
            lastPurchaseDate: todayStr,
            updatedAt: Date.now()
          };
        } else {
          const inUse = Math.min(1, qty);
          const stock = Math.max(0, qty - inUse);
          const newPantryItem: PantryItem = {
            id: generateId('pantry'),
            name: item.name,
            brand: item.notes || '',
            inUseQuantity: inUse,
            stockQuantity: stock,
            quantity: qty,
            unit,
            category: item.category || 'Alimentos',
            minQuantity: 1,
            restockBuyQuantity: 2,
            reminderEnabled: true,
            alertDismissedForMinQty: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastPurchaseDate: todayStr,
            history: [historyEntry]
          };
          updatedPantry.push(newPantryItem);
        }
      });

      setPantryItems(updatedPantry);
      saveStoredPantry(updatedPantry);
    }

    setPendingFinishedList(null);
    setIsChoosingPantryItems(false);
    setView('history');
  };

  const handlePantryNotificationsChange = (newSettings: PantryNotificationSettings) => {
    setPantryNotifications(newSettings);
    saveStoredSettings({ pantryNotifications: newSettings });
  };

  // --- Handlers for Pantry ---

  const handleUpdatePantry = (updatedItems: PantryItem[]) => {
    setPantryItems(updatedItems);
    saveStoredPantry(updatedItems);
  };

  const handleAddPantryItemToList = (
    listId: string, 
    itemData: { name: string; category: string; quantity: number; unit?: string; notes?: string }
  ) => {
    let target = lists.find(l => l.id === listId);
    let currentLists = [...lists];

    if (!target) {
      if (currentLists.length > 0) {
        target = currentLists[0];
      } else {
        target = {
          id: generateId('list'),
          name: 'Minhas Compras',
          status: 'Em andamento',
          icon: 'ShoppingCart',
          color: 'bg-emerald-100 text-emerald-600',
          items: [],
          budgetLimit: 250
        };
        currentLists = [target];
      }
    }

    const newItem: ListItem = {
      id: generateId('item'),
      name: itemData.name,
      category: itemData.category || 'Geral',
      price: 0,
      quantity: itemData.quantity || 1,
      unit: itemData.unit || 'un',
      notes: itemData.notes,
      checked: false
    };

    const updatedTarget: GroceryList = {
      ...target,
      items: [newItem, ...(target.items || [])]
    };

    const updatedLists = currentLists.map(l => l.id === updatedTarget.id ? updatedTarget : l);
    setLists(updatedLists);
    saveStoredLists(updatedLists);
  };

  // --- Handlers for Gas Control ---

  const handleUpdateGasCylinders = (updated: GasCylinder[]) => {
    setGasCylinders(updated);
    saveStoredGas(updated);
  };

  const handleAddGasToList = useCallback((listId: string, gasPrice: number, brand: string) => {
    let target = lists.find(l => l.id === listId);
    let currentLists = [...lists];

    if (!target) {
      target = lists[0];
      if (!target) {
        target = {
          id: generateId('list'),
          name: 'Compras da Semana',
          status: 'Em andamento',
          icon: 'ShoppingCart',
          color: 'bg-green-100 text-green-600',
          items: [],
          budgetLimit: 250
        };
        currentLists = [target];
      }
    }

    const newItem: ListItem = {
      id: generateId('item'),
      name: `Botijão de Gás (${brand || 'P13'})`,
      category: 'Despensa',
      price: gasPrice > 0 ? gasPrice : 120,
      quantity: 1,
      unit: 'un',
      checked: false,
      importanceLevel: 3,
      notes: 'Compra indicada pelo Controle do Gás'
    };

    const updatedTarget: GroceryList = {
      ...target,
      items: [newItem, ...(target.items || [])]
    };

    const updatedLists = currentLists.map(l => l.id === updatedTarget.id ? updatedTarget : l);
    setLists(updatedLists);
    saveStoredLists(updatedLists);
  }, [lists]);

  // --- Gas Consumption Alert for Shopping Lists ---
  const activeGasCylinder = useMemo(() => {
    return gasCylinders.find(c => c.status === 'in_use') || null;
  }, [gasCylinders]);

  const gasMetrics = useMemo(() => {
    return calculateGasMetrics(gasCylinders);
  }, [gasCylinders]);

  const gasAlertData = useMemo(() => {
    if (!activeGasCylinder) return null;
    const daysInUse = getCylinderDuration(activeGasCylinder);
    const indicator = getConsumptionIndicator(daysInUse, gasMetrics.averageDuration);
    const prediction = predictNextExchangeDate(activeGasCylinder.startDate, gasMetrics.averageDuration);

    const shouldShow = indicator.status === 'yellow' || indicator.status === 'red' || prediction.daysRemaining <= 5;
    if (!shouldShow) return null;

    return {
      show: true,
      message: indicator.status === 'red'
        ? `Botijão em uso há ${daysInUse} dias (média: ${gasMetrics.averageDuration} dias). Indicado comprar agora!`
        : `Botijão em uso há ${daysInUse} dias. Previsão de troca aproximada em ${prediction.formattedDate}.`,
      badgeText: indicator.badgeText,
      badgeBg: indicator.badgeBg,
      onAddToList: () => {
        const activeList = lists.find(l => l.status === 'Em andamento') || lists[0];
        if (activeList) {
          handleAddGasToList(activeList.id, activeGasCylinder.price, activeGasCylinder.brand || 'P13');
        }
      },
      onViewGas: () => {
        setSelectedListId(null);
        setView('gas');
      }
    };
  }, [activeGasCylinder, gasMetrics, lists, handleAddGasToList]);

  // --- Handlers for Settings ---

  const handleCurrencyChange = (c: Currency) => {
    setCurrency(c);
    saveStoredSettings({ currency: c });
  };

  const handleThemeChange = (t: ThemeColor) => {
    setThemeColor(t);
    saveStoredSettings({ theme: t });
  };

  const handleSuggestionsChange = (s: string) => {
    setSuggestions(s);
    saveStoredSettings({ suggestions: s });
  };

  const handleResetData = () => {
    resetAllStorageData();
    const freshLists = loadStoredLists();
    const freshPantry = loadStoredPantry();
    const freshGas = loadStoredGas();
    const freshSettings = loadStoredSettings();
    setLists(freshLists);
    setPantryItems(freshPantry);
    setGasCylinders(freshGas);
    setCurrency(freshSettings.currency);
    setThemeColor(freshSettings.theme);
    setSuggestions('');
    setSelectedListId(null);
    setView('lists');
  };

  // --- Handlers for Import / Export ---

  const handleImport = (
    importedData: { listName: string; items: ListItem[]; budgetLimit?: number },
    mode: 'new_list' | 'add_to_current'
  ) => {
    if (mode === 'add_to_current' && targetListForImport) {
      const existingIds = new Set(targetListForImport.items.map(i => i.id));
      const newItems = importedData.items.map(item => ({
        ...item,
        id: existingIds.has(item.id) ? generateId('item') : item.id
      }));

      const updatedList: GroceryList = {
        ...targetListForImport,
        items: [...(targetListForImport.items || []), ...newItems]
      };
      handleUpdateList(updatedList);
      setSelectedListId(updatedList.id);
    } else {
      const newList: GroceryList = {
        id: generateId('list'),
        name: importedData.listName || 'Lista Importada',
        status: 'Em andamento',
        icon: 'ShoppingBasket',
        color: 'bg-emerald-100 text-emerald-600',
        items: importedData.items,
        budgetLimit: importedData.budgetLimit || 200
      };
      const updated = [newList, ...lists];
      setLists(updated);
      saveStoredLists(updated);
      setSelectedListId(newList.id);
    }

    setIsImportModalOpen(false);
    setTargetListForImport(null);
  };

  const handleImportShared = () => {
    if (!sharedListIncoming) return;
    const imported: GroceryList = {
      ...sharedListIncoming,
      id: generateId('list'),
      name: `${sharedListIncoming.name} (Compartilhada)`,
      status: 'Em andamento',
      items: (sharedListIncoming.items || []).map(item => ({ ...item, checked: false }))
    };

    const updated = [imported, ...lists];
    setLists(updated);
    saveStoredLists(updated);
    setSharedListIncoming(null);
    setSelectedListId(imported.id);
  };

  // Loading screen before client mount
  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className={`w-10 h-10 animate-spin ${themeColor.text}`} />
        <span className="text-xs font-bold text-slate-400">Carregando Mercado Fresh...</span>
      </div>
    );
  }

  // Active View Title
  const getHeaderTitle = () => {
    switch (view) {
      case 'lists': return 'Mercado Fresh';
      case 'gas': return 'Controle do Gás';
      case 'pantry': return 'Despensa Inteligente';
      case 'offers': return 'Ofertas & Economia';
      case 'games': return 'Passatempo';
      case 'history': return 'Histórico';
      case 'settings': return 'Ajustes';
      default: return 'Mercado Fresh';
    }
  };

  const getHeaderIcon = () => {
    switch (view) {
      case 'lists': return <ShoppingBasket className={themeColor.text} size={26} />;
      case 'gas': return <Flame className="text-orange-600" size={26} />;
      case 'pantry': return <Home className={themeColor.text} size={26} />;
      case 'offers': return <Zap className={themeColor.text} size={26} />;
      case 'games': return <Gamepad2 className={themeColor.text} size={26} />;
      case 'history': return <History className={themeColor.text} size={26} />;
      case 'settings': return <Settings className={themeColor.text} size={26} />;
      default: return <ShoppingBasket className={themeColor.text} size={26} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Bar for main views */}
      {(!selectedListId || !selectedList) && (
        <TopBar 
          title={getHeaderTitle()} 
          themeColor={themeColor} 
          icon={getHeaderIcon()} 
        />
      )}

      {/* Offline Alert Strip */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider text-center py-1 fixed top-16 left-0 w-full z-30 flex items-center justify-center gap-1.5"
          >
            <Zap size={12} fill="white" />
            <span>Modo Offline Ativo • Seus dados continuam salvos com segurança</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Router */}
      <AnimatePresence mode="wait">
        <motion.div key={selectedListId || view}>
          {selectedListId && selectedList ? (
            <DetailView 
              list={selectedList}
              onBack={() => setSelectedListId(null)}
              onUpdateList={handleUpdateList}
              onFinishList={handleFinishList}
              onOpenExportModal={(list) => setExportModalList(list)}
              onOpenImportModal={(list) => {
                setTargetListForImport(list || null);
                setIsImportModalOpen(true);
              }}
              onNavigateToGas={() => {
                setSelectedListId(null);
                setView('gas');
              }}
              currency={currency}
              themeColor={themeColor}
            />
          ) : view === 'lists' ? (
            <ListsView 
              lists={lists}
              onSelectList={handleSelectList}
              onAddList={handleAddList}
              onDeleteList={handleDeleteList}
              onDuplicateList={handleDuplicateList}
              onShareList={(list) => setExportModalList(list)}
              onOpenImport={() => {
                setTargetListForImport(null);
                setIsImportModalOpen(true);
              }}
              onFinishList={handleFinishList}
              gasAlert={gasAlertData}
              currency={currency}
              themeColor={themeColor}
            />
          ) : view === 'gas' ? (
            <GasView 
              cylinders={gasCylinders}
              onUpdateCylinders={handleUpdateGasCylinders}
              lists={lists}
              onAddGasToList={handleAddGasToList}
              onNavigateToList={(listId) => {
                setSelectedListId(listId);
                setView('lists');
              }}
              currency={currency}
              themeColor={themeColor}
            />
          ) : view === 'pantry' ? (
            <PantryView 
              items={pantryItems}
              onUpdateItems={handleUpdatePantry}
              lists={lists}
              onAddToList={handleAddPantryItemToList}
              onNavigateToList={(listId) => {
                setSelectedListId(listId);
                setView('lists');
              }}
              themeColor={themeColor}
            />
          ) : view === 'offers' ? (
            <OffersView 
              currency={currency}
              themeColor={themeColor}
            />
          ) : view === 'games' ? (
            <GamesView 
              themeColor={themeColor}
            />
          ) : view === 'history' ? (
            <HistoryView 
              lists={lists}
              onDuplicateList={handleDuplicateList}
              onDeleteList={handleDeleteList}
              currency={currency}
              themeColor={themeColor}
            />
          ) : view === 'settings' ? (
            <SettingsView 
              currency={currency}
              onCurrencyChange={handleCurrencyChange}
              themeColor={themeColor}
              onThemeChange={handleThemeChange}
              suggestions={suggestions}
              onSuggestionsChange={handleSuggestionsChange}
              pantryNotifications={pantryNotifications}
              onPantryNotificationsChange={handlePantryNotificationsChange}
              onResetData={handleResetData}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      {/* Finish Purchase Pantry Integration Modal */}
      <AnimatePresence>
        {pendingFinishedList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center gap-3 mb-3 text-emerald-600">
                <ShoppingBasket size={24} />
                <h3 className="text-base font-extrabold text-slate-900">Compra Finalizada com Sucesso!</h3>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Deseja adicionar estes produtos à sua <strong>despensa</strong> para controlar o estoque e o consumo?
              </p>

              {!isChoosingPantryItems ? (
                <div className="space-y-2.5 mb-2">
                  <button
                    onClick={() => handleAddFinishedListToPantry('all')}
                    className={`w-full py-3.5 ${themeColor.bg} text-white rounded-2xl font-black text-xs shadow-xs hover:brightness-105 transition-all`}
                  >
                    Adicionar todos
                  </button>
                  <button
                    onClick={() => setIsChoosingPantryItems(true)}
                    className="w-full py-3.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl font-bold text-xs transition-all"
                  >
                    Escolher produtos
                  </button>
                  <button
                    onClick={() => handleAddFinishedListToPantry('none')}
                    className="w-full py-3.5 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-2xl font-bold text-xs transition-all"
                  >
                    Não adicionar
                  </button>
                </div>
              ) : (
                <div className="space-y-3 mb-4">
                  <p className="text-xs font-bold text-slate-700">Selecione os produtos para a despensa:</p>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
                    {(pendingFinishedList.list.items || []).map(item => (
                      <label key={item.id} className="flex items-center justify-between text-xs font-semibold text-slate-800 cursor-pointer p-1">
                        <span>{item.name} ({item.quantity} {item.unit || 'un'})</span>
                        <input
                          type="checkbox"
                          checked={!!selectedItemIdsForPantry[item.id]}
                          onChange={(e) => setSelectedItemIdsForPantry({
                            ...selectedItemIdsForPantry,
                            [item.id]: e.target.checked
                          })}
                          className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsChoosingPantryItems(false)}
                      className="flex-1 h-11 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={() => handleAddFinishedListToPantry('selected')}
                      className={`flex-1 h-11 rounded-xl ${themeColor.bg} text-white font-bold text-xs shadow-xs`}
                    >
                      Adicionar Selecionados
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Nav for main views */}
      {(!selectedListId || !selectedList) && (
        <BottomNav 
          activeView={view} 
          setView={(v) => {
            setSelectedListId(null);
            setView(v);
          }} 
          themeColor={themeColor} 
        />
      )}

      {/* Export / Share Modal */}
      <ShareExportModal 
        isOpen={!!exportModalList}
        onClose={() => setExportModalList(null)}
        list={exportModalList}
        currency={currency}
        themeColor={themeColor}
      />

      {/* Import Modal */}
      <ImportModal 
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setTargetListForImport(null);
        }}
        onImport={handleImport}
        currentList={targetListForImport}
        currency={currency}
        themeColor={themeColor}
      />

      {/* Shared List Incoming Modal */}
      <AnimatePresence>
        {sharedListIncoming && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100"
            >
              <h3 className="text-lg font-black text-slate-900 mb-2">Lista Compartilhada</h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Você recebeu a lista <strong>{sharedListIncoming.name}</strong> com {(sharedListIncoming.items || []).length} itens. Deseja importá-la para o seu app?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSharedListIncoming(null)}
                  className="flex-1 h-11 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  Ignorar
                </button>
                <button
                  onClick={handleImportShared}
                  className={`flex-1 h-11 rounded-2xl ${themeColor.bg} text-white font-bold text-xs shadow-xs hover:brightness-105 transition-all`}
                >
                  Importar Lista
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Printable Area for window.print() (PDF Layout) */}
      <PrintableList 
        list={exportModalList}
        currency={currency}
      />
    </div>
  );
}

export default function MercadoFreshApp() {
  return (
    <ErrorBoundary>
      <MercadoFreshAppContent />
    </ErrorBoundary>
  );
}
