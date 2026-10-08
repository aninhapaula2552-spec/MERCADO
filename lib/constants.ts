import { Currency, ThemeColor, GroceryList, PantryItem } from './types';

export const CURRENCIES: Currency[] = [
  { symbol: 'R$', name: 'Real Brasileiro', code: 'BRL' },
  { symbol: '$', name: 'Dólar Americano', code: 'USD' },
  { symbol: '€', name: 'Euro', code: 'EUR' },
  { symbol: '£', name: 'Libra Esterlina', code: 'GBP' },
];

export const THEME_COLORS: ThemeColor[] = [
  { id: 'green', name: 'Esmeralda', hex: '#16a34a', bg: 'bg-green-600', text: 'text-green-600', border: 'border-green-600', light: 'bg-green-50', hover: 'hover:bg-green-700', ring: 'focus:ring-green-500' },
  { id: 'blue', name: 'Oceano', hex: '#2563eb', bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-600', light: 'bg-blue-50', hover: 'hover:bg-blue-700', ring: 'focus:ring-blue-500' },
  { id: 'purple', name: 'Ametista', hex: '#9333ea', bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-600', light: 'bg-purple-50', hover: 'hover:bg-purple-700', ring: 'focus:ring-purple-500' },
  { id: 'rose', name: 'Framboesa', hex: '#e11d48', bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-600', light: 'bg-rose-50', hover: 'hover:bg-rose-700', ring: 'focus:ring-rose-500' },
  { id: 'orange', name: 'Âmbar', hex: '#ea580c', bg: 'bg-orange-600', text: 'text-orange-600', border: 'border-orange-600', light: 'bg-orange-50', hover: 'hover:bg-orange-700', ring: 'focus:ring-orange-500' },
];

export const ITEM_CATEGORIES = [
  'Geral',
  'Hortifruti',
  'Laticínios',
  'Carnes & Aves',
  'Padaria & Pães',
  'Mercearia & Grãos',
  'Bebidas',
  'Limpeza',
  'Higiene & Cuidados',
  'Congelados',
  'Doces & Snacks',
  'Pet Shop',
  'Outros'
];

export const PANTRY_CATEGORIES = [
  'Alimentos',
  'Bebidas',
  'Limpeza',
  'Higiene',
  'Hortifruti',
  'Padaria',
  'Carnes',
  'Laticínios',
  'Outros'
];

export const PANTRY_UNITS = [
  'pacotes',
  'unidades',
  'kg',
  'litros',
  'latas',
  'caixas',
  'garrafas',
  'rolos',
  'frascos'
];

export const DEFAULT_GUEST_LISTS: GroceryList[] = [
  {
    id: 'lista-padrao-1',
    name: 'Compras da Semana',
    status: 'Em andamento',
    icon: 'ShoppingCart',
    color: 'bg-green-100 text-green-600',
    budgetLimit: 300,
    items: [
      { id: 'item-1', name: 'Leite Integral 1L', category: 'Laticínios', price: 5.49, quantity: 4, checked: true },
      { id: 'item-2', name: 'Arroz Branco 5kg', category: 'Mercearia & Grãos', price: 29.90, quantity: 1, checked: false, importanceLevel: 3 },
      { id: 'item-3', name: 'Feijão Carioca 1kg', category: 'Mercearia & Grãos', price: 8.99, quantity: 2, checked: false },
      { id: 'item-4', name: 'Maçã Gala (kg)', category: 'Hortifruti', price: 9.90, quantity: 1, weight: '1.5', checked: false, offer: true },
      { id: 'item-5', name: 'Café Torrado e Moído 500g', category: 'Mercearia & Grãos', price: 18.50, quantity: 2, checked: false, wholesalePrice: 16.90, minWholesaleQty: 2 },
    ]
  },
  {
    id: 'lista-padrao-2',
    name: 'Churrasco com Amigos',
    status: 'Em andamento',
    icon: 'UtensilsCrossed',
    color: 'bg-orange-100 text-orange-600',
    budgetLimit: 250,
    items: [
      { id: 'churr-1', name: 'Picanha Bovina (kg)', category: 'Carnes & Aves', price: 69.90, quantity: 1, weight: '1.8', checked: false, importanceLevel: 3 },
      { id: 'churr-2', name: 'Carvão Vegetal 5kg', category: 'Outros', price: 24.50, quantity: 1, checked: false },
      { id: 'churr-3', name: 'Pão de Alho Tradicional', category: 'Padaria & Pães', price: 13.90, quantity: 2, checked: false },
      { id: 'churr-4', name: 'Refrigerante 2L', category: 'Bebidas', price: 8.99, quantity: 3, checked: false, wholesalePrice: 7.99, minWholesaleQty: 3 }
    ]
  }
];

export const DEFAULT_PANTRY_ITEMS: PantryItem[] = [
  {
    id: 'pantry-1',
    name: 'Arroz',
    brand: 'Tio João',
    inUseQuantity: 1,
    stockQuantity: 3,
    quantity: 4,
    unit: 'pacotes',
    category: 'Alimentos',
    minQuantity: 1,
    restockBuyQuantity: 3,
    reminderEnabled: true,
    alertDismissedForMinQty: false
  },
  {
    id: 'pantry-2',
    name: 'Leite Integral',
    brand: 'Piracanjuba',
    inUseQuantity: 1,
    stockQuantity: 0,
    quantity: 1,
    unit: 'litros',
    category: 'Bebidas',
    minQuantity: 2,
    restockBuyQuantity: 6,
    reminderEnabled: true,
    alertDismissedForMinQty: false
  },
  {
    id: 'pantry-3',
    name: 'Café Torrado',
    brand: '3 Corações',
    inUseQuantity: 1,
    stockQuantity: 1,
    quantity: 2,
    unit: 'pacotes',
    category: 'Alimentos',
    minQuantity: 1,
    restockBuyQuantity: 2,
    reminderEnabled: true,
    alertDismissedForMinQty: false
  },
  {
    id: 'pantry-4',
    name: 'Papel Higiênico',
    brand: 'Neve',
    inUseQuantity: 1,
    stockQuantity: 7,
    quantity: 8,
    unit: 'rolos',
    category: 'Higiene',
    minQuantity: 4,
    restockBuyQuantity: 12,
    reminderEnabled: false,
    alertDismissedForMinQty: false
  }
];

export const GAS_BRANDS = [
  'Ultragaz',
  'Liquigás',
  'Supergasbras',
  'Nacional Gás',
  'Copagaz',
  'Consigaz',
  'Outra'
];

// Helper to generate dynamic past ISO dates (YYYY-MM-DD)
const getPastDateStr = (daysAgo: number): string => {
  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DEFAULT_GAS_CYLINDERS = [
  {
    id: 'gas-default-1',
    purchaseDate: getPastDateStr(18),
    startDate: getPastDateStr(18),
    endDate: null,
    price: 120.00,
    brand: 'Supergasbras',
    notes: 'Botijão P13 atual em uso na cozinha',
    status: 'in_use' as const,
    createdAt: Date.now() - 18 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 18 * 24 * 60 * 60 * 1000
  },
  {
    id: 'gas-default-2',
    purchaseDate: getPastDateStr(58),
    startDate: getPastDateStr(58),
    endDate: getPastDateStr(18),
    price: 115.00,
    brand: 'Liquigás',
    notes: 'Uso diário regular da família (durou 40 dias)',
    status: 'finished' as const,
    createdAt: Date.now() - 58 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 18 * 24 * 60 * 60 * 1000
  },
  {
    id: 'gas-default-3',
    purchaseDate: getPastDateStr(98),
    startDate: getPastDateStr(98),
    endDate: getPastDateStr(58),
    price: 110.00,
    brand: 'Ultragaz',
    notes: 'Primeiro registro de botijão P13 (durou 40 dias)',
    status: 'finished' as const,
    createdAt: Date.now() - 98 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 58 * 24 * 60 * 60 * 1000
  }
];
