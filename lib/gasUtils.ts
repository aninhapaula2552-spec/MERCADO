import { GasCylinder } from './types';

/**
 * Calculates the number of days between two dates in 'YYYY-MM-DD' format.
 * Returns at least 1 day.
 */
export const getDaysBetweenDates = (startDateStr: string, endDateStr: string): number => {
  if (!startDateStr || !endDateStr) return 1;
  const start = new Date(`${startDateStr}T00:00:00`);
  const end = new Date(`${endDateStr}T00:00:00`);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
};

/**
 * Returns today's date in 'YYYY-MM-DD' format using local time.
 */
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a 'YYYY-MM-DD' date into 'DD/MM/AAAA' (or 'DD/MM' if short).
 */
export const formatDateBR = (dateStr?: string | null, short = false): string => {
  if (!dateStr) return '--/--';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return short ? `${day}/${month}` : `${day}/${month}/${year}`;
  }
  return dateStr;
};

/**
 * Calculates the duration in days of a cylinder.
 * If finished, uses endDate.
 * If in use, uses today's date.
 */
export const getCylinderDuration = (cylinder: GasCylinder): number => {
  if (!cylinder.startDate) return 1;
  if (cylinder.status === 'finished' && cylinder.endDate) {
    return getDaysBetweenDates(cylinder.startDate, cylinder.endDate);
  }
  const today = getTodayDateString();
  return getDaysBetweenDates(cylinder.startDate, today);
};

/**
 * Calculates the cost per day for a cylinder.
 */
export const getCylinderCostPerDay = (cylinder: GasCylinder): number => {
  const duration = getCylinderDuration(cylinder);
  if (duration <= 0 || !cylinder.price) return 0;
  return cylinder.price / duration;
};

/**
 * Calculates summary metrics based on finished cylinders and total spending.
 */
export const calculateGasMetrics = (cylinders: GasCylinder[]) => {
  const finished = cylinders.filter(c => c.status === 'finished' && c.endDate);
  
  // Average duration
  let averageDuration = 0;
  if (finished.length > 0) {
    const totalDays = finished.reduce((acc, c) => acc + getCylinderDuration(c), 0);
    averageDuration = Math.round((totalDays / finished.length) * 10) / 10;
  }

  // Average price of finished cylinders
  let averagePrice = 0;
  if (finished.length > 0) {
    const sumPrice = finished.reduce((acc, c) => acc + (c.price || 0), 0);
    averagePrice = sumPrice / finished.length;
  }

  // Average cost per day of finished cylinders
  let averageCostPerDay = 0;
  if (finished.length > 0) {
    const sumCostPerDay = finished.reduce((acc, c) => acc + getCylinderCostPerDay(c), 0);
    averageCostPerDay = sumCostPerDay / finished.length;
  }

  // Total spent across ALL cylinders (finished + currently in use)
  const totalSpent = cylinders.reduce((acc, c) => acc + (c.price || 0), 0);

  return {
    finishedCount: finished.length,
    averageDuration, // e.g. 38.5
    averagePrice,
    averageCostPerDay,
    totalSpent,
  };
};

export type ConsumptionStatus = 'green' | 'yellow' | 'red';

export interface ConsumptionIndicatorInfo {
  status: ConsumptionStatus;
  title: string;
  badgeText: string;
  badgeBg: string;
  textColor: string;
  borderColor: string;
  accentBg: string;
  percentage: number;
  daysRemaining: number;
}

/**
 * Determines the consumption indicator status:
 * 🟢 Dentro do período esperado (< 80% da média)
 * 🟡 Próximo da média de troca (80% a 100% da média)
 * 🔴 Passou da média esperada (> 100% da média)
 */
export const getConsumptionIndicator = (
  daysInUse: number,
  avgDuration: number
): ConsumptionIndicatorInfo => {
  // If no history yet, use standard average of 40 days as benchmark
  const benchmark = avgDuration > 0 ? avgDuration : 40;
  const percentage = Math.round((daysInUse / benchmark) * 100);
  const daysRemaining = Math.max(0, Math.round(benchmark - daysInUse));

  if (daysInUse > benchmark) {
    return {
      status: 'red',
      title: 'Passou da média esperada',
      badgeText: '🔴 Passou da média',
      badgeBg: 'bg-rose-100 text-rose-700',
      textColor: 'text-rose-600',
      borderColor: 'border-rose-200',
      accentBg: 'bg-rose-50',
      percentage: Math.min(150, percentage),
      daysRemaining: 0,
    };
  }

  if (percentage >= 80) {
    return {
      status: 'yellow',
      title: 'Próximo da média de troca',
      badgeText: '🟡 Próximo da troca',
      badgeBg: 'bg-amber-100 text-amber-800',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      accentBg: 'bg-amber-50',
      percentage,
      daysRemaining,
    };
  }

  return {
    status: 'green',
    title: 'Dentro do período esperado',
    badgeText: '🟢 Período esperado',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    accentBg: 'bg-emerald-50',
    percentage,
    daysRemaining,
  };
};

/**
 * Predicts the expected exchange date based on the active cylinder's start date and average duration.
 */
export const predictNextExchangeDate = (
  startDateStr: string,
  avgDuration: number
): { predictedDateStr: string; formattedDate: string; daysRemaining: number } => {
  const benchmark = avgDuration > 0 ? Math.round(avgDuration) : 40;
  const start = new Date(`${startDateStr}T00:00:00`);
  const predicted = new Date(start.getTime() + benchmark * 24 * 60 * 60 * 1000);

  const year = predicted.getFullYear();
  const month = String(predicted.getMonth() + 1).padStart(2, '0');
  const day = String(predicted.getDate()).padStart(2, '0');
  const predictedDateStr = `${year}-${month}-${day}`;

  const today = new Date(`${getTodayDateString()}T00:00:00`);
  const diffTime = predicted.getTime() - today.getTime();
  const daysRemaining = Math.round(diffTime / (1000 * 60 * 60 * 24));

  return {
    predictedDateStr,
    formattedDate: `${day}/${month}`,
    daysRemaining,
  };
};
