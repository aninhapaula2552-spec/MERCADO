export type View = 'lists' | 'gas' | 'pantry' | 'offers' | 'games' | 'history' | 'settings' | 'detail';

export interface Currency {
  symbol: string;
  name: string;
  code: string;
}

export interface ThemeColor {
  id: string;
  name: string;
  hex: string;
  bg: string;
  text: string;
  border: string;
  light: string;
  hover: string;
  ring: string;
}

export interface GasCylinder {
  id: string;
  userId?: string;
  purchaseDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD or null if currently in use
  price: number;
  brand?: string;
  notes?: string;
  status: 'in_use' | 'finished';
  createdAt?: number;
  updatedAt?: number;
}

export interface ListItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  checked: boolean;
  unit?: string;
  weight?: string;
  notes?: string;
  offer?: boolean;
  bulkDiscount?: string;
  wholesalePrice?: number;
  minWholesaleQty?: number;
  importanceLevel?: number; // 0: None, 1: Star 1 (amber), 2: Star 2 (blue), 3: Star 3 (orange)
}

export interface GroceryList {
  id: string;
  name: string;
  status: 'Em andamento' | 'Concluído';
  icon: string;
  color: string;
  items: ListItem[];
  avatars?: string[];
  extra?: number;
  budgetLimit: number;
  completedAt?: string;
  totalAmount?: number;
  userId?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PantryReductionEntry {
  date: string; // YYYY-MM-DD
  amountWithdrawn: number;
  remaining: number;
}

export interface PantryHistoryEntry {
  id: string;
  purchaseDate: string; // YYYY-MM-DD
  quantityPurchased: number;
  unit: string;
  brand?: string;
  pricePaid?: number;
  reductions: PantryReductionEntry[];
  endDate?: string | null; // YYYY-MM-DD when quantity reached 0
  durationDays?: number;
  status: 'active' | 'finished';
}

export interface ShoppingRoutineSettings {
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'specific_date' | 'daily' | 'weekdays' | 'card_cycle' | 'salary' | 'when_needed' | 'custom';
  dayDescription: string; // e.g. "Todo sábado", "Dia 10 de cada mês"
  specificDate?: string; // e.g. "2026-10-15"
  cardTurnoverDate?: number; // 1 to 31
  cardReminderEnabled: boolean;
  daysInAdvanceReminder: number; // e.g. 2
  routineEnabled: boolean;
  summaryBeforeShopping: boolean;
}

export interface PantryNotificationSettings {
  enabled: boolean;
  routine: ShoppingRoutineSettings;
  types: {
    nearEnding: boolean;
    probablyFinished: boolean;
    reorderTime: boolean;
    reminderDecrement: boolean;
    suggestAddToList: boolean;
    weeklySummary: boolean;
    cardReminder: boolean;
    preShoppingReminder: boolean;
    preShoppingSummary: boolean;
  };
  timeSlot: 'morning' | 'afternoon' | 'evening' | 'custom';
  customTime?: string;
}

export interface PantryItem {
  id: string;
  name: string;
  brand: string;
  inUseQuantity: number;
  stockQuantity: number;
  quantity: number; // total = inUseQuantity + stockQuantity
  unit: string;
  category: string;
  expiryDate?: string;
  minQuantity: number;
  restockBuyQuantity: number;
  reminderEnabled: boolean;
  alertDismissedForMinQty?: boolean;
  createdAt?: number;
  updatedAt?: number;
  history?: PantryHistoryEntry[];
  averageConsumptionDays?: number; // e.g. 1 unit every X days
  lastPurchaseDate?: string;
}

