import React from 'react';
import {
  Car,
  CarFront,
  LogIn,
  LogOut,
  DollarSign,
  Users,
  TrendingUp,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { DataCard } from '@/components/DataCard';
import { useParkingStore } from '@/store/useParkingStore';
import { formatCurrency } from '@/utils/format';

export const Dashboard: React.FC = () => {
  const parkingSpots = useParkingStore((state) => state.parkingSpots);
  const vehicleRecords = useParkingStore((state) => state.vehicleRecords);
  const orders = useParkingStore((state) => state.orders);
  const members = useParkingStore((state) => state.members);
  const zoneStats = useParkingStore((state) => state.zoneStats);
  const hourlyTraffic = useParkingStore((state) => state.hourlyTraffic);
  const dailyRevenue = useParkingStore((state) => state.dailyRevenue);

  const totalSpots = parkingSpots.length;
  const availableSpots = parkingSpots.filter((s) => s.status === 'available').length;
  const todayEntry = vehicleRecords.filter((r) => {
    const entryDate = new Date(r.entryTime).toDateString();
    return entryDate === new Date().toDateString();
  }).length;
  const todayExit = vehicleRecords.filter(
    (r) => r.exitTime && new Date(r.exitTime).toDateString() === new Date().toDateString()
  ).length;
  const todayRevenue = orders
    .filter((o) => new Date(o.exitTime).toDateString() === new Date().toDateString() && o.status === 'paid')
    .reduce((sum, o) => sum + o.paidAmount, 0);
  const activeMembers = members.filter((m) => m.status === 'active').length;

  const chartColors = {
    entry: '#3B82F6',
    exit: '#10B981',
    revenue: '#8B5CF6',
    orders: '#F59E0B',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">运营总览</h1>
        <p className="mt-1 text-sm text-slate-400">实时监控停车场运营状况</p>
      </div>

      <div className="grid grid-cols-6 gap-4">
        <DataCard
          title="总车位"
          value={totalSpots}
          icon={Car}
          subtitle="总计车位数量"
        />
        <DataCard
          title="剩余车位"
          value={availableSpots}
          icon={CarFront}
          trend={{ value: 5.2, isPositive: true }}
          subtitle={`占用率 ${(((totalSpots - availableSpots) / totalSpots) * 100).toFixed(1)}%`}
        />
        <DataCard
          title="今日入场"
          value={todayEntry}
          icon={LogIn}
          trend={{ value: 12.5, isPositive: true }}
        />
        <DataCard
          title="今日出场"
          value={todayExit}
          icon={LogOut}
          trend={{ value: 8.3, isPositive: true }}
        />
        <DataCard
          title="今日收入"
          value={formatCurrency(todayRevenue)}
          icon={DollarSign}
          trend={{ value: 3.8, isPositive: true }}
        />
        <DataCard
          title="有效会员"
          value={activeMembers}
          icon={Users}
          trend={{ value: 2.1, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-xl bg-slate-800/50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">24小时车流量趋势</h3>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors.entry }} />
                <span className="text-slate-400">入场</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: chartColors.exit }} />
                <span className="text-slate-400">出场</span>
              </div>
            </div>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyTraffic}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="entry"
                  stroke={chartColors.entry}
                  strokeWidth={2}
                  dot={false}
                  name="入场"
                />
                <Line
                  type="monotone"
                  dataKey="exit"
                  stroke={chartColors.exit}
                  strokeWidth={2}
                  dot={false}
                  name="出场"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 p-5">
          <h3 className="text-base font-semibold text-white">分区余位</h3>
          <div className="mt-4 space-y-4">
            {zoneStats.map((zone) => {
              const percent = ((zone.occupied / zone.total) * 100).toFixed(0);
              return (
                <div key={zone.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{zone.name}</span>
                    <span className="text-slate-400">
                      {zone.available}/{zone.total}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="rounded-xl bg-slate-800/50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">近7天收入趋势</h3>
            <span className="flex items-center gap-1 text-xs text-emerald-400">
              <TrendingUp className="h-4 w-4" />
              增长 8.5%
            </span>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [formatCurrency(value), '收入']}
                />
                <Bar dataKey="revenue" fill={chartColors.revenue} radius={[4, 4, 0, 0]} name="收入" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">近7天订单量</h3>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  formatter={(value: number) => [value, '订单数']}
                />
                <Bar dataKey="orders" fill={chartColors.orders} radius={[4, 4, 0, 0]} name="订单数" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
