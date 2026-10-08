'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Calendar, 
  DollarSign, 
  Clock, 
  BarChart3, 
  Plus, 
  ShoppingCart, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Tag, 
  Check 
} from 'lucide-react';
import { GasCylinder, GroceryList, ThemeColor, Currency } from '../lib/types';
import { 
  getCylinderDuration, 
  getCylinderCostPerDay, 
  calculateGasMetrics, 
  getConsumptionIndicator, 
  predictNextExchangeDate, 
  formatDateBR, 
  getTodayDateString 
} from '../lib/gasUtils';
import { safeFormatMoney, generateId } from '../lib/utils';
import { GAS_BRANDS } from '../lib/constants';

interface GasViewProps {
  cylinders: GasCylinder[];
  onUpdateCylinders: (cylinders: GasCylinder[]) => void;
  lists: GroceryList[];
  onAddGasToList: (listId: string, gasPrice: number, brand: string) => void;
  onNavigateToList: (listId: string) => void;
  currency: Currency;
  themeColor: ThemeColor;
}

export const GasView: React.FC<GasViewProps> = ({
  cylinders,
  onUpdateCylinders,
  lists,
  onAddGasToList,
  onNavigateToList,
  currency,
  themeColor
}) => {
  // Modal states
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isAddToListModalOpen, setIsAddToListModalOpen] = useState(false);
  const [editingCylinder, setEditingCylinder] = useState<GasCylinder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addedToListNotification, setAddedToListNotification] = useState<string | null>(null);

  // Form states for new/edit cylinder
  const [formPurchaseDate, setFormPurchaseDate] = useState(getTodayDateString());
  const [formStartDate, setFormStartDate] = useState(getTodayDateString());
  const [formEndDate, setFormEndDate] = useState('');
  const [formPrice, setFormPrice] = useState('120,00');
  const [formBrand, setFormBrand] = useState('Supergasbras');
  const [formNotes, setFormNotes] = useState('');
  const [formSetAsInUse, setFormSetAsInUse] = useState(true);

  // Form state for finishing active cylinder
  const [finishEndDate, setFinishEndDate] = useState(getTodayDateString());
  const [startNewImmediately, setStartNewImmediately] = useState(false);

  // Form state for adding gas item to grocery list
  const [selectedTargetListId, setSelectedTargetListId] = useState<string>(
    lists.find(l => l.status === 'Em andamento')?.id || (lists[0]?.id ?? '')
  );

  // Current active cylinder in use
  const activeCylinder = useMemo(() => {
    return cylinders.find(c => c.status === 'in_use') || null;
  }, [cylinders]);

  // Previous finished cylinders
  const finishedCylinders = useMemo(() => {
    return cylinders
      .filter(c => c.status === 'finished')
      .sort((a, b) => new Date(`${b.startDate}T00:00:00`).getTime() - new Date(`${a.startDate}T00:00:00`).getTime());
  }, [cylinders]);

  // Summary Metrics
  const metrics = useMemo(() => {
    return calculateGasMetrics(cylinders);
  }, [cylinders]);

  // Active cylinder calculations
  const activeDurationDays = useMemo(() => {
    if (!activeCylinder) return 0;
    return getCylinderDuration(activeCylinder);
  }, [activeCylinder]);

  const activeCostPerDay = useMemo(() => {
    if (!activeCylinder) return 0;
    return getCylinderCostPerDay(activeCylinder);
  }, [activeCylinder]);

  // Consumption Indicator & Prediction
  const indicator = useMemo(() => {
    return getConsumptionIndicator(activeDurationDays, metrics.averageDuration);
  }, [activeDurationDays, metrics.averageDuration]);

  const prediction = useMemo(() => {
    if (!activeCylinder) return null;
    return predictNextExchangeDate(activeCylinder.startDate, metrics.averageDuration);
  }, [activeCylinder, metrics.averageDuration]);

  // Open Register Modal
  const handleOpenRegister = (cylinderToEdit?: GasCylinder) => {
    if (cylinderToEdit) {
      setEditingCylinder(cylinderToEdit);
      setFormPurchaseDate(cylinderToEdit.purchaseDate || getTodayDateString());
      setFormStartDate(cylinderToEdit.startDate || getTodayDateString());
      setFormEndDate(cylinderToEdit.endDate || '');
      setFormPrice(cylinderToEdit.price ? cylinderToEdit.price.toFixed(2).replace('.', ',') : '120,00');
      setFormBrand(cylinderToEdit.brand || 'Supergasbras');
      setFormNotes(cylinderToEdit.notes || '');
      setFormSetAsInUse(cylinderToEdit.status === 'in_use');
    } else {
      setEditingCylinder(null);
      setFormPurchaseDate(getTodayDateString());
      setFormStartDate(getTodayDateString());
      setFormEndDate('');
      setFormPrice(activeCylinder ? activeCylinder.price.toFixed(2).replace('.', ',') : '120,00');
      setFormBrand(activeCylinder?.brand || 'Supergasbras');
      setFormNotes('');
      // If there's already an active cylinder, default to false unless user wants to replace it
      setFormSetAsInUse(!activeCylinder);
    }
    setIsRegisterModalOpen(true);
  };

  // Save New or Edited Cylinder
  const handleSaveCylinder = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(formPrice.replace(/\./g, '').replace(',', '.')) || 0;
    const isFinished = Boolean(formEndDate.trim());
    const finalStatus: 'in_use' | 'finished' = isFinished ? 'finished' : (formSetAsInUse ? 'in_use' : 'finished');

    let updatedList = [...cylinders];

    // If new cylinder is marked as 'in_use', retire any current 'in_use' cylinder if needed
    if (finalStatus === 'in_use') {
      updatedList = updatedList.map(c => {
        if (c.status === 'in_use' && (!editingCylinder || c.id !== editingCylinder.id)) {
          return {
            ...c,
            status: 'finished' as const,
            endDate: formStartDate || getTodayDateString(),
            updatedAt: Date.now()
          };
        }
        return c;
      });
    }

    if (editingCylinder) {
      // Edit existing
      updatedList = updatedList.map(c => {
        if (c.id === editingCylinder.id) {
          return {
            ...c,
            purchaseDate: formPurchaseDate,
            startDate: formStartDate,
            endDate: isFinished ? formEndDate : null,
            price: parsedPrice,
            brand: formBrand.trim() || 'P13',
            notes: formNotes.trim() || undefined,
            status: finalStatus,
            updatedAt: Date.now()
          };
        }
        return c;
      });
    } else {
      // Create new
      const newCylinder: GasCylinder = {
        id: generateId('gas'),
        purchaseDate: formPurchaseDate,
        startDate: formStartDate,
        endDate: isFinished ? formEndDate : null,
        price: parsedPrice,
        brand: formBrand.trim() || 'P13',
        notes: formNotes.trim() || undefined,
        status: finalStatus,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      updatedList = [newCylinder, ...updatedList];
    }

    onUpdateCylinders(updatedList);
    setIsRegisterModalOpen(false);
  };

  // Finish Active Cylinder
  const handleConfirmFinishActive = () => {
    if (!activeCylinder) return;
    const finalEndDate = finishEndDate || getTodayDateString();

    let updatedList = cylinders.map(c => {
      if (c.id === activeCylinder.id) {
        return {
          ...c,
          status: 'finished' as const,
          endDate: finalEndDate,
          updatedAt: Date.now()
        };
      }
      return c;
    });

    // If user chose to immediately register new one
    if (startNewImmediately) {
      const newCylinder: GasCylinder = {
        id: generateId('gas'),
        purchaseDate: finalEndDate,
        startDate: finalEndDate,
        endDate: null,
        price: activeCylinder.price,
        brand: activeCylinder.brand || 'P13',
        notes: 'Novo botijão instalado após troca',
        status: 'in_use',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      updatedList = [newCylinder, ...updatedList];
    }

    onUpdateCylinders(updatedList);
    setIsFinishModalOpen(false);
    setStartNewImmediately(false);
  };

  // Delete Cylinder
  const handleDeleteCylinder = (id: string) => {
    const updated = cylinders.filter(c => c.id !== id);
    onUpdateCylinders(updated);
    setDeletingId(null);
  };

  // Add Gas to Shopping List
  const handleConfirmAddToList = () => {
    if (!selectedTargetListId) return;
    const suggestedPrice = activeCylinder?.price || (metrics.averagePrice > 0 ? metrics.averagePrice : 120);
    const brandName = activeCylinder?.brand || 'P13';
    onAddGasToList(selectedTargetListId, suggestedPrice, brandName);

    const targetList = lists.find(l => l.id === selectedTargetListId);
    setAddedToListNotification(`Botijão de Gás adicionado à lista "${targetList?.name || 'Compras'}"!`);
    setIsAddToListModalOpen(false);

    setTimeout(() => {
      setAddedToListNotification(null);
    }, 4500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-20 px-4 max-w-2xl mx-auto pb-32 space-y-5"
    >
      {/* Toast Notification when added to list */}
      <AnimatePresence>
        {addedToListNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-18 left-4 right-4 max-w-md mx-auto z-50 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Check size={18} strokeWidth={3} />
              </div>
              <p className="text-xs font-semibold leading-tight">{addedToListNotification}</p>
            </div>
            <button
              onClick={() => {
                if (selectedTargetListId) {
                  onNavigateToList(selectedTargetListId);
                }
              }}
              className="text-[11px] font-bold text-emerald-400 underline whitespace-nowrap pl-2"
            >
              Ver Lista
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner & Quick Add Gas Button */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Flame size={20} strokeWidth={2.5} />
            </span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Controle do Gás</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Gerencie o consumo, custo diário e trocas de botijão
          </p>
        </div>

        <button
          onClick={() => handleOpenRegister()}
          className={`py-2.5 px-4 ${themeColor.bg} text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-105 active:scale-95 transition-all shrink-0`}
        >
          <Plus size={16} strokeWidth={3} />
          <span>Registrar gás</span>
        </button>
      </div>

      {/* 1. SEÇÃO: BOTIJÃO EM USO (Active Cylinder) */}
      {activeCylinder ? (
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 overflow-hidden relative">
          {/* Top highlight bar */}
          <div className="flex items-start justify-between gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">
                  <Flame size={12} className="animate-pulse" />
                  Gás Atual em Uso
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {activeCylinder.brand || 'Botijão P13'}
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                {safeFormatMoney(activeCylinder.price, currency)}
              </h3>
            </div>

            {/* Consumption Badge Indicator */}
            <span className={`text-[11px] font-black px-3 py-1.5 rounded-full border ${indicator.badgeBg} ${indicator.borderColor}`}>
              {indicator.badgeText}
            </span>
          </div>

          {/* Details Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/80">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Calendar size={13} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Começou em</span>
              </div>
              <p className="text-xs font-bold text-slate-800">
                {formatDateBR(activeCylinder.startDate)}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/80">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Clock size={13} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Em uso há</span>
              </div>
              <p className="text-xs font-black text-slate-900">
                {activeDurationDays} {activeDurationDays === 1 ? 'dia' : 'dias'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/80">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <BarChart3 size={13} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Média anterior</span>
              </div>
              <p className="text-xs font-bold text-slate-800">
                {metrics.averageDuration > 0 ? `${metrics.averageDuration} dias` : '40 dias (est.)'}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100/80">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <TrendingUp size={13} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Custo/dia atual</span>
              </div>
              <p className="text-xs font-bold text-slate-800">
                {safeFormatMoney(activeCostPerDay, currency)}
              </p>
            </div>
          </div>

          {/* Visual Consumption Progress Bar */}
          <div className="mb-4 bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <span>Indicador de Consumo:</span>
                <span className={indicator.textColor}>{indicator.title}</span>
              </div>
              <span className="text-[11px] font-black text-slate-500">
                {indicator.percentage}% da média
              </span>
            </div>

            {/* Progress Track */}
            <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden relative">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  indicator.status === 'red' 
                    ? 'bg-rose-500' 
                    : indicator.status === 'yellow' 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, indicator.percentage)}%` }}
              />
            </div>

            {/* Prediction Note */}
            {prediction && (
              <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Calendar size={13} className="text-orange-500" />
                  <span className="font-semibold">
                    📅 Previsão de troca: <strong>aproximadamente {prediction.formattedDate}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-slate-600 italic">
                  {prediction.daysRemaining > 0 
                    ? `(faltam aprox. ${prediction.daysRemaining} dias)` 
                    : '(já atingiu a média estimada)'}
                </span>
              </div>
            )}
          </div>

          {/* Active Cylinder Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                setFinishEndDate(getTodayDateString());
                setIsFinishModalOpen(true);
              }}
              className="flex-1 h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 active:scale-98 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Flame size={16} />
              <span>Gás acabou / Registrar troca</span>
            </button>

            <button
              onClick={() => setIsAddToListModalOpen(true)}
              className="h-12 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <ShoppingCart size={16} />
              <span>Adicionar à lista de compras</span>
            </button>

            <button
              onClick={() => handleOpenRegister(activeCylinder)}
              className="h-12 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 font-semibold text-xs flex items-center justify-center transition-all"
              title="Editar dados do botijão em uso"
            >
              <Edit3 size={15} />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Active State: prompt user to set an active cylinder */
        <div className="bg-orange-50/70 border border-orange-200/80 rounded-3xl p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
            <Flame size={24} />
          </div>
          <h3 className="text-base font-black text-slate-900 mb-1">Nenhum botijão em uso no momento</h3>
          <p className="text-xs text-slate-600 max-w-sm mx-auto mb-4 leading-relaxed">
            Cadastre o botijão que você está utilizando agora para acompanhar os dias de uso, custo diário e previsão da próxima compra.
          </p>
          <button
            onClick={() => handleOpenRegister()}
            className="py-3 px-5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <Plus size={16} strokeWidth={3} />
            <span>Colocar botijão em uso</span>
          </button>
        </div>
      )}

      {/* 2. SEÇÃO: INTEGRAÇÃO COM LISTA DE COMPRAS (Banner when near exchange) */}
      {(indicator.status === 'yellow' || indicator.status === 'red') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            indicator.status === 'red' ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-white shadow-xs shrink-0 text-orange-600">
              <Flame size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-black leading-tight truncate">
                🔥 Gás — compra provavelmente próxima
              </p>
              <p className="text-[11px] opacity-80 mt-0.5 leading-tight">
                {indicator.status === 'red'
                  ? 'Já passou da média estimada de duração!'
                  : 'Faltam poucos dias para a média de troca.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddToListModalOpen(true)}
            className="py-2 px-3 rounded-xl bg-white font-black text-[11px] shadow-xs hover:bg-slate-50 active:scale-95 text-slate-800 shrink-0 flex items-center gap-1"
          >
            <Plus size={13} strokeWidth={3} />
            <span>Adicionar à lista</span>
          </button>
        </motion.div>
      )}

      {/* 3. SEÇÃO: RESUMO AUTOMÁTICO (Metrics Dashboard) */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-slate-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Resumo Automático de Consumo
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Média de duração */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center gap-1.5 text-orange-600 mb-1">
              <Flame size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Média Duração</span>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900">
              {metrics.averageDuration > 0 ? `${metrics.averageDuration} dias` : '--'}
            </p>
            <span className="text-[10px] text-slate-600">
              {metrics.finishedCount > 0 ? `baseado em ${metrics.finishedCount} botijões` : 'sem histórico finalizado'}
            </span>
          </div>

          {/* Média de preço */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
              <DollarSign size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Média Preço</span>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900">
              {metrics.averagePrice > 0 ? safeFormatMoney(metrics.averagePrice, currency) : '--'}
            </p>
            <span className="text-[10px] text-slate-600">por botijão P13</span>
          </div>

          {/* Média custo/dia */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center gap-1.5 text-blue-600 mb-1">
              <TrendingUp size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Custo por Dia</span>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900">
              {metrics.averageCostPerDay > 0 ? safeFormatMoney(metrics.averageCostPerDay, currency) : '--'}
            </p>
            <span className="text-[10px] text-slate-600">média diária de gás</span>
          </div>

          {/* Gasto Total */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
            <div className="flex items-center gap-1.5 text-purple-600 mb-1">
              <Tag size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gasto Total</span>
            </div>
            <p className="text-base sm:text-lg font-black text-slate-900">
              {safeFormatMoney(metrics.totalSpent, currency)}
            </p>
            <span className="text-[10px] text-slate-600">{cylinders.length} botijões registrados</span>
          </div>
        </div>
      </div>

      {/* 4. SEÇÃO: HISTÓRICO DE CONSUMO */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-slate-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Histórico de Consumo ({finishedCylinders.length})
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-600">Mais recentes primeiro</span>
        </div>

        {finishedCylinders.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-slate-100 text-slate-600 text-xs">
            Nenhum botijão finalizado ainda. Quando seu botijão atual acabar, clique em &ldquo;Gás acabou&rdquo; para salvar o histórico aqui.
          </div>
        ) : (
          <div className="space-y-2.5">
            {finishedCylinders.map((cyl) => {
              const durDays = getCylinderDuration(cyl);
              const costDay = getCylinderCostPerDay(cyl);

              return (
                <div 
                  key={cyl.id}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs hover:border-slate-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          {cyl.brand || 'Botijão P13'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Finalizado
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {formatDateBR(cyl.startDate)} até {formatDateBR(cyl.endDate)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">
                        {safeFormatMoney(cyl.price, currency)}
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-600">
                        {safeFormatMoney(costDay, currency)} / dia
                      </p>
                    </div>
                  </div>

                  {/* Duration Banner */}
                  <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 text-xs">
                    <span className="text-slate-600 font-medium">Tempo de duração:</span>
                    <span className="font-black text-slate-900">
                      ⏱️ {durDays} {durDays === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>

                  {/* Notes if available */}
                  {cyl.notes && (
                    <p className="text-xs text-slate-600 mt-2 italic bg-amber-50/50 p-2 rounded-xl border border-amber-100/60">
                      &ldquo;{cyl.notes}&rdquo;
                    </p>
                  )}

                  {/* Card actions */}
                  <div className="flex items-center justify-end gap-2 mt-3 pt-2 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => handleOpenRegister(cyl)}
                      className="text-slate-400 hover:text-slate-700 p-1 flex items-center gap-1 font-semibold"
                    >
                      <Edit3 size={13} />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => setDeletingId(cyl.id)}
                      className="text-rose-400 hover:text-rose-600 p-1 flex items-center gap-1 font-semibold ml-2"
                    >
                      <Trash2 size={13} />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL 1: REGISTRAR / EDITAR BOTIJÃO --- */}
      <AnimatePresence>
        {isRegisterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
                    <Flame size={18} />
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    {editingCylinder ? 'Editar Registro de Gás' : 'Registrar Novo Botijão'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveCylinder} className="space-y-4">
                {/* Brand Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Marca / Distribuidora
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {GAS_BRANDS.map(brand => (
                      <button
                        type="button"
                        key={brand}
                        onClick={() => setFormBrand(brand)}
                        className={`text-xs px-2.5 py-1 rounded-xl font-medium transition-all ${
                          formBrand === brand 
                            ? `${themeColor.bg} text-white font-bold shadow-xs` 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="Ou digite outra marca..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Valor Pago */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor Pago ({currency.symbol})
                  </label>
                  <input
                    type="text"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="120,00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 font-black focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Data da Compra */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Data da Compra
                    </label>
                    <input
                      type="date"
                      required
                      value={formPurchaseDate}
                      onChange={(e) => setFormPurchaseDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  {/* Data em que começou a usar */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Começou a Usar
                    </label>
                    <input
                      type="date"
                      required
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                {/* Data em que o gás acabou (opcional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Data de Término (Opcional)
                    </label>
                    <span className="text-[10px] text-slate-600">Deixe vazio se ainda em uso</span>
                  </div>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Observação opcional */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Observação Opcional
                  </label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Ex: Forno muito usado no feriado, etc."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Checkbox: definir como botijão em uso (se não tiver data de término) */}
                {!formEndDate && (
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-orange-50/70 border border-orange-100 rounded-2xl">
                    <input
                      type="checkbox"
                      checked={formSetAsInUse}
                      onChange={(e) => setFormSetAsInUse(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Definir como botijão atualmente em uso
                    </span>
                  </label>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegisterModalOpen(false)}
                    className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition-all"
                  >
                    Salvar Botijão
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: GÁS ACABOU / REGISTRAR TROCA --- */}
      <AnimatePresence>
        {isFinishModalOpen && activeCylinder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
                <Flame size={24} />
              </div>

              <h3 className="text-base font-black text-center text-slate-900 mb-1">
                Finalizar Botijão Atual
              </h3>
              <p className="text-xs text-center text-slate-500 mb-4">
                Informe o dia em que o gás acabou para calcular a duração e custo final.
              </p>

              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data em que o gás acabou:
                  </label>
                  <input
                    type="date"
                    required
                    value={finishEndDate}
                    onChange={(e) => setFinishEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Real-time duration & cost preview */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span>Início do botijão:</span>
                    <span className="font-bold">{formatDateBR(activeCylinder.startDate)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Duração calculada:</span>
                    <span className="font-black text-slate-900">
                      {finishEndDate ? `${getCylinderDuration({ ...activeCylinder, status: 'finished', endDate: finishEndDate })} dias` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Custo médio por dia:</span>
                    <span className="font-black text-emerald-600">
                      {finishEndDate ? safeFormatMoney(getCylinderCostPerDay({ ...activeCylinder, status: 'finished', endDate: finishEndDate }), currency) : '--'}
                    </span>
                  </div>
                </div>

                {/* Option to start next cylinder immediately */}
                <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-100/70 rounded-2xl">
                  <input
                    type="checkbox"
                    checked={startNewImmediately}
                    onChange={(e) => setStartNewImmediately(e.target.checked)}
                    className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Já colocar novo botijão em uso imediatamente
                  </span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsFinishModalOpen(false)}
                  className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmFinishActive}
                  className="flex-1 h-12 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-sm transition-all"
                >
                  Confirmar Troca
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 3: ADICIONAR À LISTA DE COMPRAS --- */}
      <AnimatePresence>
        {isAddToListModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart size={24} />
              </div>

              <h3 className="text-base font-black text-center text-slate-900 mb-1">
                Adicionar à Lista de Compras
              </h3>
              <p className="text-xs text-center text-slate-500 mb-4">
                Adicione o item &ldquo;Botijão de Gás (P13)&rdquo; para não esquecer na próxima ida ao mercado.
              </p>

              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selecione a lista de compras:
                  </label>
                  {lists.length === 0 ? (
                    <p className="text-xs text-amber-600">Nenhuma lista encontrada. Crie uma lista primeiro.</p>
                  ) : (
                    <select
                      value={selectedTargetListId}
                      onChange={(e) => setSelectedTargetListId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {lists.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.items.length} itens) {l.status === 'Concluído' ? '• Concluída' : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600 mb-1">
                    <span>Item a ser adicionado:</span>
                    <span className="font-bold text-slate-900">Botijão de Gás (P13)</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Valor estimado:</span>
                    <span className="font-bold text-emerald-600">
                      {safeFormatMoney(activeCylinder?.price || (metrics.averagePrice > 0 ? metrics.averagePrice : 120), currency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsAddToListModalOpen(false)}
                  className="flex-1 h-12 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  disabled={!selectedTargetListId}
                  onClick={handleConfirmAddToList}
                  className={`flex-1 h-12 rounded-2xl ${themeColor.bg} text-white font-bold text-xs shadow-sm hover:brightness-105 transition-all disabled:opacity-50`}
                >
                  Adicionar Agora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- CONFIRM DELETE MODAL --- */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} />
              </div>
              <h3 className="text-base font-black text-slate-900 mb-1">Excluir Registro?</h3>
              <p className="text-xs text-slate-500 mb-4">
                Esse registro de botijão será removido do seu histórico de consumo.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 h-11 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteCylinder(deletingId)}
                  className="flex-1 h-11 rounded-2xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-all"
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
