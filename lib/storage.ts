import { GroceryList, PantryItem, ThemeColor, Currency, ListItem, GasCylinder, PantryNotificationSettings } from './types';
import { DEFAULT_GUEST_LISTS, DEFAULT_PANTRY_ITEMS, THEME_COLORS, CURRENCIES, DEFAULT_GAS_CYLINDERS } from './constants';
import { safeNumber } from './utils';

const STORAGE_KEYS = {
  LISTS: 'mercado_fresh_guest_lists_v3',
  PANTRY: 'mercado_fresh_pantry_items_v3',
  GAS: 'mercado_fresh_gas_cylinders_v1',
  SETTINGS: 'mercado_fresh_guest_settings_v3',
  // Old legacy keys for migration
  LEGACY_LISTS: 'mercado_fresh_guest_lists',
  LEGACY_PANTRY: 'mercado_fresh_pantry_items_v2',
  LEGACY_SETTINGS: 'mercado_fresh_guest_settings'
};

export const sanitizeGroceryLists = (rawLists: unknown): GroceryList[] => {
  if (!Array.isArray(rawLists)) return [];
  const valid = rawLists.filter(Boolean).map((rawItem: unknown, lIdx: number) => {
    const raw = (rawItem && typeof rawItem === 'object' ? rawItem : {}) as Record<string, unknown>;
    const rawItems = Array.isArray(raw.items) ? raw.items : [];
    const items: ListItem[] = rawItems.filter(Boolean).map((itemObj: unknown, iIdx: number) => {
      const i = (itemObj && typeof itemObj === 'object' ? itemObj : {}) as Record<string, unknown>;
      return {
        id: String(i.id || `item-${Date.now()}-${lIdx}-${iIdx}`),
        name: String(i.name || 'Produto sem nome'),
        category: String(i.category || 'Geral'),
        price: safeNumber(i.price, 0),
        quantity: typeof i.quantity === 'number' ? Math.max(1, i.quantity) : 1,
        checked: Boolean(i.checked),
        weight: i.weight ? String(i.weight) : undefined,
        unit: i.unit ? String(i.unit) : (i.weight ? 'kg' : 'un'),
        notes: i.notes ? String(i.notes) : undefined,
        offer: Boolean(i.offer),
        bulkDiscount: i.bulkDiscount ? String(i.bulkDiscount) : undefined,
        wholesalePrice: i.wholesalePrice !== undefined && i.wholesalePrice !== null ? safeNumber(i.wholesalePrice) : undefined,
        minWholesaleQty: i.minWholesaleQty !== undefined && i.minWholesaleQty !== null ? safeNumber(i.minWholesaleQty) : undefined,
        importanceLevel: typeof i.importanceLevel === 'number' ? i.importanceLevel : 0
      };
    });

    return {
      id: String(raw.id || `list-${Date.now()}-${lIdx}`),
      name: String(raw.name || 'Minha Lista'),
      status: raw.status === 'Concluído' ? 'Concluído' : 'Em andamento',
      icon: String(raw.icon || 'ShoppingCart'),
      color: String(raw.color || 'bg-green-100 text-green-600'),
      items,
      budgetLimit: safeNumber(raw.budgetLimit, 200),
      completedAt: raw.completedAt ? String(raw.completedAt) : undefined,
      totalAmount: raw.totalAmount !== undefined && raw.totalAmount !== null ? safeNumber(raw.totalAmount) : undefined
    } as GroceryList;
  });

  return valid;
};

export const sanitizePantryItems = (rawItems: unknown): PantryItem[] => {
  if (!Array.isArray(rawItems)) return [];
  const valid = rawItems.filter(Boolean).map((pObj: unknown, idx: number) => {
    const p = (pObj && typeof pObj === 'object' ? pObj : {}) as Record<string, unknown>;
    const totalQty = typeof p.quantity === 'number' ? p.quantity : safeNumber(p.quantity, 1);
    const inUse = typeof p.inUseQuantity === 'number' ? p.inUseQuantity : Math.min(1, totalQty);
    const stock = typeof p.stockQuantity === 'number' ? p.stockQuantity : Math.max(0, totalQty - inUse);
    const finalTotal = inUse + stock;

    return {
      id: String(p.id || `pantry-${Date.now()}-${idx}`),
      name: String(p.name || 'Produto'),
      brand: String(p.brand || ''),
      inUseQuantity: inUse,
      stockQuantity: stock,
      quantity: finalTotal,
      unit: String(p.unit || 'unidades'),
      category: String(p.category || 'Alimentos'),
      expiryDate: p.expiryDate ? String(p.expiryDate) : undefined,
      minQuantity: typeof p.minQuantity === 'number' ? p.minQuantity : safeNumber(p.minQuantity, 1),
      restockBuyQuantity: typeof p.restockBuyQuantity === 'number' ? p.restockBuyQuantity : safeNumber(p.restockBuyQuantity, 2),
      reminderEnabled: Boolean(p.reminderEnabled),
      alertDismissedForMinQty: Boolean(p.alertDismissedForMinQty),
      createdAt: typeof p.createdAt === 'number' ? p.createdAt : Date.now(),
      updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : Date.now(),
      history: Array.isArray(p.history) ? p.history : undefined,
      averageConsumptionDays: typeof p.averageConsumptionDays === 'number' ? p.averageConsumptionDays : undefined,
      lastPurchaseDate: p.lastPurchaseDate ? String(p.lastPurchaseDate) : undefined
    } as PantryItem;
  });

  return valid;
};

