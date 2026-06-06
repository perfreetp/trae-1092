import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Car,
  Receipt,
  Users,
  Cpu,
  Headphones,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { path: '/', label: '总览', icon: LayoutDashboard },
  { path: '/map', label: '车场地图', icon: Map },
  { path: '/vehicles', label: '车辆记录', icon: Car },
  { path: '/orders', label: '订单收费', icon: Receipt },
  { path: '/members', label: '会员月卡', icon: Users },
  { path: '/devices', label: '设备状态', icon: Cpu },
  { path: '/tickets', label: '客服工单', icon: Headphones },
  { path: '/reports', label: '报表', icon: BarChart3 },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-slate-700/50 bg-slate-900">
      <div className="flex h-16 items-center border-b border-slate-700/50 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
            <Car className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">智慧停车</h1>
            <p className="text-xs text-slate-400">运营管理系统</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all',
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-700/50 p-4">
        <div className="rounded-lg bg-slate-800/50 p-3">
          <p className="text-xs text-slate-400">系统状态</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-300">设备运行正常</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
