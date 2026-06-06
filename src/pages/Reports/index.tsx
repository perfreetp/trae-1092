import React, { useState, useMemo } from 'react';
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
import { TrendingUp, Users, Clock, Download, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { useParkingStore } from '@/store/useParkingStore';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth, isWithinInterval, parseISO, format } from 'date-fns';

export const Reports: React.FC = () => {
  const dailyRevenue = useParkingStore((state) => state.dailyRevenue);
  const hourlyTraffic = useParkingStore((state) => state.hourlyTraffic);
  const zoneStats = useParkingStore((state) => state.zoneStats);
  const orders = useParkingStore((state) => state.orders);

  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState(format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    if (period === 'day') {
      start = startOfDay(now);
      end = endOfDay(now);
    } else if (period === 'week') {
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
    } else if (period === 'month') {
      start = startOfMonth(now);
      end = endOfMonth(now);
    } else {
      start = parseISO(customStartDate);
      end = endOfDay(parseISO(customEndDate));
    }

    return { start, end };
  }, [period, customStartDate, customEndDate]);

  const filteredRevenue = useMemo(() => {
    return dailyRevenue.filter((d) => {
      const date = parseISO(d.date);
      return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
    });
  }, [dailyRevenue, dateRange]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const date = parseISO(o.paidAt || o.createdAt);
      return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
    });
  }, [orders, dateRange]);

  const totalRevenue = filteredRevenue.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = filteredRevenue.reduce((sum, d) => sum + d.orders, 0);
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
    { name: '已支付', value: filteredOrders.filter((o) => o.status === 'paid').length, color: '#10B981' },
    { name: '待支付', value: filteredOrders.filter((o) => o.status === 'pending').length, color: '#F59E0B' },
    { name: '异常', value: filteredOrders.filter((o) => o.status === 'abnormal').length, color: '#EF4444' },
    { name: '已退款', value: filteredOrders.filter((o) => o.status === 'refunded').length, color: '#8B5CF6' },
  ];

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const generateCSV = () => {
    const headers = ['日期', '收入', '订单数', '入场车流量', '出场车流量'];
    const revenueMap = new Map(filteredRevenue.map((d) => [d.date, d]));
    
    const rows = filteredRevenue.map((d) => {
      const trafficData = hourlyTraffic.find((_, i) => i < 3) || { entry: 0, exit: 0 };
      return [
        d.date,
        d.revenue.toFixed(2),
        d.orders.toString(),
        '-',
        '-',
      ];
    });

    const csvContent = '\ufeff' + [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = `${format(dateRange.start, 'yyyyMMdd')}-${format(dateRange.end, 'yyyyMMdd')}`;
    link.href = url;
    link.setAttribute('download', `停车运营报表_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showMessage('success', '报表导出成功');
  };

  const generateOrdersCSV = () => {
    const headers = ['订单号', '车牌号', '入场时间', '出场时间', '应收金额', '实付金额', '优惠券', '状态', '支付时间'];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.plateNumber,
      formatDateTime(o.entryTime),
      formatDateTime(o.exitTime || ''),
      o.totalAmount.toFixed(2),
      o.paidAmount?.toFixed(2) || '0.00',
      o.couponCode || '-',
      o.status,
      o.paidAt ? formatDateTime(o.paidAt) : '-',
    ]);

    const csvContent = '\ufeff' + [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = `${format(dateRange.start, 'yyyyMMdd')}-${format(dateRange.end, 'yyyyMMdd')}`;
    link.href = url;
    link.setAttribute('download', `订单明细_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showMessage('success', '订单明细导出成功');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">数据报表</h1>
          <p className="mt-1 text-sm text-slate-400">停车场运营数据分析</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-700 bg-slate-800/50">
            {(['day', 'week', 'month', 'custom'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm transition-colors first:rounded-l-lg last:rounded-r-lg ${
                  period === p
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p === 'day' ? '今日' : p === 'week' ? '本周' : p === 'month' ? '本月' : '自定义'}
              </button>
            ))}
          </div>
          {period === 'custom' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-transparent text-sm text-white outline-none"
                />
              </div>
              <span className="text-slate-400">至</span>
              <div className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-transparent text-sm text-white outline-none"
                />
              </div>
            </div>
          )}
          <div className="relative group">
            <button className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700">
              <Download className="h-4 w-4" />
              导出报表
            </button>
            <div className="absolute right-0 top-full mt-1 hidden w-40 rounded-lg border border-slate-700 bg-slate-800 py-1 group-hover:block z-10">
              <button
                onClick={generateCSV}
                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
              >
                导出汇总报表
              </button>
              <button
                onClick={generateOrdersCSV}
                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
              >
                导出订单明细
              </button>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 ${
            message.type === 'success'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <div className="rounded-lg bg-blue-500/10 px-4 py-2 text-xs text-blue-400">
        当前筛选：{format(dateRange.start, 'yyyy-MM-dd')} 至 {format(dateRange.end, 'yyyy-MM-dd')}，
        共 {filteredRevenue.length} 天数据，{filteredOrders.length} 条订单
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
              <BarChart data={filteredRevenue}>
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
