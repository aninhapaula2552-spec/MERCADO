import { ListItem, GroceryList } from './types';

export interface StandardExportItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  subtotal: number;
  category: string;
  notes: string;
  checked: boolean;
  importanceLevel?: number;
  wholesalePrice?: number | null;
  minWholesaleQty?: number | null;
}

export interface StandardExportData {
  app: 'MercadoFresh';
  version: '1.0';
  exportedAt: string;
  list: {
    name: string;
    budgetLimit: number;
    status: string;
    currency: string;
    totalEstimated: number;
    totalCart: number;
    itemsCount: number;
    items: StandardExportItem[];
  };
}

/**
 * Formata um valor numérico para representação monetária brasileira
 * SEMPRE preservando exatamente 2 casas decimais (centavos).
 * Ex: 6.5 -> "6,50", 10.99 -> "10,99", 25 -> "25,00"
 */
export const formatMoneyExact = (val: number): string => {
  if (val === undefined || val === null || isNaN(val)) return '0,00';
  return Number(val.toFixed(2)).toFixed(2).replace('.', ',');
};

/**
 * Converte string ou número para float seguro com 2 casas decimais,
 * preservando os centavos originais (ex: "6,50" -> 6.5, "10.99" -> 10.99).
 */
export const parseMoneyExact = (val: unknown): number => {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : Number(val.toFixed(2));
  }
  if (!val) return 0;
  const str = String(val)
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Number(parsed.toFixed(2));
};

export const getItemUnit = (item: Partial<ListItem>): string => {
  if (item.unit && item.unit.trim()) return item.unit.trim();
  if (item.weight) return 'kg';
  return 'un';
};

export const getItemQuantity = (item: Partial<ListItem>): number => {
  if (item.weight !== undefined && item.weight !== null && item.weight !== '') {
    const parsedWeight = parseFloat(item.weight.toString().replace(',', '.'));
    return isNaN(parsedWeight) || parsedWeight <= 0 ? 1 : parsedWeight;
  }
  const qty = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity || '1').replace(',', '.'));
  return isNaN(qty) || qty <= 0 ? 1 : qty;
};

export const calculateItemSubtotal = (item?: ListItem | null): number => {
  if (!item) return 0;
  const qty = getItemQuantity(item);
  let price = typeof item.price === 'number' ? item.price : 0;
  if (item.minWholesaleQty !== undefined && item.minWholesaleQty !== null && qty >= item.minWholesaleQty && item.wholesalePrice !== undefined && item.wholesalePrice !== null) {
    price = item.wholesalePrice;
  }
  return Number((price * qty).toFixed(2));
};

/**
 * Gera o JSON padronizado e documentado para exportação e importação entre aplicativos
 */
export const generateExportJSON = (list: GroceryList, currencySymbol: string = 'R$'): string => {
  const items: StandardExportItem[] = (list.items || []).filter(Boolean).map(item => {
    const qty = getItemQuantity(item);
    const unit = getItemUnit(item);
    const subtotal = calculateItemSubtotal(item);
    return {
      name: item.name || 'Produto sem nome',
      quantity: qty,
      unit: unit,
      unitPrice: Number((item.price || 0).toFixed(2)),
      subtotal: subtotal,
      category: item.category || 'Geral',
      notes: item.notes || '',
      checked: !!item.checked,
      importanceLevel: item.importanceLevel || 0,
      wholesalePrice: item.wholesalePrice ? Number(item.wholesalePrice.toFixed(2)) : null,
      minWholesaleQty: item.minWholesaleQty || null,
    };
  });

  const totalEstimated = items.reduce((acc, curr) => acc + curr.subtotal, 0);
  const totalCart = items.filter(i => i.checked).reduce((acc, curr) => acc + curr.subtotal, 0);

  const exportData: StandardExportData = {
    app: 'MercadoFresh',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    list: {
      name: list.name,
      budgetLimit: Number((list.budgetLimit || 100).toFixed(2)),
      status: list.status || 'Em andamento',
      currency: currencySymbol,
      totalEstimated: Number(totalEstimated.toFixed(2)),
      totalCart: Number(totalCart.toFixed(2)),
      itemsCount: items.length,
      items: items,
    }
  };

  return JSON.stringify(exportData, null, 2);
};

/**
 * Gera o arquivo CSV padronizado (com delimitador ';' e BOM UTF-8 para Excel / Google Sheets)
 * Preserva exatamente os centavos originais (ex: 6,50 e 13,00)
 */
