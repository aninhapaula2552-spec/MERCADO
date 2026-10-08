'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scale, 
  Palette, 
  Check, 
  RotateCcw, 
  MessageSquarePlus, 
  ShoppingBasket, 
  ChevronRight,
  Download,
  FileArchive,
  Bell,
  BellOff,
  CheckCircle2
} from 'lucide-react';
import { Currency, ThemeColor, PantryNotificationSettings } from '../lib/types';
import { CURRENCIES, THEME_COLORS } from '../lib/constants';
import { requestNotificationPermission, sendSystemNotification, getScheduledText } from '../lib/notifications';

interface SettingsViewProps {
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  themeColor: ThemeColor;
  onThemeChange: (t: ThemeColor) => void;
  suggestions: string;
  onSuggestionsChange: (s: string) => void;
  pantryNotifications: PantryNotificationSettings;
  onPantryNotificationsChange: (settings: PantryNotificationSettings) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currency,
  onCurrencyChange,
  themeColor,
  onThemeChange,
  suggestions,
  onSuggestionsChange,
  pantryNotifications,
  onPantryNotificationsChange,
  onResetData
}) => {
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-20 px-4 max-w-2xl mx-auto pb-32"
    >
      <header className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 mb-1">Ajustes & Preferências</h2>
        <p className="text-xs text-slate-400">Configure moedas, cores e dados do seu app</p>
      </header>

      <div className="space-y-3.5">
        {/* Storage Card */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${themeColor.light} ${themeColor.text} flex items-center justify-center shrink-0`}>
            <ShoppingBasket size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 leading-tight">Salvamento Automático ao Fechar</h3>
            <p className="text-xs text-slate-400 mt-0.5">Suas alterações são salvas instantaneamente e mantidas ao fechar o app</p>
            <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <Check size={11} /> Salvo Automaticamente
            </span>
          </div>
        </div>

        {/* Currency Selector Card */}
        <div 
          onClick={() => setIsCurrencyOpen(true)}
          className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex items-center justify-between cursor-pointer hover:shadow-xs transition-all active:scale-99"
        >
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl ${themeColor.light} ${themeColor.text} flex items-center justify-center shrink-0`}>
              <Scale size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Moeda Principal</p>
              <p className="text-xs text-slate-400">{currency.name} ({currency.code})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-base font-black ${themeColor.text}`}>{currency.symbol}</span>
            <ChevronRight size={18} className="text-slate-300" />
          </div>
        </div>

        {/* Theme Selector Card */}
        <div 
          onClick={() => setIsThemeOpen(true)}
          className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 flex items-center justify-between cursor-pointer hover:shadow-xs transition-all active:scale-99"
        >
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl ${themeColor.light} ${themeColor.text} flex items-center justify-center shrink-0`}>
              <Palette size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Cor do Aplicativo</p>
              <p className="text-xs text-slate-400">Tema {themeColor.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full ${themeColor.bg} border-2 border-white shadow-xs`} />
            <ChevronRight size={18} className="text-slate-300" />
          </div>
        </div>

        {/* Pantry Notifications Settings */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${pantryNotifications.enabled ? `${themeColor.light} ${themeColor.text}` : 'bg-slate-100 text-slate-400'} flex items-center justify-center`}>
                {pantryNotifications.enabled ? <Bell size={18} /> : <BellOff size={18} />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Notificações da Despensa</p>
                <p className="text-xs text-slate-400">Alertas inteligentes de consumo e reposição</p>
              </div>
            </div>
            <button
              onClick={async () => {
                const nextState = !pantryNotifications.enabled;
                if (nextState) {
                  await requestNotificationPermission();
                }
                onPantryNotificationsChange({
                  ...pantryNotifications,
                  enabled: nextState
                });
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${
                pantryNotifications.enabled ? `${themeColor.bg} text-white` : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {pantryNotifications.enabled ? '🔔 Ativado' : 'Ativar notificação'}
            </button>
          </div>

          {pantryNotifications.enabled && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-3 border-t border-slate-100">
              {/* Visual Status Badge */}
              <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-900">✅ Notificação agendada</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                    📅 {getScheduledText(pantryNotifications)}
                  </p>
                </div>
              </div>

              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-2">Tipos de Notificação</p>
              
              <div className="space-y-2">
                {[
                  { key: 'nearEnding', label: 'Produto próximo de acabar' },
                  { key: 'probablyFinished', label: 'Produto provavelmente acabou' },
                  { key: 'reorderTime', label: 'Hora provável de comprar novamente' },
                  { key: 'reminderDecrement', label: 'Lembrete para dar baixa' },
                  { key: 'suggestAddToList', label: 'Sugestão para adicionar à lista de compras' },
                  { key: 'weeklySummary', label: 'Resumo semanal do consumo' },
                  { key: 'cardReminder', label: 'Lembrete de virada do cartão' },
                  { key: 'preShoppingReminder', label: 'Lembrete antecipado antes da compra' },
                  { key: 'preShoppingSummary', label: 'Resumo inteligente antes da compra' },
                ].map(item => (
                  <label key={item.key} className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
                    <span>{item.label}</span>
                    <input
                      type="checkbox"
                      checked={!!pantryNotifications.types[item.key as keyof typeof pantryNotifications.types]}
                      onChange={(e) => onPantryNotificationsChange({
                        ...pantryNotifications,
                        types: {
                          ...pantryNotifications.types,
                          [item.key]: e.target.checked
                        }
                      })}
                      className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                    />
                  </label>
                ))}
              </div>

              {/* Shopping Routine Section */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <p className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  🛒 Minha rotina de compras
                </p>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Frequência das Compras</label>
                  <select
                    value={pantryNotifications.routine.frequency}
                    onChange={(e) => onPantryNotificationsChange({
                      ...pantryNotifications,
                      routine: {
                        ...pantryNotifications.routine,
                        frequency: e.target.value as 'weekly' | 'biweekly' | 'monthly' | 'specific_date' | 'daily' | 'weekdays' | 'card_cycle' | 'salary' | 'when_needed' | 'custom'
                      }
                    })}
                    className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                  >
                    <option value="daily">Todos os dias</option>
                    <option value="weekly">Toda semana</option>
                    <option value="biweekly">A cada 15 dias</option>
                    <option value="monthly">Uma vez por mês</option>
                    <option value="specific_date">Data específica</option>
                    <option value="weekdays">Dias da semana (segunda a sexta)</option>
                    <option value="card_cycle">Quando o cartão vira</option>
                    <option value="salary">Quando recebe o salário</option>
                    <option value="when_needed">Quando percebe que os produtos estão acabando</option>
                    <option value="custom">Personalizado</option>
                  </select>
                </div>

                {pantryNotifications.routine.frequency === 'specific_date' && (
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">📅 Data específica</label>
                    <input
                      type="date"
                      value={pantryNotifications.routine.specificDate || ''}
                      onChange={(e) => onPantryNotificationsChange({
                        ...pantryNotifications,
                        routine: {
                          ...pantryNotifications.routine,
                          specificDate: e.target.value
                        }
                      })}
                      className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Qual dia normalmente faço minha compra?</label>
                  <input
                    type="text"
                    value={pantryNotifications.routine.dayDescription}
                    onChange={(e) => onPantryNotificationsChange({
                      ...pantryNotifications,
                      routine: {
                        ...pantryNotifications.routine,
                        dayDescription: e.target.value
                      }
                    })}
                    placeholder="Ex: Todo sábado, Dia 10 de cada mês..."
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium"
                  />
                </div>

                <div className="pt-2 space-y-2">
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer">
                    <span>💳 Lembrete de virada do cartão</span>
                    <input
                      type="checkbox"
                      checked={pantryNotifications.routine.cardReminderEnabled}
                      onChange={(e) => onPantryNotificationsChange({
                        ...pantryNotifications,
                        routine: {
                          ...pantryNotifications.routine,
                          cardReminderEnabled: e.target.checked
                        }
                      })}
                      className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                    />
                  </label>

                  {pantryNotifications.routine.cardReminderEnabled && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Dia do mês que o cartão vira</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={pantryNotifications.routine.cardTurnoverDate || 10}
                        onChange={(e) => onPantryNotificationsChange({
                          ...pantryNotifications,
                          routine: {
                            ...pantryNotifications.routine,
                            cardTurnoverDate: parseInt(e.target.value, 10) || 10
                          }
                        })}
                        className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Dias de antecedência para lembrar da compra</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={pantryNotifications.routine.daysInAdvanceReminder}
                    onChange={(e) => onPantryNotificationsChange({
                      ...pantryNotifications,
                      routine: {
                        ...pantryNotifications.routine,
                        daysInAdvanceReminder: parseInt(e.target.value, 10) || 2
                      }
                    })}
                    className="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Horário das Notificações</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { id: 'morning', label: 'Manhã' },
                    { id: 'afternoon', label: 'Tarde' },
                    { id: 'evening', label: 'Noite' },
                    { id: 'custom', label: 'Personalizado' },
                  ].map(slot => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => onPantryNotificationsChange({
                        ...pantryNotifications,
                        timeSlot: slot.id as 'morning' | 'afternoon' | 'evening' | 'custom'
                      })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                        pantryNotifications.timeSlot === slot.id
                          ? `${themeColor.bg} text-white shadow-xs`
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>

                {pantryNotifications.timeSlot === 'custom' && (
                  <div className="mt-2.5">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Horário específico</label>
                    <input
                      type="time"
                      value={pantryNotifications.customTime || '08:00'}
                      onChange={(e) => onPantryNotificationsChange({
                        ...pantryNotifications,
                        customTime: e.target.value
                      })}
                      className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    />
                  </div>
                )}

                <div className="pt-3">
                  <button
                    onClick={async () => {
                      const granted = await requestNotificationPermission();
                      if (granted) {
                        sendSystemNotification(
                          'Mercado Fresh 🛒',
                          'Notificação de teste enviada com sucesso! As notificações nativas do sistema estão funcionando perfeitamente.'
                        );
                      } else {
                        alert('Permissão de notificação negada ou não concedida pelo sistema. Verifique as configurações de notificação do seu celular/navegador.');
                      }
                    }}
                    className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs"
                  >
                    <Bell size={16} />
                    <span>Enviar notificação de teste</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Suggestions Box */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
          <div className="flex items-center gap-3 mb-2.5">
            <div className={`w-9 h-9 rounded-xl ${themeColor.light} ${themeColor.text} flex items-center justify-center`}>
              <MessageSquarePlus size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Anotações & Sugestões</p>
              <p className="text-xs text-slate-400">Ideias ou lembretes pessoais para compras</p>
            </div>
          </div>
          <textarea
            value={suggestions}
            onChange={(e) => onSuggestionsChange(e.target.value)}
            placeholder="Escreva anotações ou melhorias desejadas..."
            className={`w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${themeColor.ring} resize-none`}
          />
        </div>

        {/* Backup & Project ZIP Download */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
          <div className="flex items-center gap-3 mb-2.5">
            <div className={`w-9 h-9 rounded-xl ${themeColor.light} ${themeColor.text} flex items-center justify-center`}>
              <FileArchive size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Código-Fonte do Projeto</p>
              <p className="text-xs text-slate-400">Pacote ZIP completo e corrigido para download</p>
            </div>
          </div>
          <a
            href="/api/download-zip"
            download="mercado-fresh-codigo-fonte.zip"
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <Download size={16} />
              <span>Baixar ZIP do Projeto Completo</span>
            </div>
            <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded-full text-emerald-900 font-extrabold">.ZIP</span>
          </a>
        </div>

        {/* Reset Default Data */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Manutenção de Dados</h3>
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-colors active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <RotateCcw size={16} />
              <span>Restaurar Dados Padrão de Exemplo</span>
            </div>
            <ChevronRight size={16} className="text-amber-400" />
          </button>
        </div>
      </div>

      {/* Currency Modal */}
      <AnimatePresence>
        {isCurrencyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100"
            >
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">Escolher Moeda</h3>
              <div className="space-y-2">
                {CURRENCIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      onCurrencyChange(c);
                      setIsCurrencyOpen(false);
                    }}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between border text-left transition-all ${
                      currency.code === c.code 
                        ? `${themeColor.light} ${themeColor.border} border-2` 
                        : 'border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-900">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.code}</p>
                    </div>
                    <span className={`text-base font-black ${themeColor.text}`}>{c.symbol}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsCurrencyOpen(false)}
                className="w-full mt-4 h-11 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Theme Modal */}
      <AnimatePresence>
        {isThemeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100"
            >
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">Cor do Aplicativo</h3>
              <div className="space-y-2">
                {THEME_COLORS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onThemeChange(t);
                      setIsThemeOpen(false);
                    }}
                    className={`w-full p-3.5 rounded-2xl flex items-center justify-between border text-left transition-all ${
                      themeColor.id === t.id 
                        ? `${t.light} ${t.border} border-2` 
                        : 'border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full ${t.bg} border-2 border-white shadow-xs`} />
                      <span className="text-sm font-bold text-slate-900">{t.name}</span>
                    </div>
                    {themeColor.id === t.id && <Check className={t.text} size={18} strokeWidth={3} />}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsThemeOpen(false)}
                className="w-full mt-4 h-11 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
              >
                Fechar
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {isResetConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100"
            >
              <h3 className="text-lg font-extrabold text-slate-900 mb-2">Restaurar Dados?</h3>
              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                Todas as listas e itens atuais serão substituídos pelos dados de exemplo padrão.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="flex-1 h-11 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onResetData();
                    setIsResetConfirmOpen(false);
                  }}
                  className="flex-1 h-11 rounded-2xl bg-rose-600 text-white font-bold text-xs shadow-xs hover:bg-rose-700 transition-colors"
                >
                  Restaurar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
