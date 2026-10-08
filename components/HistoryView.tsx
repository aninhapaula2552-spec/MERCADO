'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Eye, 
  Copy, 
  Trash2, 
  Receipt, 
  Calendar,
  Download
} from 'lucide-react';
import { GroceryList, Currency, ThemeColor } from '../lib/types';
import { 
  safeNumber, 
  safeFormatMoney, 
  parseItemAmount, 
  calculateItemPrice, 
  calculateItemSubtotal 
} from '../lib/utils';

interface HistoryViewProps {
  lists: GroceryList[];
  onDuplicateList: (list: GroceryList, newName: string) => void;
  onDeleteList: (id: string) => void;
  currency: Currency;
  themeColor: ThemeColor;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  lists,
  onDuplicateList,
  onDeleteList,
  currency,
  themeColor
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<GroceryList | null>(null);

  const completedLists = lists.filter(l => l && l.status === 'Concluído');

  const filteredHistory = completedLists.filter(p => 
    p && (p.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const calculateReceiptTotals = (list: GroceryList) => {
    let subtotal = 0;
    let totalDiscount = 0;

    (list.items || []).filter(Boolean).forEach(item => {
      const amount = parseItemAmount(item);
      const regularPrice = safeNumber(item.price, 0) * amount;
      const actualSubtotal = calculateItemSubtotal(item);
      
      subtotal += regularPrice;
      if (regularPrice > actualSubtotal) {
        totalDiscount += (regularPrice - actualSubtotal);
      }
    });

    const finalTotal = list.totalAmount !== undefined ? list.totalAmount : Math.max(0, subtotal - totalDiscount);
    return { subtotal, totalDiscount, total: finalTotal };
  };

  const handlePrintReceiptPDF = (receipt: GroceryList) => {
    try {
      const items = (receipt.items || []).filter(Boolean);
      const totals = calculateReceiptTotals(receipt);
      const dateStr = receipt.completedAt || new Date().toLocaleDateString('pt-BR');
      const safeCurrency = currency?.symbol || 'R$';

      let rowsHtml = '';
      items.forEach(item => {
        const subtotal = calculateItemSubtotal(item);
        const unitPrice = calculateItemPrice(item);
        const qtyStr = item.weight ? item.weight + 'kg' : item.quantity + 'un';
        rowsHtml += '<tr>' +
          '<td><strong>' + item.name + '</strong></td>' +
          '<td class="text-center">' + qtyStr + '</td>' +
          '<td class="text-right">' + safeCurrency + ' ' + safeFormatMoney(unitPrice) + '</td>' +
          '<td class="text-right font-bold">' + safeCurrency + ' ' + safeFormatMoney(subtotal) + '</td>' +
          '</tr>';
      });

      const htmlContent = '<!DOCTYPE html>' +
        '<html lang="pt-BR">' +
        '<head>' +
        '<meta charset="UTF-8">' +
        '<title>Mercado Fresh - Comprovante ' + receipt.name + '</title>' +
        '<style>' +
        '@import url(\'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap\');' +
        '* { box-sizing: border-box; }' +
        'body { font-family: \'Plus Jakarta Sans\', sans-serif; padding: 40px; color: #0f172a; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
        '.brand-badge { display: inline-block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #059669; background: #ecfdf5; padding: 4px 10px; border-radius: 6px; margin-bottom: 8px; }' +
        '.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px; }' +
        'h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px 0; color: #0f172a; }' +
        '.meta { font-size: 11px; color: #64748b; text-align: right; line-height: 1.5; }' +
        'table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }' +
        'th { background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; text-align: left; padding: 10px 12px; color: #334155; font-weight: 700; text-transform: uppercase; font-size: 11px; }' +
        'td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; vertical-align: middle; }' +
        'tr:nth-child(even) td { background: #fafafa; }' +
        '.text-center { text-align: center; }' +
        '.text-right { text-align: right; }' +
        '.font-bold { font-weight: 700; }' +
        '.footer-card { background: #0f172a; color: #ffffff; border-radius: 16px; padding: 20px; display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }' +
        '.footer-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 700; }' +
        '.footer-value { font-size: 22px; font-weight: 800; color: #ffffff; }' +
        '@media print { body { padding: 20px; } }' +
        '</style>' +
        '</head>' +
        '<body>' +
        '<div class="header">' +
        '<div>' +
        '<span class="brand-badge">Mercado Fresh • Cupom Fiscal</span>' +
        '<h1>' + receipt.name + '</h1>' +
        '<p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Concluído em: ' + dateStr + '</p>' +
        '</div>' +
        '<div class="meta"><strong>Mercado Fresh App</strong><br>Gestão Inteligente de Despensa & Compras</div>' +
        '</div>' +
        '<table>' +
        '<thead><tr><th>Item / Descrição</th><th class="text-center">Quantidade</th><th class="text-right">Preço Unit.</th><th class="text-right">Subtotal</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +
        '<div class="footer-card">' +
        '<div><div class="footer-label">Total Pago na Compra</div><div style="font-size: 11px; color: #cbd5e1; margin-top: 2px;">' + items.length + ' itens incluídos</div></div>' +
        '<div class="footer-value">' + safeCurrency + ' ' + safeFormatMoney(totals.total) + '</div>' +
        '</div>' +
        '<script>window.onload = function() { window.print(); }</script>' +
        '</body>' +
        '</html>';

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      }
    } catch (e) {
      console.error('Error generating PDF receipt:', e);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="pt-20 px-4 max-w-2xl mx-auto pb-32"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Histórico de Compras</h2>
          <p className="text-xs text-slate-400">Suas compras anteriores salvas no dispositivo</p>
        </div>
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${themeColor.light} ${themeColor.text}`}>
          {completedLists.length} {completedLists.length === 1 ? 'compra' : 'compras'}
        </span>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar no histórico..." 
          className={`w-full bg-white border border-slate-200/80 rounded-2xl py-3 pl-11 pr-4 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${themeColor.ring} shadow-xs text-slate-800`}
        />
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((trip) => {
            const itemCount = (trip.items || []).length;
            const tripTotal = trip.totalAmount !== undefined 
              ? trip.totalAmount 
              : (trip.items || []).reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);

            return (
              <div key={trip.id} className="bg-white rounded-3xl p-5 shadow-xs border border-slate-200/70 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold mb-1">
                      <Calendar size={13} />
                      <span>{trip.completedAt || 'Data não registrada'}</span>
                    </div>
                    <h3 className="text-base font-black text-slate-900">{trip.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {itemCount} {itemCount === 1 ? 'item comprado' : 'itens comprados'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Pago</span>
                    <span className={`text-lg font-black ${themeColor.text}`}>
                      {currency.symbol} {safeFormatMoney(tripTotal)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handlePrintReceiptPDF(trip)}
                    className={`flex-1 h-10 ${themeColor.bg} text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs hover:brightness-105 active:scale-98 transition-all`}
                  >
                    <Download size={15} /> Salvar PDF
                  </button>
                  <button
                    onClick={() => onDuplicateList(trip, `${trip.name} (Repetir)`)}
                    className="flex-1 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-98"
                  >
                    <Copy size={15} /> Repetir Lista
                  </button>
                  <button
                    onClick={() => setSelectedReceipt(trip)}
                    className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-colors active:scale-98"
                    title="Ver Nota"
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => onDeleteList(trip.id)}
                    className="w-10 h-10 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl flex items-center justify-center transition-colors active:scale-98"
                    title="Excluir do histórico"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-slate-400">
            <div className="bg-slate-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
              <Receipt size={28} />
            </div>
            <p className="text-sm font-bold text-slate-700">Nenhuma compra finalizada</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Ao concluir uma lista de compras pelo botão &quot;Finalizar Compra&quot;, o comprovante detalhado aparecerá aqui.
            </p>
          </div>
        )}
      </div>

      {/* Detailed Receipt Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto"
            >
              <div className="text-center border-b border-dashed border-slate-200 pb-3 mb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Cupom de Compra</span>
                <h4 className="font-black text-lg text-slate-900 mt-0.5">{selectedReceipt.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">{selectedReceipt.completedAt || 'Data não registrada'}</p>
              </div>

              {/* Items List */}
              <div className="space-y-2.5 mb-4 text-xs">
                {(selectedReceipt.items || []).filter(Boolean).map((item, idx) => {
                  const amount = parseItemAmount(item);
                  const subtotal = calculateItemSubtotal(item);
                  const unitPrice = calculateItemPrice(item);
                  const isWholesale = item.minWholesaleQty && amount >= item.minWholesaleQty && item.wholesalePrice;

                  return (
                    <div key={idx} className="flex items-start justify-between border-b border-slate-100 pb-2">
                      <div className="flex-1 pr-2">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-[11px] text-slate-400">
                          {item.weight ? `${item.weight}kg` : `${item.quantity}un`} x {currency.symbol} {safeFormatMoney(unitPrice)}
                          {isWholesale && <span className="ml-1 text-emerald-600 font-bold">(Desc. Atacado)</span>}
                        </p>
                      </div>
                      <span className="font-black text-slate-900 shrink-0">
                        {currency.symbol} {safeFormatMoney(subtotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Receipt Totals Summary */}
              {(() => {
                const totals = calculateReceiptTotals(selectedReceipt);
                return (
                  <div className="pt-3 border-t-2 border-dashed border-slate-200 space-y-1.5 text-xs mb-5">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal bruto</span>
                      <span>{currency.symbol} {safeFormatMoney(totals.subtotal)}</span>
                    </div>
                    {totals.totalDiscount > 0 && (
                      <div className="flex justify-between font-bold text-emerald-600">
                        <span>Descontos obtidos</span>
                        <span>- {currency.symbol} {safeFormatMoney(totals.totalDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                      <span>Total Pago</span>
                      <span>{currency.symbol} {safeFormatMoney(totals.total)}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="flex-1 h-11 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    handlePrintReceiptPDF(selectedReceipt);
                    setSelectedReceipt(null);
                  }}
                  className={`flex-1 h-11 rounded-2xl ${themeColor.bg} text-white font-bold text-xs shadow-xs hover:brightness-105 transition-all flex items-center justify-center gap-1.5`}
                >
                  <Download size={14} /> Salvar PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