export const generateExportCSV = (list: GroceryList): string => {
  const headers = [
    'Produto',
    'Quantidade',
    'Unidade',
    'Preço Unitário',
    'Subtotal',
    'Categoria',
    'Status',
    'Observação'
  ];

  const escapeCSV = (val: unknown): string => {
    const str = String(val ?? '');
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  const rows = (list.items || []).filter(Boolean).map(item => {
    const qty = getItemQuantity(item);
    const unit = getItemUnit(item);
    const subtotal = calculateItemSubtotal(item);

    return [
      escapeCSV(item.name || 'Item'),
      escapeCSV(qty.toString().replace('.', ',')),
      escapeCSV(unit),
      escapeCSV(formatMoneyExact(item.price)),
      escapeCSV(formatMoneyExact(subtotal)),
      escapeCSV(item.category || 'Geral'),
      escapeCSV(item.checked ? 'Comprado' : 'Pendente'),
      escapeCSV(item.notes || '')
    ].join(';');
  });

  // UTF-8 BOM (\uFEFF) para garantir acentuação correta no Excel
  return '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
};

/**
 * Gera o texto formatado para envio direto via WhatsApp, Telegram ou Bloco de Notas
 */
export const generateExportText = (list: GroceryList, currencySymbol: string = 'R$'): string => {
  const dateStr = new Date().toLocaleDateString('pt-BR');
  const items = (list.items || []).filter(Boolean);
  const totalEstimated = items.reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);
  const totalCart = items.filter(i => i && i.checked).reduce((acc, curr) => acc + calculateItemSubtotal(curr), 0);

  const lines = [
    `🛒 *Mercado Fresh - ${list.name}*`,
    `📅 *Data:* ${dateStr}`,
    `----------------------------------------`,
    `*ITENS DA LISTA:*`
  ];

  if (items.length === 0) {
    lines.push(`(Nenhum item cadastrado)`);
  } else {
    items.forEach(item => {
      const mark = item.checked ? '✅' : '⬜';
      const qty = getItemQuantity(item);
      const unit = getItemUnit(item);
      const subtotal = calculateItemSubtotal(item);
      let line = `${mark} *${item.name}* - ${qty} ${unit} x ${currencySymbol} ${formatMoneyExact(item.price)} = ${currencySymbol} ${formatMoneyExact(subtotal)}`;
      if (item.category && item.category !== 'Geral') {
        line += ` _(${item.category})_`;
      }
      if (item.notes && item.notes.trim()) {
        line += `\n   📝 _Obs: ${item.notes.trim()}_`;
      }
      lines.push(line);
    });
  }

  lines.push(`----------------------------------------`);
  lines.push(`💰 *Total no Carrinho:* ${currencySymbol} ${formatMoneyExact(totalCart)}`);
  lines.push(`🏷️ *Total Estimado:* ${currencySymbol} ${formatMoneyExact(totalEstimated)}`);
  if (list.budgetLimit) {
    lines.push(`🎯 *Limite de Gasto:* ${currencySymbol} ${formatMoneyExact(list.budgetLimit)}`);
  }

  return lines.join('\n');
};

/**
 * Analisa e importa dados a partir de texto (JSON ou CSV)
 * Suporta o formato oficial do Mercado Fresh, formatos de listas genéricas e CSVs
 */
