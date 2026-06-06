import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
}

export const DataCard: React.FC<DataCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  className,
}) => {
  return (
    <div
      className={cn(
        'rounded-xl bg-slate-800/50 p-5 transition-all duration-300 hover:bg-slate-800 hover:shadow-lg hover:shadow-blue-500/10',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p className="mt-2 text-xs">
              <span
                className={cn(
                  'font-medium',
                  trend.isPositive ? 'text-emerald-400' : 'text-red-400'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-slate-500"> 较昨日</span>
            </p>
          )}
          {subtitle && <p className="mt-2 text-xs text-slate-500">{subtitle}</p>}
        </div>
        <div className="rounded-lg bg-blue-500/20 p-3">
          <Icon className="h-6 w-6 text-blue-400" />
        </div>
      </div>
    </div>
  );
};
