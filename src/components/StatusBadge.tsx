import React from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const colorClass = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'bg-gray-500';
  const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-white',
        colorClass,
        size === 'sm' ? 'text-xs' : 'text-xs'
      )}
    >
      <span className="mr-1 h-1.5 w-1.5 rounded-full bg-white/60" />
      {label}
    </span>
  );
};