export const parseImportData = (content: string): {
  success: boolean;
  listName: string;
  items: ListItem[];
  budgetLimit?: number;
  error?: string;
} => {
  if (!content || !content.trim()) {
    return { success: false, listName: '', items: [], error: 'O conteúdo fornecido está vazio.' };
  }

  const trimmed = content.trim();

  // 1. Tentar interpretar como JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);

      // Formato oficial StandardExportData
      if (parsed.app === 'MercadoFresh' && parsed.list) {
        const rawItems = (parsed.list.items || []) as Array<Record<string, unknown>>;
        const items: ListItem[] = rawItems.map((raw, index: number) => {
          const isWeight = raw.unit === 'kg' || (typeof raw.quantity === 'number' && !Number.isInteger(raw.quantity));
          return {
            id: 'item-' + Date.now() + '-' + index,
            name: String(raw.name || `Item ${index + 1}`),
            category: String(raw.category || 'Geral'),
            price: parseMoneyExact(raw.unitPrice ?? raw.price),
            quantity: isWeight ? 1 : Math.max(1, Math.round(Number(raw.quantity || 1))),
            weight: isWeight ? String(raw.quantity).replace('.', ',') : undefined,
            unit: String(raw.unit || (isWeight ? 'kg' : 'un')),
            notes: raw.notes ? String(raw.notes) : undefined,
            checked: Boolean(raw.checked),
            importanceLevel: typeof raw.importanceLevel === 'number' ? raw.importanceLevel : 0,
            wholesalePrice: raw.wholesalePrice ? parseMoneyExact(raw.wholesalePrice) : undefined,
            minWholesaleQty: raw.minWholesaleQty ? Number(raw.minWholesaleQty) : undefined,
          };
        });

        return {
          success: true,
          listName: parsed.list.name || 'Lista Importada',
          budgetLimit: parsed.list.budgetLimit ? parseMoneyExact(parsed.list.budgetLimit) : 100,
          items: items,
        };
      }

      // Formato legado GroceryList { id, name, items: [...] }
      if (parsed.name && Array.isArray(parsed.items)) {
        const rawItems = parsed.items as Array<Record<string, unknown>>;
        const items: ListItem[] = rawItems.map((raw, index: number) => ({
          id: 'item-' + Date.now() + '-' + index,
          name: String(raw.name || `Item ${index + 1}`),
          category: String(raw.category || 'Geral'),
          price: parseMoneyExact(raw.price),
          quantity: typeof raw.quantity === 'number' ? raw.quantity : 1,
          weight: raw.weight ? String(raw.weight) : undefined,
          unit: typeof raw.unit === 'string' ? raw.unit : (raw.weight ? 'kg' : 'un'),
          notes: raw.notes ? String(raw.notes) : undefined,
          checked: Boolean(raw.checked),
          importanceLevel: typeof raw.importanceLevel === 'number' ? raw.importanceLevel : 0,
          wholesalePrice: raw.wholesalePrice ? parseMoneyExact(raw.wholesalePrice) : undefined,
          minWholesaleQty: raw.minWholesaleQty ? Number(raw.minWholesaleQty) : undefined,
        }));

        return {
          success: true,
          listName: String(parsed.name),
          budgetLimit: parsed.budgetLimit ? parseMoneyExact(parsed.budgetLimit) : 100,
          items: items,
        };
      }

      // Formato array direto de itens [{ name, price, ... }]
      if (Array.isArray(parsed)) {
        const rawItems = parsed as Array<Record<string, unknown>>;
        const items: ListItem[] = rawItems.map((raw, index: number) => {
          const price = parseMoneyExact(raw.price ?? raw.preco ?? raw.unitPrice ?? raw.valor);
          const qty = parseFloat(String(raw.quantity ?? raw.quantidade ?? raw.qtd ?? 1).replace(',', '.')) || 1;
          const isWeight = raw.unit === 'kg' || raw.unidade === 'kg' || (typeof raw.weight !== 'undefined');

          return {
            id: 'item-' + Date.now() + '-' + index,
            name: String(raw.name ?? raw.produto ?? raw.descricao ?? raw.item ?? `Item ${index + 1}`),
            category: String(raw.category ?? raw.categoria ?? 'Geral'),
            price: price,
            quantity: isWeight ? 1 : Math.max(1, Math.round(qty)),
            weight: isWeight ? String(raw.weight || qty).replace('.', ',') : undefined,
            unit: String(raw.unit ?? raw.unidade ?? (isWeight ? 'kg' : 'un')),
            notes: raw.notes ? String(raw.notes) : (raw.observacao ? String(raw.observacao) : undefined),
            checked: Boolean(raw.checked ?? raw.comprado ?? false),
            importanceLevel: 0,
          };
        });

        return {
          success: true,
          listName: 'Lista Importada',
          budgetLimit: 100,
          items: items,
        };
      }
    } catch (err) {
      console.warn('Falha ao tentar parsear JSON, tentando CSV...', err);
    }
  }

  // 2. Tentar interpretar como CSV
  try {
    const cleanContent = trimmed.replace(/^\uFEFF/, ''); // Remove BOM se presente
    const lines = cleanContent.split(/\r?\n/).filter(line => line.trim().length > 0);

    if (lines.length >= 1) {
      // Detectar delimitador (; ou , ou tab)
      const firstLine = lines[0];
      const delimiter = firstLine.includes(';') ? ';' : (firstLine.includes('\t') ? '\t' : ',');

      // Helper para dividir linha respeitando aspas
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let curr = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const c = line[i];
          if (c === '"') {
            if (inQuotes && line[i + 1] === '"') {
              curr += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (c === delimiter && !inQuotes) {
            result.push(curr.trim());
            curr = '';
          } else {
            curr += c;
          }
        }
        result.push(curr.trim());
        return result.map(s => s.replace(/^"|"$/g, '').trim());
      };

      const headerCols = parseCSVLine(firstLine).map(h => h.toLowerCase());
      
      // Localizar posições das colunas
      const idxProduto = headerCols.findIndex(h => h.includes('prod') || h.includes('nome') || h.includes('item') || h.includes('desc'));
      const idxQtd = headerCols.findIndex(h => h.includes('quant') || h.includes('qtd'));
      const idxUnidade = headerCols.findIndex(h => h.includes('unid') || h.includes('medida'));
      const idxPreco = headerCols.findIndex(h => h.includes('pre') || h.includes('unit') || h.includes('valor'));
      const idxCategoria = headerCols.findIndex(h => h.includes('cat'));
      const idxStatus = headerCols.findIndex(h => h.includes('status') || h.includes('comp'));
      const idxObs = headerCols.findIndex(h => h.includes('obs') || h.includes('not'));

      const hasHeader = idxProduto !== -1 || idxPreco !== -1;
      const startIndex = hasHeader ? 1 : 0;

      const items: ListItem[] = [];

      for (let i = startIndex; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

        let name = 'Item';
        let qty = 1;
        let unit = 'un';
        let price = 0;
        let category = 'Geral';
        let checked = false;
        let notes: string | undefined = undefined;

        if (hasHeader) {
          if (idxProduto !== -1 && cols[idxProduto]) name = cols[idxProduto];
          if (idxQtd !== -1 && cols[idxQtd]) {
            const parsedQty = parseFloat(cols[idxQtd].replace(',', '.'));
            if (!isNaN(parsedQty) && parsedQty > 0) qty = parsedQty;
          }
          if (idxUnidade !== -1 && cols[idxUnidade]) unit = cols[idxUnidade].toLowerCase();
          if (idxPreco !== -1 && cols[idxPreco]) price = parseMoneyExact(cols[idxPreco]);
          if (idxCategoria !== -1 && cols[idxCategoria]) category = cols[idxCategoria];
          if (idxStatus !== -1 && cols[idxStatus]) {
            const st = cols[idxStatus].toLowerCase();
            checked = st.includes('sim') || st.includes('comp') || st === 'true' || st === '1';
          }
          if (idxObs !== -1 && cols[idxObs]) notes = cols[idxObs];
        } else {
          // Sem cabeçalho: formato posicional básico: Nome, Qtd, Unidade, Preço, Categoria
          if (cols[0]) name = cols[0];
          if (cols[1]) {
            const q = parseFloat(cols[1].replace(',', '.'));
            if (!isNaN(q) && q > 0) qty = q;
          }
          if (cols[2]) unit = cols[2];
          if (cols[3]) price = parseMoneyExact(cols[3]);
          if (cols[4]) category = cols[4];
        }

        const isWeight = unit === 'kg' || unit.includes('quilo') || (!Number.isInteger(qty) && qty > 0);

        items.push({
          id: 'item-' + Date.now() + '-' + i,
          name: name,
          category: category,
          price: price,
          quantity: isWeight ? 1 : Math.max(1, Math.round(qty)),
          weight: isWeight ? qty.toString().replace('.', ',') : undefined,
          unit: isWeight ? 'kg' : unit,
          notes: notes,
          checked: checked,
          importanceLevel: 0,
        });
      }

      if (items.length > 0) {
        return {
          success: true,
          listName: 'Lista Importada (CSV)',
          budgetLimit: 100,
          items: items,
        };
      }
    }
  } catch (err) {
    console.error('Erro no parser CSV:', err);
  }

  return {
    success: false,
    listName: '',
    items: [],
    error: 'Formato de arquivo não reconhecido. Certifique-se de enviar um arquivo .json ou .csv com colunas de produtos e preços.'
  };
};

/**
 * Compartilha arquivo via Web Share API do celular (WhatsApp, Arquivos, E-mail)
 * ou realiza o download direto no navegador como fallback seguro.
 */
export const shareOrDownloadFile = async (
  filename: string,
  content: string,
  mimeType: string,
  title: string
): Promise<'shared' | 'downloaded' | 'cancelled'> => {
  try {
    const blob = new Blob([content], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    if (
      typeof navigator !== 'undefined' &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: title,
          text: `Lista de compras exportada: ${title}`,
        });
        return 'shared';
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
          return 'cancelled';
        }
        console.warn('Falha no navigator.share, acionando fallback de download direto...', err);
      }
    }
  } catch (e) {
    console.warn('Erro ao criar arquivo para compartilhamento', e);
  }

  // Fallback: download direto do arquivo
  downloadFileDirectly(filename, content, mimeType);
  return 'downloaded';
};

/**
 * Baixa o arquivo diretamente no navegador
 */
export const downloadFileDirectly = (filename: string, content: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
