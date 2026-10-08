'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Share2, 
  Printer, 
  Copy, 
  Check, 
  FileText, 
  FileSpreadsheet, 
  FileCode, 
  Upload, 
  AlertCircle, 
  X,
  MessageCircle,
  Download
} from 'lucide-react';
import { ListItem, GroceryList, Currency, ThemeColor } from '../lib/types';
import { 
  formatMoneyExact, 
  calculateItemSubtotal, 
  generateExportJSON, 
  generateExportCSV, 
  generateExportText, 
  parseImportData, 
  downloadFileDirectly,
  getItemQuantity,
  getItemUnit
} from '../lib/exportImport';
import { safeFormatMoney } from '../lib/utils';

// --- Printable Layout for window.print() (PDF) ---
export const PrintableList = ({ 
  list, 
  currency 
}: { 
  list: GroceryList | null; 
  currency: Currency;
}) => {
  if (!list) return null;
  const items = (list.items || []).filter(Boolean);
  const totalEstimado = items.reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);
  const totalCarrinho = items.filter(i => i.checked).reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);
  const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="hidden print:block print-area p-8 max-w-4xl mx-auto font-sans text-black bg-white">
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Mercado Fresh</h1>
          <h2 className="text-lg font-bold text-slate-700 mt-1">{list.name}</h2>
        </div>
        <div className="text-right text-xs text-slate-600 space-y-0.5">
          <p><strong>Data de Emissão:</strong> {dateStr}</p>
          <p><strong>Status:</strong> {list.status}</p>
        </div>
      </div>

      <table className="w-full border-collapse mb-8 text-xs">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left text-slate-700 font-bold uppercase tracking-wider">
            <th className="py-2 px-2 w-10 text-center">Status</th>
            <th className="py-2 px-2">Produto</th>
            <th className="py-2 px-2">Categoria</th>
            <th className="py-2 px-2 text-right">Qtd / Unid.</th>
            <th className="py-2 px-2 text-right">Preço Unit.</th>
            <th className="py-2 px-2 text-right">Subtotal</th>
            <th className="py-2 px-2">Observações</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const qty = getItemQuantity(item);
            const unit = getItemUnit(item);
            const subtotal = calculateItemSubtotal(item);
            return (
              <tr key={idx} className="border-b border-slate-200">
                <td className="py-2.5 px-2 text-center font-mono font-bold">
                  {item.checked ? '[X]' : '[ ]'}
                </td>
                <td className="py-2.5 px-2 font-bold text-slate-900">{item.name}</td>
                <td className="py-2.5 px-2 text-slate-500">{item.category || 'Geral'}</td>
                <td className="py-2.5 px-2 text-right">{qty} {unit}</td>
                <td className="py-2.5 px-2 text-right">{currency.symbol} {formatMoneyExact(item.price)}</td>
                <td className="py-2.5 px-2 text-right font-bold">{currency.symbol} {formatMoneyExact(subtotal)}</td>
                <td className="py-2.5 px-2 text-slate-500 italic">{item.notes || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="border-t-2 border-slate-900 pt-4 flex justify-between items-start text-sm">
        <div>
          <p className="text-xs text-slate-500">Total de itens: <strong>{items.length}</strong></p>
          <p className="text-xs text-slate-500">Limite de gastos: <strong>{currency.symbol} {safeFormatMoney(list.budgetLimit)}</strong></p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-xs text-slate-600">Total no Carrinho: <strong>{currency.symbol} {safeFormatMoney(totalCarrinho)}</strong></p>
          <p className="text-base font-black text-slate-900">Total Estimado: {currency.symbol} {safeFormatMoney(totalEstimado)}</p>
        </div>
      </div>
    </div>
  );
};

