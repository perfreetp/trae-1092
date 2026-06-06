import { format, differenceInMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: zhCN });
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'yyyy-MM-dd', { locale: zhCN });
}

export function formatTime(date: string | Date): string {
  return format(new Date(date), 'HH:mm', { locale: zhCN });
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins}分钟`;
  }
  return `${mins}分钟`;
}

export function calculateDuration(entryTime: string, exitTime: string): number {
  return differenceInMinutes(new Date(exitTime), new Date(entryTime));
}

export function formatCurrency(amount: number): string {
  return `¥${amount.toFixed(2)}`;
}

export function formatPlateNumber(plate: string): string {
  if (plate.length <= 2) return plate;
  return plate.slice(0, 2) + '·' + plate.slice(2);
}

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 10);
}
