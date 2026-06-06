import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, Users, Clock, Download } from 'lucide-react';
import { useParkingStore } from '@/store/useParkingStore';
import { formatCurrency } from '@/utils/format';

export const Reports: React.FC = () => {
  const dailyRevenue = useParkingStore((state) => state.dailyRevenue);
  const hourlyTraffic = useParkingStore((state) => state.hourlyTraffic);
  const zoneStats = useParkingStore((state) => state.zoneStats);
  const orders = useParkingStore((state) => state.orders);

  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');

  const totalRevenue = dailyRevenue.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = dailyRevenue.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const peakHours = hourlyTraffic
    .map((h, i) => ({ hour: h.hour, total: h.entry + h.exit, index: i }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const pieData = zoneStats.map((z) => ({
    name: z.name,
    value: z.occupied,
  }));

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  const statusDistribution = [
    { name: '已支付', value: orders.filter((o) => o.status === 'paid').length, color: '#10B981' },
    { name: '待支付', value: orders.filter((o) => o.status === 'pending').length, color: '#F59E0B' },
    { name: '异常', value: orders.filter((o) => o.status === 'abnormal').length, color: '#EF4444' },
    { name: '已退款', value: orders.filter((o) => o.status === 'refunded').length, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">数据报表</h1>
          <p className="mt-1 text-sm text-slate-400">停车场运营数据分析</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-700 bg-slate-800/50">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p === 'day' ? '今日' : p === 'week' ? '本周' : '本月'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700">
            <Download className="h-4 w-4" />
            导出报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-800/20 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">总收入</p>
              <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="rounded-lg bg-blue-600/30 p-3">
              <TrendingUp className="h-6 w-6 text-blue-400" />
            </div>
          </div>
          <p className="mt-2 text-xs text-emerald-400">↑ 12.5% 较上期</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">总订单</p>
              <p className="mt-2 text-2xl font-bold text-white">{totalOrders}</p>
            </div>
            <div className="rounded-lg bg-emerald-600/30 p-3">
              <Users className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
          <p className="mt-2 text-xs text-emerald-400">↑ 8.3% 较上期</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-orange-600/20 to-orange-800/20 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">客单价</p>
              <p className="mt-2 text-2xl font-bold text-white">{formatCurrency(avgOrderValue)}</p>
            </div>
            <div className="rounded-lg bg-orange-600/30 p-3">
              <TrendingUp className="h-6 w-6 text-orange-400" />
            </div>
          </div>
          <p className="mt-2 text-xs text-emerald-400">↑ 3.8% 较上期</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-800/20 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">高峰时段</p>
              <p className="mt-2 text-2xl font-bold text-white">{peakHours[0]?.hour || '-'}</p>
            </div>
            <div className="rounded-lg bg-purple-600/30 p-3">
              <Clock className="h-6 w-6 text-purple-400" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">车流最高峰时段</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-xl bg-slate-800/50 p-5">
          <h3 className="text-base font-semibold text-white">收入趋势</h3>
          <div className="mt-4 h-72">
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
                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="收入" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 p-5">
          <h3 className="text-base font-semibold text-white">订单状态分布</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-sm text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-xl bg-slate-800/50 p-5">
          <h3 className="text-base font-semibold text-white">24小时车流量分析</h3>
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
                <Legend
                  formatter={(value) => <span className="text-sm text-slate-300">{value}</span>}
                />
                <Line type="monotone" dataKey="entry" stroke="#3B82F6" strokeWidth={2} dot={false} name="入场" />
                <Line type="monotone" dataKey="exit" stroke="#10B981" strokeWidth={2} dot={false} name="出场" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl bg-slate-800/50 p-5">
          <h3 className="text-base font-semibold text-white">区域车位占用率</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-sm text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-slate-800/50 p-5">
        <h3 className="text-base font-semibold text-white">高峰时段TOP3</h3>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {peakHours.map((peak, index) => (
            <div
              key={peak.hour}
              className="rounded-lg border border-slate-700 p-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg font-bold ${
                    index === 0
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : index === 1
                      ? 'bg-slate-400/20 text-slate-300'
                      : 'bg-orange-700/20 text-orange-400'
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-white">{peak.hour}</p>
                  <p className="text-xs text-slate-400">总车流量 {peak.total} 辆</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
