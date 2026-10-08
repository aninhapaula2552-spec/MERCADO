import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ListItem } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const safeNumber = (val: unknown, fallback: number = 0): number => {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const cleaned = String(val).replace(/[^\d.,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
};

export const safeFormatMoney = (val: unknown, currency?: { symbol: string } | string): string => {
  const num = safeNumber(val, 0);
  const formatted = num.toFixed(2).replace('.', ',');
  if (!currency) return formatted;
  const sym = typeof currency === 'string' ? currency : (currency?.symbol || 'R$');
  return `${sym} ${formatted}`;
};

export const parseItemAmount = (item?: Partial<ListItem> | null): number => {
  if (!item) return 1;
  if (item.weight !== undefined && item.weight !== null && item.weight !== '') {
    const val = safeNumber(item.weight, 0);
    return val <= 0 ? 1 : val;
  }
  const qty = typeof item.quantity === 'number' ? item.quantity : safeNumber(item.quantity, 1);
  return qty <= 0 ? 1 : qty;
};

export const calculateItemPrice = (item?: Partial<ListItem> | null): number => {
  if (!item) return 0;
  const amount = parseItemAmount(item);
  const wholesalePriceNum = item.wholesalePrice !== undefined && item.wholesalePrice !== null ? safeNumber(item.wholesalePrice) : undefined;
  const minWholesaleQtyNum = item.minWholesaleQty !== undefined && item.minWholesaleQty !== null ? safeNumber(item.minWholesaleQty) : undefined;

  if (minWholesaleQtyNum !== undefined && minWholesaleQtyNum > 0 && amount >= minWholesaleQtyNum && wholesalePriceNum !== undefined && wholesalePriceNum > 0) {
    return wholesalePriceNum;
  }
  return safeNumber(item.price, 0);
};

export const calculateItemSubtotal = (item?: Partial<ListItem> | null): number => {
  if (!item) return 0;
  const amount = parseItemAmount(item);
  const unitPrice = calculateItemPrice(item);
  return Number((unitPrice * amount).toFixed(2));
};

export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
};