export const sanitizeGasCylinders = (rawCylinders: unknown): GasCylinder[] => {
  if (!Array.isArray(rawCylinders)) return [];
  const valid = rawCylinders.filter(Boolean).map((cObj: unknown, idx: number) => {
    const c = (cObj && typeof cObj === 'object' ? cObj : {}) as Record<string, unknown>;
    return {
      id: String(c.id || `gas-${Date.now()}-${idx}`),
      userId: c.userId ? String(c.userId) : undefined,
      purchaseDate: String(c.purchaseDate || new Date().toISOString().slice(0, 10)),
      startDate: String(c.startDate || new Date().toISOString().slice(0, 10)),
      endDate: c.endDate ? String(c.endDate) : null,
      price: safeNumber(c.price, 120),
      brand: c.brand ? String(c.brand) : 'P13',
      notes: c.notes ? String(c.notes) : undefined,
      status: c.status === 'finished' ? 'finished' : 'in_use',
      createdAt: typeof c.createdAt === 'number' ? c.createdAt : Date.now(),
      updatedAt: typeof c.updatedAt === 'number' ? c.updatedAt : Date.now()
    } as GasCylinder;
  });

  return valid;
};

export const loadStoredGas = (): GasCylinder[] => {
  if (typeof window === 'undefined') return DEFAULT_GAS_CYLINDERS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.GAS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      return sanitizeGasCylinders(parsed);
    }
  } catch (e) {
    console.warn('Erro ao carregar registros de gás do localStorage:', e);
  }
  return DEFAULT_GAS_CYLINDERS;
};

export const saveStoredGas = (cylinders: GasCylinder[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.GAS, JSON.stringify(cylinders));
  } catch (e) {
    console.warn('Erro ao salvar registros de gás:', e);
  }
};

export const loadStoredLists = (): GroceryList[] => {
  if (typeof window === 'undefined') return DEFAULT_GUEST_LISTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.LISTS) ?? localStorage.getItem(STORAGE_KEYS.LEGACY_LISTS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      return sanitizeGroceryLists(parsed);
    }
  } catch (e) {
    console.warn('Erro ao carregar listas do localStorage:', e);
  }
  return DEFAULT_GUEST_LISTS;
};

export const saveStoredLists = (lists: GroceryList[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.LISTS, JSON.stringify(lists));
  } catch (e) {
    console.warn('Erro ao salvar listas:', e);
  }
};

export const loadStoredPantry = (): PantryItem[] => {
  if (typeof window === 'undefined') return DEFAULT_PANTRY_ITEMS;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PANTRY) ?? localStorage.getItem(STORAGE_KEYS.LEGACY_PANTRY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      return sanitizePantryItems(parsed);
    }
  } catch (e) {
    console.warn('Erro ao carregar despensa do localStorage:', e);
  }
  return DEFAULT_PANTRY_ITEMS;
};

export const saveStoredPantry = (items: PantryItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PANTRY, JSON.stringify(items));
  } catch (e) {
    console.warn('Erro ao salvar despensa:', e);
  }
};

export interface StoredSettings {
  currency: Currency;
  theme: ThemeColor;
  suggestions: string;
  pantryNotifications: PantryNotificationSettings;
}


export const loadStoredSettings = (): StoredSettings => {
  const defaults: StoredSettings = {
    currency: CURRENCIES[0],
    theme: THEME_COLORS[0],
    suggestions: '',
    pantryNotifications: {
      enabled: true,
      routine: {
        frequency: 'weekly',
        dayDescription: 'Todo sábado',
        cardTurnoverDate: 10,
        cardReminderEnabled: true,
        daysInAdvanceReminder: 2,
        routineEnabled: true,
        summaryBeforeShopping: true,
      },
      types: {
        nearEnding: true,
        probablyFinished: true,
        reorderTime: true,
        reminderDecrement: true,
        suggestAddToList: true,
        weeklySummary: true,
        cardReminder: true,
        preShoppingReminder: true,
        preShoppingSummary: true,
      },
      timeSlot: 'morning',
      customTime: '08:00'
    }
  };

  if (typeof window === 'undefined') return defaults;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS) || localStorage.getItem(STORAGE_KEYS.LEGACY_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        if (parsed.currency && parsed.currency.symbol) {
          defaults.currency = parsed.currency;
        }
        if (parsed.themeId) {
          const found = THEME_COLORS.find(t => t.id === parsed.themeId);
          if (found) defaults.theme = found;
        } else if (parsed.theme && parsed.theme.id) {
          defaults.theme = parsed.theme;
        }
        if (typeof parsed.suggestions === 'string') {
          defaults.suggestions = parsed.suggestions;
        }
        if (parsed.pantryNotifications && typeof parsed.pantryNotifications === 'object') {
          defaults.pantryNotifications = {
            ...defaults.pantryNotifications,
            ...parsed.pantryNotifications,
            routine: {
              ...defaults.pantryNotifications.routine,
              ...(parsed.pantryNotifications.routine || {})
            },
            types: {
              ...defaults.pantryNotifications.types,
              ...(parsed.pantryNotifications.types || {})
            }
          };
        }
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar configurações:', e);
  }

  return defaults;
};

export const saveStoredSettings = (settings: Partial<StoredSettings>): void => {
  if (typeof window === 'undefined') return;
  try {
    const current = loadStoredSettings();
    const updated = {
      ...current,
      ...settings,
      themeId: settings.theme ? settings.theme.id : current.theme.id
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Erro ao salvar configurações:', e);
  }
};

export const resetAllStorageData = (): void => {
  if (typeof window === 'undefined') return;
  try {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Erro ao resetar storage:', e);
  }
};
