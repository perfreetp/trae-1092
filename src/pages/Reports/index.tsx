import React, { useState, useMemo, useEffect } from 'react';
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
  X,
  Save,
  Trash2,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Zap,
  BarChart3,
  Eye,
  ExternalLink,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useParkingStore } from '@/store/useParkingStore';
import { formatCurrency, formatDateTime } from '@/utils/format';
import { PARKING_ZONES } from '@/utils/constants';
import { Order, VehicleRecord } from '@/types';
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
  subDays,
} from 'date-fns';

interface DrillDownData {
  type: 'date' | 'hour' | 'peak';
  title: string;
  date?: string;
  hour?: string;
}

interface SavedFilter {
  id: string;
  name: string;
  period: 'day' | 'week' | 'month' | 'custom';
  customStartDate: string;
  customEndDate: string;
  zoneFilter: string;
  floorFilter: string;
}

interface AlertItem {
  id: string;
  type: 'device' | 'pending' | 'occupancy' | 'revenue';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  zone?: string;
  floor?: string;
  ticketId?: string;
}

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const dailyRevenue = useParkingStore((state) => state.dailyRevenue);
  const hourlyTraffic = useParkingStore((state) => state.hourlyTraffic);
  const zoneStats = useParkingStore((state) => state.zoneStats);
  const orders = useParkingStore((state) => state.orders);
  const tickets = useParkingStore((state) => state.tickets);
  const devices = useParkingStore((state) => state.devices);
  const vehicleRecords = useParkingStore((state) => state.vehicleRecords);
  const createTicketFromOrder = useParkingStore((state) => state.createTicketFromOrder);

  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState(
    format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [drillDown, setDrillDown] = useState<DrillDownData | null>(null);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [showFilterList, setShowFilterList] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [showAlertsPanel, setShowAlertsPanel] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem('parking_report_filters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

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

  const parseMmDdDate = (dateStr: string): Date => {
    const [month, day] = dateStr.split('/').map(Number);
    const year = new Date().getFullYear();
    return new Date(year, month - 1, day);
  };

  const getZoneFloor = (zoneId: string): string | undefined => {
    const zone = PARKING_ZONES.find((z) => z.id === zoneId);
    return zone?.floor;
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const date = parseISO(o.paidAt || o.createdAt);
      const dateInRange = isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      const zoneMatch = zoneFilter === 'all' || o.zone === zoneFilter;
      const floorMatch = floorFilter === 'all' || o.floor === floorFilter;
      return dateInRange && zoneMatch && floorMatch;
    });
  }, [orders, dateRange, zoneFilter, floorFilter]);

  const filteredRevenue = useMemo(() => {
    return dailyRevenue.filter((d) => {
      const date = parseMmDdDate(d.date);
      const dateInRange = isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      const zoneMatch = zoneFilter === 'all' || d.zone === zoneFilter;
      const zoneFloor = getZoneFloor(d.zone || '');
      const floorMatch = floorFilter === 'all' || zoneFloor === floorFilter;
      return dateInRange && zoneMatch && floorMatch;
    });
  }, [dailyRevenue, dateRange, zoneFilter, floorFilter]);

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

    filteredOrders.forEach((o) => {
      if (o.status === 'paid' && o.paidAt) {
        const dateStr = format(parseISO(o.paidAt), 'MM/dd');
        const existing = dateMap.get(dateStr) || { revenue: 0, orders: 0, entryTraffic: 0, exitTraffic: 0 };
        dateMap.set(dateStr, {
          revenue: existing.revenue + o.paidAmount,
          orders: existing.orders + 1,
          entryTraffic: existing.entryTraffic,
          exitTraffic: existing.exitTraffic + 1,
        });
      }
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredRevenue, filteredOrders]);

  const filteredTraffic = useMemo(() => {
    return hourlyTraffic.filter((t) => {
      const date = parseMmDdDate(t.date);
      const dateInRange = isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      const zoneMatch = zoneFilter === 'all' || t.zone === zoneFilter;
      const zoneFloor = getZoneFloor(t.zone || '');
      const floorMatch = floorFilter === 'all' || zoneFloor === floorFilter;
      return dateInRange && zoneMatch && floorMatch;
    });
  }, [hourlyTraffic, dateRange, zoneFilter, floorFilter]);

  const aggregatedTraffic = useMemo(() => {
    const hourMap = new Map<string, { entry: number; exit: number }>();
    filteredTraffic.forEach((t) => {
      const existing = hourMap.get(t.hour) || { entry: 0, exit: 0 };
      hourMap.set(t.hour, {
        entry: existing.entry + t.entry,
        exit: existing.exit + t.exit,
      });
    });

    filteredOrders.forEach((o) => {
      if (o.status === 'paid' && o.paidAt) {
        const hour = format(parseISO(o.paidAt), 'HH') + ':00';
        const existing = hourMap.get(hour) || { entry: 0, exit: 0 };
        hourMap.set(hour, {
          entry: existing.entry,
          exit: existing.exit + 1,
        });
      }
    });

    return Array.from(hourMap.entries())
      .map(([hour, data]) => ({ hour, ...data, total: data.entry + data.exit }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [filteredTraffic, filteredOrders]);

  const totalRevenue = filteredOrders
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + o.paidAmount, 0);
  const totalOrders = filteredOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalEntryTraffic = aggregatedRevenue.reduce((sum, d) => sum + d.entryTraffic, 0);
  const totalExitTraffic = aggregatedRevenue.reduce((sum, d) => sum + d.exitTraffic, 0);
  const totalTraffic = totalEntryTraffic + totalExitTraffic;

  const peakHours = [...aggregatedTraffic]
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  const abnormalOrdersCount = filteredOrders.filter((o) => o.status === 'abnormal').length;
  const pendingOrdersCount = filteredOrders.filter((o) => o.status === 'pending').length;
  const offlineDevicesCount = devices.filter((d) => d.status !== 'online').length;
  const openTicketsCount = tickets.filter((t) => t.status !== 'closed' && t.status !== 'resolved').length;

  const pieData = zoneStats
    .filter((z) => {
      const zoneId = z.name.replace('区', '');
      const zoneMatch = zoneFilter === 'all' || zoneId === zoneFilter;
      const zoneFloor = getZoneFloor(zoneId);
      const floorMatch = floorFilter === 'all' || zoneFloor === floorFilter;
      return zoneMatch && floorMatch;
    })
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

  useEffect(() => {
    const newAlerts: AlertItem[] = [];

    const offlineDevices = devices.filter((d) => d.status !== 'online');
    if (offlineDevices.length > 0) {
      offlineDevices.forEach((d) => {
        newAlerts.push({
          id: `device-${d.id}`,
          type: 'device',
          title: `设备异常：${d.name}`,
          description: `${d.location} 的${d.type === 'gate' ? '道闸' : '摄像机'}${d.status === 'offline' ? '离线' : '故障'}`,
          severity: 'high',
          zone: d.zone,
          floor: d.floor,
          ticketId: d.ticketId,
        });
      });
    }

    if (pendingOrdersCount > 10) {
      newAlerts.push({
        id: 'pending-orders',
        type: 'pending',
        title: '待支付订单过多',
        description: `当前有 ${pendingOrdersCount} 笔待支付订单，超过阈值`,
        severity: 'medium',
      });
    }

    zoneStats.forEach((z) => {
      const zoneId = z.name.replace('区', '');
      const zoneFloor = getZoneFloor(zoneId);
      const floorMatch = floorFilter === 'all' || zoneFloor === floorFilter;
      const zoneMatch = zoneFilter === 'all' || zoneId === zoneFilter;
      if (floorMatch && zoneMatch && z.occupied / z.total > 0.9) {
        newAlerts.push({
          id: `occupancy-${zoneId}`,
          type: 'occupancy',
          title: `${z.name} 车位占用率过高`,
          description: `当前占用率 ${Math.round(z.occupied / z.total * 100)}%，接近饱和`,
          severity: 'medium',
          zone: zoneId,
          floor: zoneFloor,
        });
      }
    });

    if (aggregatedRevenue.length >= 2) {
      const recent = aggregatedRevenue.slice(-3);
      const earlier = aggregatedRevenue.slice(-6, -3);
      if (recent.length > 0 && earlier.length > 0) {
        const recentAvg = recent.reduce((s, d) => s + d.revenue, 0) / recent.length;
        const earlierAvg = earlier.reduce((s, d) => s + d.revenue, 0) / earlier.length;
        if (earlierAvg > 0 && (recentAvg - earlierAvg) / earlierAvg < -0.2) {
          newAlerts.push({
            id: 'revenue-drop',
            type: 'revenue',
            title: '收入明显下降',
            description: `近3日平均收入较上一周期下降 ${Math.round((1 - recentAvg / earlierAvg) * 100)}%`,
            severity: 'high',
          });
        }
      }
    }

    setAlerts(newAlerts);
  }, [devices, pendingOrdersCount, zoneStats, aggregatedRevenue, floorFilter, zoneFilter, getZoneFloor]);

  const drillDownOrders = useMemo(() => {
    if (!drillDown) return [];
    
    if (drillDown.type === 'date' && drillDown.date) {
      const targetDate = parseMmDdDate(drillDown.date);
      return filteredOrders.filter((o) => {
        const orderDate = parseISO(o.paidAt || o.createdAt);
        return format(orderDate, 'MM/dd') === drillDown.date;
      });
    }
    
    if (drillDown.type === 'hour' && drillDown.hour) {
      return filteredOrders.filter((o) => {
        if (!o.paidAt) return false;
        const hour = format(parseISO(o.paidAt), 'HH') + ':00';
        return hour === drillDown.hour;
      });
    }

    if (drillDown.type === 'peak' && drillDown.hour) {
      return filteredOrders.filter((o) => {
        if (!o.paidAt) return false;
        const hour = format(parseISO(o.paidAt), 'HH') + ':00';
        return hour === drillDown.hour;
      });
    }

    return [];
  }, [drillDown, filteredOrders]);

  const drillDownVehicles = useMemo(() => {
    if (!drillDown) return [];
    
    return vehicleRecords.filter((v) => {
      const inZone = zoneFilter === 'all' || v.zone === zoneFilter;
      const inFloor = floorFilter === 'all' || v.floor === floorFilter;
      if (!inZone || !inFloor) return false;

      if (drillDown.type === 'date' && drillDown.date) {
        const targetDate = parseMmDdDate(drillDown.date);
        const entryDate = parseISO(v.entryTime);
        return isWithinInterval(entryDate, { 
          start: startOfDay(targetDate), 
          end: endOfDay(targetDate) 
        });
      }

      return false;
    });
  }, [drillDown, vehicleRecords, zoneFilter, floorFilter]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const navigateTo = (path: string, status?: string) => {
    if (status) {
      navigate(path, { state: { filterStatus: status } });
    } else {
      navigate(path);
    }
  };

  const handleSaveFilter = () => {
    if (!newFilterName.trim()) {
      showMessage('error', '请输入方案名称');
      return;
    }
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: newFilterName.trim(),
      period,
      customStartDate,
      customEndDate,
      zoneFilter,
      floorFilter,
    };
    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    sessionStorage.setItem('parking_report_filters', JSON.stringify(updated));
    setNewFilterName('');
    setShowSaveFilterModal(false);
    showMessage('success', '筛选方案已保存');
  };

  const handleLoadFilter = (filter: SavedFilter) => {
    setPeriod(filter.period);
    setCustomStartDate(filter.customStartDate);
    setCustomEndDate(filter.customEndDate);
    setZoneFilter(filter.zoneFilter);
    setFloorFilter(filter.floorFilter);
    setShowFilterList(false);
    showMessage('success', `已应用方案：${filter.name}`);
  };

  const handleDeleteFilter = (id: string) => {
    const updated = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(updated);
    sessionStorage.setItem('parking_report_filters', JSON.stringify(updated));
    showMessage('success', '方案已删除');
  };

  const handleCreateTicketFromAlert = (alert: AlertItem) => {
    if (alert.type === 'device') {
      const device = devices.find((d) => d.id === alert.id.replace('device-', ''));
      if (device) {
        const ticket = createTicketFromOrder(device.id);
        if (ticket) {
          showMessage('success', `工单 ${ticket.id} 已创建`);
        }
      }
    }
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
    reportLines.push(`总订单数: ${totalOrders} 笔（其中已支付：${filteredOrders.filter(o => o.status === 'paid').length} 笔）`);
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

    if (alerts.length > 0) {
      reportLines.push('【经营异常提醒】');
      alerts.forEach((a, i) => {
        reportLines.push(`${i + 1}. [${a.severity === 'high' ? '高' : a.severity === 'medium' ? '中' : '低'}] ${a.title} - ${a.description}`);
      });
      reportLines.push('');
    }

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

    if (drillDown) {
      reportLines.push(`【下钻明细 - ${drillDown.title}】`);
      if (drillDownOrders.length > 0) {
        reportLines.push('--- 关联订单 ---');
        reportLines.push('订单号,车牌号,入场时间,出场时间,应收金额,实付金额,状态,支付时间,分区,楼层');
        drillDownOrders.forEach((o) => {
          reportLines.push(
            `${o.id},${o.plateNumber},${formatDateTime(o.entryTime)},${formatDateTime(o.exitTime)},` +
            `${o.totalAmount.toFixed(2)},${o.paidAmount?.toFixed(2) || '0.00'},` +
            `${o.status},${o.paidAt ? formatDateTime(o.paidAt) : '-'},${o.zone || '-'},${o.floor || '-'}`
          );
        });
      }
      if (drillDownVehicles.length > 0) {
        reportLines.push('--- 关联车辆 ---');
        reportLines.push('车牌号,入场时间,出场时间,状态,分区,楼层');
        drillDownVehicles.forEach((v) => {
          reportLines.push(
            `${v.plateNumber},${formatDateTime(v.entryTime)},${v.exitTime ? formatDateTime(v.exitTime) : '-'},` +
            `${v.status},${v.zone || '-'},${v.floor || '-'}`
          );
        });
      }
      reportLines.push('');
    }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">数据报表</h1>
          <p className="mt-1 text-sm text-slate-400">停车场运营数据分析</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <button 
              onClick={() => setShowFilterList(!showFilterList)}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700"
            >
              <FolderOpen className="h-4 w-4" />
              筛选方案
              {savedFilters.length > 0 && (
                <span className="rounded-full bg-blue-500 px-1.5 text-xs">{savedFilters.length}</span>
              )}
            </button>
            {showFilterList && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-lg border border-slate-700 bg-slate-800 py-1 z-20">
                {savedFilters.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-slate-500">暂无保存的方案</div>
                ) : (
                  savedFilters.map((f) => (
                    <div key={f.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-700">
                      <button 
                        onClick={() => handleLoadFilter(f)}
                        className="flex-1 text-left text-sm text-slate-300"
                      >
                        {f.name}
                      </button>
                      <button
                        onClick={() => handleDeleteFilter(f.id)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowSaveFilterModal(true)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700"
          >
            <Save className="h-4 w-4" />
            保存方案
          </button>
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

      {alerts.length > 0 && showAlertsPanel && (
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-400" />
              <h3 className="font-semibold text-orange-300">经营异常提醒 ({alerts.length})</h3>
            </div>
            <button 
              onClick={() => setShowAlertsPanel(false)}
              className="text-slate-500 hover:text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {alerts.slice(0, 4).map((alert) => (
              <div 
                key={alert.id} 
                className={`rounded-lg border p-3 ${
                  alert.severity === 'high' 
                    ? 'border-red-500/30 bg-red-500/10' 
                    : alert.severity === 'medium'
                    ? 'border-yellow-500/30 bg-yellow-500/10'
                    : 'border-blue-500/30 bg-blue-500/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-medium ${
                      alert.severity === 'high' ? 'text-red-400' : alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {alert.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{alert.description}</p>
                    {(alert.zone || alert.floor) && (
                      <p className="mt-1 text-xs text-slate-500">
                        {alert.zone && `${alert.zone}区`} {alert.floor && `(${alert.floor})`}
                      </p>
                    )}
                  </div>
                  {!alert.ticketId && (
                    <button
                      onClick={() => handleCreateTicketFromAlert(alert)}
                      className="flex items-center gap-1 rounded bg-slate-700/50 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                    >
                      <Plus className="h-3 w-3" />
                      工单
                    </button>
                  )}
                  {alert.ticketId && (
                    <span className="text-xs text-purple-400 font-mono">{alert.ticketId}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
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
          <p className="mt-2 text-xs text-emerald-400">
            已支付 {filteredOrders.filter(o => o.status === 'paid').length} 笔
          </p>
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
          <p className="mt-2 text-xs text-slate-400">
            客单价 {formatCurrency(avgOrderValue)}
          </p>
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
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">收入趋势</h3>
            <span className="text-xs text-slate-500">点击柱子查看当日明细</span>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={aggregatedRevenue}
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload[0]) {
                    const item = data.activePayload[0].payload;
                    setDrillDown({
                      type: 'date',
                      title: `${item.date} 收入明细`,
                      date: item.date,
                    });
                  }
                }}
              >
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
                  cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
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
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">24小时车流量分析</h3>
            <span className="text-xs text-slate-500">点击折线查看时段明细</span>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={aggregatedTraffic}
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload[0]) {
                    const item = data.activePayload[0].payload;
                    setDrillDown({
                      type: 'hour',
                      title: `${item.hour} 车流量明细`,
                      hour: item.hour,
                    });
                  }
                }}
              >
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
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">高峰时段TOP3</h3>
          <span className="text-xs text-slate-500">点击卡片查看时段明细</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {peakHours.map((peak, index) => (
            <div 
              key={peak.hour} 
              className="cursor-pointer rounded-lg border border-slate-700 p-4 transition-colors hover:border-blue-500/50 hover:bg-slate-700/30"
              onClick={() => setDrillDown({
                type: 'peak',
                title: `高峰时段 ${peak.hour} 明细`,
                hour: peak.hour,
              })}
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
                  <p className="text-xs text-slate-400">
                    入场 {peak.entry} / 出场 {peak.exit} / 总计 {peak.total} 辆
                  </p>
                </div>
                <Eye className="h-4 w-4 text-slate-500 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {drillDown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[700px] max-h-[80vh] rounded-xl bg-slate-800 p-6 overflow-hidden flex flex-col animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{drillDown.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  当前筛选：{zoneFilter === 'all' ? '全部车场' : zoneFilter + '区'} / {floorFilter === 'all' ? '全部楼层' : floorFilter}
                </p>
              </div>
              <button
                onClick={() => setDrillDown(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {drillDownOrders.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    关联订单 ({drillDownOrders.length})
                  </h4>
                  <div className="rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">订单号</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">车牌号</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">金额</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">状态</th>
                          <th className="px-3 py-2 text-right text-xs text-slate-400">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {drillDownOrders.slice(0, 10).map((o) => (
                          <tr key={o.id} className="hover:bg-slate-700/30">
                            <td className="px-3 py-2 font-mono text-xs text-white">{o.id}</td>
                            <td className="px-3 py-2 text-xs text-slate-300">{o.plateNumber}</td>
                            <td className="px-3 py-2 text-xs text-white">{formatCurrency(o.paidAmount)}</td>
                            <td className="px-3 py-2">
                              <span className={`text-xs ${
                                o.status === 'paid' ? 'text-emerald-400' : 
                                o.status === 'pending' ? 'text-yellow-400' : 
                                o.status === 'abnormal' ? 'text-red-400' : 'text-slate-400'
                              }`}>
                                {o.status === 'paid' ? '已支付' : o.status === 'pending' ? '待支付' : o.status === 'abnormal' ? '异常' : '已退款'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => navigate('/orders', { state: { highlightOrder: o.id } })}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-end"
                              >
                                查看 <ExternalLink className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {drillDownOrders.length > 10 && (
                      <div className="px-3 py-2 text-center text-xs text-slate-500 border-t border-slate-700/50">
                        还有 {drillDownOrders.length - 10} 条订单，请导出查看完整明细
                      </div>
                    )}
                  </div>
                </div>
              )}

              {drillDownVehicles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Car className="h-4 w-4 text-emerald-400" />
                    关联车辆记录 ({drillDownVehicles.length})
                  </h4>
                  <div className="rounded-lg border border-slate-700 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700/50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">车牌号</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">入场时间</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">状态</th>
                          <th className="px-3 py-2 text-left text-xs text-slate-400">区域</th>
                          <th className="px-3 py-2 text-right text-xs text-slate-400">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {drillDownVehicles.slice(0, 10).map((v) => (
                          <tr key={v.id} className="hover:bg-slate-700/30">
                            <td className="px-3 py-2 text-xs text-white">{v.plateNumber}</td>
                            <td className="px-3 py-2 text-xs text-slate-300">{formatDateTime(v.entryTime).slice(5, 16)}</td>
                            <td className="px-3 py-2">
                              <span className={`text-xs ${v.status === 'parking' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {v.status === 'parking' ? '停车中' : '已离场'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-xs text-slate-300">
                              {v.zone ? `${v.zone}区 (${v.floor})` : '-'}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                onClick={() => navigate('/vehicles')}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-end"
                              >
                                查看 <ExternalLink className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {drillDownOrders.length === 0 && drillDownVehicles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-slate-600" />
                  <p className="mt-3 text-sm text-slate-500">该时段暂无相关数据</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-3 border-t border-slate-700 pt-4">
              <button
                onClick={() => setDrillDown(null)}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                关闭
              </button>
              <button
                onClick={generateFullReport}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                <Download className="h-4 w-4" />
                导出完整报表
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white">保存筛选方案</h3>
            <p className="mt-1 text-sm text-slate-400">保存当前筛选条件以便快速套用</p>
            <div className="mt-4">
              <label className="text-sm text-slate-300">方案名称</label>
              <input
                type="text"
                value={newFilterName}
                onChange={(e) => setNewFilterName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                placeholder="如：本周B1层运营报表"
              />
            </div>
            <div className="mt-4 rounded-lg bg-slate-700/50 p-3 text-xs text-slate-400 space-y-1">
              <p>周期：{period === 'day' ? '今日' : period === 'week' ? '本周' : period === 'month' ? '本月' : '自定义'}</p>
              <p>分区：{zoneFilter === 'all' ? '全部车场' : zoneFilter + '区'}</p>
              <p>楼层：{floorFilter === 'all' ? '全部楼层' : floorFilter}</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSaveFilterModal(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleSaveFilter}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
