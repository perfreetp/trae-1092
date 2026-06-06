import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  TrendingUp,
  Users,
  Clock,
  Download,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
  HardDrive,
  MessageSquare,
  MapPin,
  Building,
  Car,
  ArrowRight,
} from 'lucide-react';
import { useParkingStore } from '@/store/useParkingStore';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { PARKING_ZONES } from '@/utils/constants';
import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  endOfWeek,
  endOfMonth,
  isWithinInterval,
  parseISO,
  format,
} from 'date-fns';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const dailyRevenue = useParkingStore((state) => state.dailyRevenue);
  const hourlyTraffic = useParkingStore((state) => state.hourlyTraffic);
  const zoneStats = useParkingStore((state) => state.zoneStats);
  const orders = useParkingStore((state) => state.orders);
  const tickets = useParkingStore((state) => state.tickets);
  const devices = useParkingStore((state) => state.devices);

  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState(
    format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
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
      const date = parseISO(d.date + '/' + new Date().getFullYear());
      const dateInRange = isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      const zoneMatch = zoneFilter === 'all' || d.zone === zoneFilter;
      return dateInRange && zoneMatch;
    });
  }, [dailyRevenue, dateRange, zoneFilter]);

  const aggregatedRevenue = useMemo(() => {
    const dateMap = new Map<string, { revenue: number; orders: number; entryTraffic: number; exitTraffic: number }>();
    filteredRevenue.forEach((d) => {
      const existing = dateMap.get(d.date) || { revenue: 0, orders: 0, entryTraffic: 0, exitTraffic: 0 };
      dateMap.set(d.date, {
        revenue: existing.revenue + d.revenue,
        orders: existing.orders + d.orders,
        entryTraffic: existing.entryTraffic + (d.entryTraffic || 0),
        exitTraffic: existing.exitTraffic + (d.exitTraffic || 0),
      });
    });
    return Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRevenue]);

  const filteredTraffic = useMemo(() => {
    return hourlyTraffic.filter((t) => {
      const date = parseISO(t.date + '/' + new Date().getFullYear());
      const dateInRange = isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      const zoneMatch = zoneFilter === 'all' || t.zone === zoneFilter;
      return dateInRange && zoneMatch;
    });
  }, [hourlyTraffic, dateRange, zoneFilter]);

  const aggregatedTraffic = useMemo(() => {
    const hourMap = new Map<string, { entry: number; exit: number }>();
    filteredTraffic.forEach((t) => {
      const existing = hourMap.get(t.hour) || { entry: 0, exit: 0 };
      hourMap.set(t.hour, {
        entry: existing.entry + t.entry,
        exit: existing.exit + t.exit,
      });
    });
    return Array.from(hourMap.entries())
      .map(([hour, data]) => ({ hour, ...data, total: data.entry + data.exit }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [filteredTraffic]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const date = parseISO(o.paidAt || o.createdAt);
      const dateInRange = isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      const zoneMatch = zoneFilter === 'all' || o.zone === zoneFilter;
      const floorMatch = floorFilter === 'all' || o.floor === floorFilter;
      return dateInRange && zoneMatch && floorMatch;
    });
  }, [orders, dateRange, zoneFilter, floorFilter]);

  const totalRevenue = aggregatedRevenue.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = aggregatedRevenue.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalEntryTraffic = aggregatedRevenue.reduce((sum, d) => sum + d.entryTraffic, 0);
  const totalExitTraffic = aggregatedRevenue.reduce((sum, d) => sum + d.exitTraffic, 0);
  const totalTraffic = totalEntryTraffic + totalExitTraffic;

  const peakHours = aggregatedTraffic
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const abnormalOrdersCount = filteredOrders.filter((o) => o.status === 'abnormal').length;
  const pendingOrdersCount = filteredOrders.filter((o) => o.status === 'pending').length;
  const offlineDevicesCount = devices.filter((d) => d.status !== 'online').length;
  const openTicketsCount = tickets.filter((t) => t.status !== 'closed' && t.status !== 'resolved').length;

  const pieData = zoneStats
    .filter((z) => zoneFilter === 'all' || z.name === zoneFilter + '区')
    .map((z) => ({
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

  const generateFullReport = () => {
    const periodLabels = { day: '今日', week: '本周', month: '本月', custom: '自定义' };
    const zoneLabel = zoneFilter === 'all' ? '全部车场' : zoneFilter + '区';
    const floorLabel = floorFilter === 'all' ? '全部楼层' : floorFilter;

    const reportLines: string[] = [];
    reportLines.push('========================================');
    reportLines.push('          停车场运营报表');
    reportLines.push('========================================');
    reportLines.push(`生成时间: ${formatDateTime(new Date().toISOString())}`);
    reportLines.push(`统计周期: ${periodLabels[period]} (${format(dateRange.start, 'yyyy-MM-dd')} 至 ${format(dateRange.end, 'yyyy-MM-dd')})`);
    reportLines.push(`分区筛选: ${zoneLabel}`);
    reportLines.push(`楼层筛选: ${floorLabel}`);
    reportLines.push('');
    reportLines.push('【运营指标汇总】');
    reportLines.push(`总收入: ${formatCurrency(totalRevenue)}`);
    reportLines.push(`总订单数: ${totalOrders} 笔`);
    reportLines.push(`客单价: ${formatCurrency(avgOrderValue)}`);
    reportLines.push(`入场车流量: ${totalEntryTraffic} 辆`);
    reportLines.push(`出场车流量: ${totalExitTraffic} 辆`);
    reportLines.push(`总车流量: ${totalTraffic} 辆`);
    reportLines.push('');
    reportLines.push('【异常经营指标】');
    reportLines.push(`异常订单数: ${abnormalOrdersCount} 笔`);
    reportLines.push(`未支付订单数: ${pendingOrdersCount} 笔`);
    reportLines.push(`设备离线/故障数: ${offlineDevicesCount} 台`);
    reportLines.push(`未关闭工单数: ${openTicketsCount} 单`);
    reportLines.push('');
    reportLines.push('【每日收入明细】');
    reportLines.push('日期,收入(元),订单数,入场车流,出场车流');
    aggregatedRevenue.forEach((d) => {
      reportLines.push(`${d.date},${d.revenue.toFixed(2)},${d.orders},${d.entryTraffic},${d.exitTraffic}`);
    });
    reportLines.push('');
    reportLines.push('【24小时车流量分布】');
    reportLines.push('时段,入场,出场,总车流');
    aggregatedTraffic.forEach((t) => {
      reportLines.push(`${t.hour},${t.entry},${t.exit},${t.total}`);
    });
    reportLines.push('');
    reportLines.push('【高峰时段 TOP3】');
    peakHours.forEach((p, i) => {
      reportLines.push(`${i + 1}. ${p.hour} - 总车流 ${p.total} 辆`);
    });
    reportLines.push('');
    reportLines.push('【订单明细】');
    reportLines.push('订单号,车牌号,入场时间,出场时间,应收金额,实付金额,优惠券,状态,支付时间,分区,楼层');
    filteredOrders.forEach((o) => {
      reportLines.push(
        `${o.id},${o.plateNumber},${formatDateTime(o.entryTime)},${formatDateTime(o.exitTime)},` +
        `${o.totalAmount.toFixed(2)},${o.paidAmount?.toFixed(2) || '0.00'},${o.couponCode || '-'},` +
        `${o.status},${o.paidAt ? formatDateTime(o.paidAt) : '-'},${o.zone || '-'},${o.floor || '-'}`
      );
    });
    reportLines.push('');
    reportLines.push('========================================');
    reportLines.push('          报表结束');
    reportLines.push('========================================');

    const csvContent = '\ufeff' + reportLines.join('\n');
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = `${format(dateRange.start, 'yyyyMMdd')}-${format(dateRange.end, 'yyyyMMdd')}`;
    link.href = url;
    link.setAttribute('download', `停车运营完整报表_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showMessage('success', '完整报表导出成功');
  };

  const generateOrdersCSV = () => {
    const headers = [
      '订单号',
      '车牌号',
      '入场时间',
      '出场时间',
      '应收金额',
      '实付金额',
      '优惠券',
      '状态',
      '支付时间',
      '分区',
      '楼层',
    ];
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
      o.zone || '-',
      o.floor || '-',
    ]);

    const csvContent = '\ufeff' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
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

  const navigateTo = (path: string, status?: string) => {
    if (status) {
      navigate(path, { state: { filterStatus: status } });
    } else {
      navigate(path);
    }
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
                  period === p ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
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
            <div className="absolute right-0 top-full mt-1 hidden w-48 rounded-lg border border-slate-700 bg-slate-800 py-1 group-hover:block z-10">
              <button
                onClick={generateFullReport}
                className="w-full px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-700"
              >
                导出完整报表
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
            message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 rounded-xl bg-slate-800/50 p-4">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">车场:</span>
          <select
            value={zoneFilter}
            onChange={(e) => setZoneFilter(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-700 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">全部车场</option>
            {PARKING_ZONES.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} ({z.floor})
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-400">楼层:</span>
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-700 px-2 py-1 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">全部楼层</option>
            <option value="B1">B1层</option>
            <option value="B2">B2层</option>
          </select>
        </div>
        <div className="col-span-2 flex items-center gap-2 text-xs text-slate-400">
          <span>当前筛选:</span>
          <span className="rounded bg-blue-500/20 px-2 py-0.5 text-blue-400">
            {format(dateRange.start, 'yyyy-MM-dd')} 至 {format(dateRange.end, 'yyyy-MM-dd')}
          </span>
          <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-emerald-400">
            {aggregatedRevenue.length} 天数据
          </span>
          <span className="rounded bg-purple-500/20 px-2 py-0.5 text-purple-400">
            {filteredOrders.length} 条订单
          </span>
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
              <p className="text-sm text-slate-400">总车流量</p>
              <p className="mt-2 text-2xl font-bold text-white">{totalTraffic}</p>
            </div>
            <div className="rounded-lg bg-orange-600/30 p-3">
              <Car className="h-6 w-6 text-orange-400" />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            入 {totalEntryTraffic} / 出 {totalExitTraffic}
          </p>
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
          <p className="mt-2 text-xs text-slate-400">车流最高峰 {peakHours[0]?.total || 0} 辆</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div
          onClick={() => navigateTo('/orders', 'abnormal')}
          className="cursor-pointer rounded-xl border border-red-500/30 bg-red-500/10 p-4 transition-colors hover:bg-red-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-400">异常订单</p>
              <p className="mt-1 text-2xl font-bold text-red-300">{abnormalOrdersCount}</p>
            </div>
            <div className="rounded-lg bg-red-500/20 p-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
            <span>查看详情</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
        <div
          onClick={() => navigateTo('/orders', 'pending')}
          className="cursor-pointer rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 transition-colors hover:bg-yellow-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-400">待支付订单</p>
              <p className="mt-1 text-2xl font-bold text-yellow-300">{pendingOrdersCount}</p>
            </div>
            <div className="rounded-lg bg-yellow-500/20 p-2">
              <CreditCard className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-yellow-400">
            <span>查看详情</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
        <div
          onClick={() => navigateTo('/devices')}
          className="cursor-pointer rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 transition-colors hover:bg-orange-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-400">设备异常</p>
              <p className="mt-1 text-2xl font-bold text-orange-300">{offlineDevicesCount}</p>
            </div>
            <div className="rounded-lg bg-orange-500/20 p-2">
              <HardDrive className="h-5 w-5 text-orange-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-orange-400">
            <span>查看详情</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
        <div
          onClick={() => navigateTo('/tickets', 'pending')}
          className="cursor-pointer rounded-xl border border-purple-500/30 bg-purple-500/10 p-4 transition-colors hover:bg-purple-500/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-400">待处理工单</p>
              <p className="mt-1 text-2xl font-bold text-purple-300">{openTicketsCount}</p>
            </div>
            <div className="rounded-lg bg-purple-500/20 p-2">
              <MessageSquare className="h-5 w-5 text-purple-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-purple-400">
            <span>查看详情</span>
            <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 rounded-xl bg-slate-800/50 p-5">
          <h3 className="text-base font-semibold text-white">收入趋势</h3>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregatedRevenue}>
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
              <LineChart data={aggregatedTraffic}>
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
                <Legend formatter={(value) => <span className="text-sm text-slate-300">{value}</span>} />
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
            <div key={peak.hour} className="rounded-lg border border-slate-700 p-4">
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
                  <p className="text-xs text-slate-400">
                    入场 {peak.entry} / 出场 {peak.exit} / 总计 {peak.total} 辆
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
