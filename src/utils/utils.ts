import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Returns the next valid business delivery date, skipping weekends.
// Assumes Saturday (6) and Sunday (0) are non-delivery days.
function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) {
      added++;
    }
  }
  return result;
}

export interface CutoffStatus {
  isLocked: boolean;
  cutoffTime: string;
  nextDeliveryDate: Date;
  secondsRemaining: number | null;
  hoursRemaining: number | null; // null when locked
}

const CUTOFF_HOUR = 15; // 3 PM — change here to update everywhere

export function getCutoffStatus(): CutoffStatus {
  const now = new Date();
  const cutoff = new Date();
  cutoff.setHours(CUTOFF_HOUR, 0, 0, 0);

  const isLocked = now >= cutoff;

  // If locked (after 3 PM), next delivery is 2 business days out.
  // If open (before 3 PM), next delivery is 1 business day out.
  const nextDeliveryDate = addBusinessDays(now, isLocked ? 2 : 1);

  const diffMs = cutoff.getTime() - now.getTime();
  const secondsRemaining = isLocked ? null : Math.floor(diffMs / 1000);
  const hoursRemaining = isLocked ? null : Math.floor(diffMs / (1000 * 60 * 60));

  return {
    isLocked,
    cutoffTime: '3:00 PM',
    nextDeliveryDate,
    secondsRemaining,
    hoursRemaining,
  };
}

// Formats a date for display in the Indian locale.
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', options ?? { day: 'numeric', month: 'short', year: 'numeric' });
}

// Returns a human-readable relative time string ("2 hours ago", "just now").
export function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