// --- Modal de Compartilhamento & Exportação ---
export const ShareExportModal = ({
  isOpen,
  onClose,
  list,
  currency
}: {
  isOpen: boolean;
  onClose: () => void;
  list: GroceryList | null;
  currency: Currency;
  themeColor?: ThemeColor;
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  if (!isOpen || !list) return null;

  const safeListName = (list.name || 'compras').toLowerCase().replace(/\s+/g, '_');
  const textContent = generateExportText(list, currency.symbol);
  const jsonContent = generateExportJSON(list, currency.symbol);
  const csvContent = generateExportCSV(list);
  const encodedWhatsapp = encodeURIComponent(textContent);

  const handleDownloadJSON = () => {
    downloadFileDirectly(`mercado_fresh_${safeListName}.json`, jsonContent, 'application/json');
    setDownloadSuccess('JSON');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const handleDownloadCSV = () => {
    downloadFileDirectly(`mercado_fresh_${safeListName}.csv`, csvContent, 'text/csv;charset=utf-8');
    setDownloadSuccess('CSV');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  const handleCopyText = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textContent);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    }
  };

  const handlePrintPDF = () => {
    try {
      const items = (list.items || []).filter(Boolean);
      const totalEstimado = items.reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);
      const totalCarrinho = items.filter(i => i.checked).reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);
      const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const safeCurrency = currency?.symbol || 'R$';

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Mercado Fresh - ${list.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
            * { box-sizing: border-box; }
            body { 
              font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              padding: 40px; 
              color: #0f172a; 
              background: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .brand-badge {
              display: inline-block;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              color: #059669;
              background: #ecfdf5;
              padding: 4px 10px;
              border-radius: 6px;
              margin-bottom: 8px;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              border-bottom: 2px solid #e2e8f0; 
              padding-bottom: 20px; 
              margin-bottom: 24px; 
            }
            h1 { font-size: 24px; font-weight: 800; margin: 0 0 4px 0; color: #0f172a; letter-spacing: -0.5px; }
            .meta { font-size: 11px; color: #64748b; text-align: right; line-height: 1.5; }
            
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 12px;
              margin-bottom: 28px;
            }
            .summary-card {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 12px 16px;
            }
            .summary-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 4px;
            }
            .summary-value {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
            }

            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px; }
            th { 
              background: #f1f5f9; 
              border-top: 1px solid #cbd5e1;
              border-bottom: 2px solid #cbd5e1; 
              text-align: left; 
              padding: 10px 12px; 
              color: #334155; 
              font-weight: 700; 
              text-transform: uppercase; 
              letter-spacing: 0.5px;
              font-size: 11px;
            }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; color: #1e293b; vertical-align: middle; }
            tr:nth-child(even) td { background: #fafafa; }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .checked-box { color: #059669; font-size: 14px; }
            .unchecked-box { color: #cbd5e1; font-size: 14px; }

            .footer-card {
              background: #0f172a;
              color: #ffffff;
              border-radius: 16px;
              padding: 20px 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 20px;
            }
            .footer-left p { margin: 0; font-size: 11px; color: #94a3b8; }
            .footer-left strong { color: #ffffff; }
            .footer-right { text-align: right; }
            .footer-right .total-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
            .footer-right .total-amount { font-size: 22px; font-weight: 900; color: #34d399; margin-top: 2px; }

            .watermark {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              border-top: 1px dashed #cbd5e1;
              padding-top: 12px;
            }

            @media print {
              body { padding: 20px; }
              .footer-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: #0f172a !important; color: #ffffff !important; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <span class="brand-badge">Mercado Fresh • Relatório de Compras</span>
              <h1>${list.name}</h1>
            </div>
            <div class="meta">
              <p><strong>Emissão:</strong> ${dateStr}</p>
              <p><strong>Status:</strong> ${list.status}</p>
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">Total de Itens</div>
              <div class="summary-value">${items.length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">No Carrinho</div>
              <div class="summary-value" style="color: #059669;">${items.filter(i => i.checked).length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Orçamento Limite</div>
              <div class="summary-value">${safeCurrency} ${safeFormatMoney(list.budgetLimit)}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">Valor no Carrinho</div>
              <div class="summary-value">${safeCurrency} ${safeFormatMoney(totalCarrinho)}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 45px;">Status</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th class="text-right">Quantidade</th>
                <th class="text-right">Preço Unit.</th>
                <th class="text-right">Subtotal</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(item => `
                <tr>
                  <td class="text-center">
                    ${item.checked ? '<span class="checked-box">☑</span>' : '<span class="unchecked-box">☐</span>'}
                  </td>
                  <td class="font-bold" style="color: ${item.checked ? '#047857' : '#0f172a'};">${item.name}</td>
                  <td><span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: #475569;">${item.category || 'Geral'}</span></td>
                  <td class="text-right font-bold">${getItemQuantity(item)} ${getItemUnit(item)}</td>
                  <td class="text-right">${safeCurrency} ${formatMoneyExact(item.price)}</td>
                  <td class="text-right font-bold">${safeCurrency} ${formatMoneyExact(calculateItemSubtotal(item))}</td>
                  <td style="color: #64748b; font-style: italic;">${item.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer-card">
            <div class="footer-left">
              <p>Lista gerada pelo aplicativo <strong>Mercado Fresh</strong></p>
              <p>Organização inteligente para suas compras e despensa</p>
            </div>
            <div class="footer-right">
              <div class="total-label">Total Estimado</div>
              <div class="total-amount">${safeCurrency} ${safeFormatMoney(totalEstimado)}</div>
            </div>
          </div>

          <div class="watermark">
            Mercado Fresh &bull; Documento gerado eletronicamente para fins de conferência e compras.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
      } else {
        window.print();
      }
      setDownloadSuccess('PDF');
      setTimeout(() => setDownloadSuccess(null), 2500);
    } catch {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Exportar & Compartilhar</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">{list.name}</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {downloadSuccess && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2">
            <Check size={16} /> Arquivo {downloadSuccess} baixado com sucesso!
          </div>
        )}

        <div className="mt-4 space-y-2.5">
          {/* Opção 1: WhatsApp Link direto */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodedWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full p-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center justify-between transition-colors shadow-xs"
          >
            <div className="flex items-center gap-3">
              <MessageCircle size={22} />
              <div className="text-left">
                <span className="text-sm font-extrabold block">Enviar no WhatsApp</span>
                <span className="text-[11px] text-emerald-100 font-medium">Abre conversa com a lista formatada</span>
              </div>
            </div>
            <Share2 size={16} />
          </a>

          {/* Opção 2: Copiar Texto */}
          <button
            onClick={handleCopyText}
            className={`w-full p-4 rounded-2xl border font-bold flex items-center justify-between transition-all ${
              copiedText ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Copy size={20} className={copiedText ? 'text-emerald-600' : 'text-slate-500'} />
              <div className="text-left">
                <span className="text-sm font-bold block">{copiedText ? 'Texto Copiado!' : 'Copiar Texto Completo'}</span>
                <span className="text-[11px] text-slate-400 font-medium">Para colar em mensagens ou bloco de notas</span>
              </div>
            </div>
            {copiedText ? <Check size={18} className="text-emerald-600" /> : <FileText size={16} className="text-slate-400" />}
          </button>

          {/* Opção 3: Baixar Excel / CSV */}
          <button
            onClick={handleDownloadCSV}
            className="w-full p-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={20} className="text-emerald-600" />
              <div className="text-left">
                <span className="text-sm font-bold block">Baixar Planilha Excel (.CSV)</span>
                <span className="text-[11px] text-slate-400 font-medium">Abre perfeitamente no Excel e Google Planilhas</span>
              </div>
            </div>
            <Download size={16} className="text-slate-400" />
          </button>

          {/* Opção 4: Baixar Backup JSON */}
          <button
            onClick={handleDownloadJSON}
            className="w-full p-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <FileCode size={20} className="text-indigo-600" />
              <div className="text-left">
                <span className="text-sm font-bold block">Baixar Backup da Lista (.JSON)</span>
                <span className="text-[11px] text-slate-400 font-medium">Permite restaurar ou importar em outro celular</span>
              </div>
            </div>
            <Download size={16} className="text-slate-400" />
          </button>

          {/* Opção 5: Salvar em PDF */}
          <button
            onClick={handlePrintPDF}
            className="w-full p-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold flex items-center justify-between transition-all"
          >
            <div className="flex items-center gap-3">
              <Printer size={20} className="text-slate-600" />
              <div className="text-left">
                <span className="text-sm font-bold block">Salvar em PDF</span>
                <span className="text-[11px] text-slate-400 font-medium">Baixar ou imprimir documento em PDF</span>
              </div>
            </div>
            <Download size={16} className="text-slate-400" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 h-11 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
        >
          Fechar
        </button>
      </motion.div>
    </div>
  );
};

// --- Modal de Importação ---
export const ImportModal = ({
  isOpen,
  onClose,
  onImport,
  currentList,
  themeColor
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: { listName: string; items: ListItem[]; budgetLimit?: number }, mode: 'new_list' | 'add_to_current') => void;
  currentList?: GroceryList | null;
  currency?: Currency;
  themeColor: ThemeColor;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteContent, setPasteContent] = useState('');
  const [importMode, setImportMode] = useState<'new_list' | 'add_to_current'>(currentList ? 'add_to_current' : 'new_list');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessText = (content: string) => {
    setErrorMessage(null);
    const result = parseImportData(content);
    if (!result.success || result.items.length === 0) {
      setErrorMessage(result.error || 'Não foi possível reconhecer itens válidos no conteúdo fornecido.');
      return;
    }

    onImport({
      listName: result.listName || 'Lista Importada',
      items: result.items,
      budgetLimit: result.budgetLimit
    }, importMode);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleProcessText(text);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Erro ao ler o arquivo selecionado.');
    };
    reader.readAsText(file, 'UTF-8');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs no-print">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Entrada de Dados</span>
            <h3 className="text-lg font-black text-slate-900 mt-0.5">Importar Produtos</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-50 text-rose-800 text-xs font-bold border border-rose-200 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Escolha do destino */}
        {currentList && (
          <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 block mb-2">Destino da importação:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setImportMode('add_to_current')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  importMode === 'add_to_current' ? `${themeColor.bg} text-white` : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Adicionar a esta lista
              </button>
              <button
                type="button"
                onClick={() => setImportMode('new_list')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                  importMode === 'new_list' ? `${themeColor.bg} text-white` : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Criar nova lista
              </button>
            </div>
          </div>
        )}

        {/* Upload por arquivo */}
        <div className="mt-4">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.csv,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 flex flex-col items-center justify-center gap-2 text-slate-600 font-bold transition-all"
          >
            <Upload size={22} className={themeColor.text} />
            <span className="text-xs">Clique para selecionar arquivo .JSON ou .CSV</span>
            <span className="text-[10px] text-slate-400 font-medium">Exportados pelo Mercado Fresh ou planilhas</span>
          </button>
        </div>

        {/* Ou colar texto */}
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-700 block mb-1">Ou cole o texto / JSON / CSV aqui:</label>
          <textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value)}
            placeholder="Cole aqui o conteúdo copiado de outra lista ou mensagem..."
            className={`w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 ${themeColor.ring} resize-none`}
          />
          <button
            onClick={() => handleProcessText(pasteContent)}
            disabled={!pasteContent.trim()}
            className={`w-full mt-2 h-11 rounded-2xl ${themeColor.bg} text-white font-bold text-xs shadow-xs disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Processar Conteúdo Colado
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 h-11 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200 transition-colors"
        >
          Cancelar
        </button>
      </motion.div>
    </div>
  );
};
