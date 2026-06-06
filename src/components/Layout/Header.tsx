import React from 'react';
import { Bell, Search, User } from 'lucide-react';
import { useParkingStore } from '@/store/useParkingStore';

export const Header: React.FC = () => {
  const currentUser = useParkingStore((state) => state.currentUser);
  const pendingTicketCount = useParkingStore((state) =>
    state.tickets.filter((t) => t.status === 'pending' || t.status === 'processing').length
  );

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-700/50 bg-slate-900/80 px-6 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索车牌、订单、会员..."
            className="w-80 rounded-lg border border-slate-700 bg-slate-800/50 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white">
          <Bell className="h-5 w-5" />
          {pendingTicketCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {pendingTicketCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
            <User className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{currentUser}</p>
            <p className="text-xs text-slate-400">管理员</p>
          </div>
        </div>
      </div>
    </header>
  );
};
