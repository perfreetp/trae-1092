import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Receipt,
  Tag,
  FileText,
  AlertTriangle,
  Check,
  X,
  Calculator,
  Car,
  Clock,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useParkingStore } from '@/store/useParkingStore';
import { Order, VehicleRecord, BillingCalculation } from '@/types';
import { formatDateTime, formatDuration, formatCurrency, generateRandomId } from '@/utils/format';
import { calculateBilling } from '@/utils/mock';
import { VALID_COUPONS, HOURLY_RATE, MAX_DAILY_RATE, FREE_PARKING_MINUTES } from '@/utils/constants';

export const Orders: React.FC = () => {
  const orders = useParkingStore((state) => state.orders);
  const vehicleRecords = useParkingStore((state) => state.vehicleRecords);
  const tickets = useParkingStore((state) => state.tickets);
  const updateOrder = useParkingStore((state) => state.updateOrder);
  const applyCoupon = useParkingStore((state) => state.applyCoupon);
  const requestInvoice = useParkingStore((state) => state.requestInvoice);
  const markOrderAbnormal = useParkingStore((state) => state.markOrderAbnormal);
  const calculateParkingFee = useParkingStore((state) => state.calculateParkingFee);
  const addOrder = useParkingStore((state) => state.addOrder);
  const payOrder = useParkingStore((state) => state.payOrder);
  const createTicketFromOrder = useParkingStore((state) => state.createTicketFromOrder);
  const updateVehicleRecord = useParkingStore((state) => state.updateVehicleRecord);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAbnormalModal, setShowAbnormalModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [abnormalRemark, setAbnormalRemark] = useState('');
  const [invoiceForm, setInvoiceForm] = useState({
    title: '',
    taxNumber: '',
    email: '',
  });
  const [billingPlate, setBillingPlate] = useState('');
  const [billingEntryTime, setBillingEntryTime] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [billingResult, setBillingResult] = useState<BillingCalculation | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [invoiceErrors, setInvoiceErrors] = useState<{ [key: string]: string }>({});

  const parkingRecords = useMemo(() => {
    return vehicleRecords.filter((r) => r.status === 'parking');
  }, [vehicleRecords]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === 'all' || o.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [orders, searchQuery, filterStatus]);

  const selectedOrderData = useMemo(() => {
    if (!selectedOrder) return null;
    return orders.find((o) => o.id === selectedOrder.id) || selectedOrder;
  }, [orders, selectedOrder]);

  const relatedVehicle = useMemo(() => {
    if (!selectedOrderData?.vehicleRecordId) return null;
    return vehicleRecords.find((v) => v.id === selectedOrderData.vehicleRecordId);
  }, [selectedOrderData, vehicleRecords]);

  const relatedTicket = useMemo(() => {
    if (!selectedOrderData?.ticketId) return null;
    return tickets.find((t) => t.id === selectedOrderData.ticketId);
  }, [selectedOrderData, tickets]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleApplyCoupon = () => {
    if (!selectedOrderData || !couponCode.trim()) {
      showMessage('error', '请输入优惠券码');
      return;
    }

    const result = applyCoupon(selectedOrderData.id, couponCode.trim());
    showMessage(result.success ? 'success' : 'error', result.message);

    if (result.success) {
      setShowCouponModal(false);
      setCouponCode('');
    }
  };

  const validateInvoiceForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!invoiceForm.title.trim()) {
      errors.title = '请输入发票抬头';
    }

    if (!invoiceForm.email.trim()) {
      errors.email = '请输入邮箱地址';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invoiceForm.email)) {
      errors.email = '请输入有效的邮箱地址';
    }

    if (invoiceForm.taxNumber && !/^[A-Z0-9]{15,20}$/.test(invoiceForm.taxNumber.toUpperCase())) {
      errors.taxNumber = '请输入有效的纳税人识别号';
    }

    setInvoiceErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestInvoice = () => {
    if (!selectedOrderData) return;
    if (!validateInvoiceForm()) return;

    const result = requestInvoice(selectedOrderData.id, {
      title: invoiceForm.title.trim(),
      taxNumber: invoiceForm.taxNumber.trim() || undefined,
      email: invoiceForm.email.trim(),
      requestedAt: new Date().toISOString(),
    });

    showMessage(result.success ? 'success' : 'error', result.message);

    if (result.success) {
      setShowInvoiceModal(false);
      setInvoiceForm({ title: '', taxNumber: '', email: '' });
      setInvoiceErrors({});
    }
  };

  const handleMarkAbnormal = () => {
    if (!selectedOrderData || !abnormalRemark.trim()) {
      showMessage('error', '请填写异常原因');
      return;
    }

    markOrderAbnormal(selectedOrderData.id, abnormalRemark.trim());
    showMessage('success', '订单已标记为异常');
    setShowAbnormalModal(false);
    setAbnormalRemark('');
  };

  const handlePayOrder = (orderId: string) => {
    const result = payOrder(orderId);
    showMessage(result.success ? 'success' : 'error', result.message);
  };

  const handleCreateTicketFromOrder = () => {
    if (!selectedOrderData) return;
    const ticket = createTicketFromOrder(selectedOrderData.id);
    if (ticket) {
      showMessage('success', `工单 ${ticket.id} 已创建`);
    } else {
      showMessage('error', '创建工单失败');
    }
  };

  const handleSelectVehicle = (vehicle: VehicleRecord) => {
    setBillingPlate(vehicle.plateNumber);
    setBillingEntryTime(vehicle.entryTime);
    setSelectedVehicleId(vehicle.id);
    const exitTime = new Date().toISOString();
    const billing = calculateBilling(vehicle.entryTime, exitTime);
    setBillingResult(billing);
  };

  const handleCalculateBilling = () => {
    if (!billingPlate.trim()) {
      showMessage('error', '请输入车牌号或选择停车记录');
      return;
    }
    if (!billingEntryTime) {
      showMessage('error', '请选择入场时间');
      return;
    }

    const exitTime = new Date().toISOString();
    const billing = calculateBilling(billingEntryTime, exitTime);
    setBillingResult(billing);
    setSelectedVehicleId(null);
  };

  const handleGenerateOrder = () => {
    if (!billingResult || !billingPlate.trim()) {
      showMessage('error', '请先完成计费计算');
      return;
    }

    const vehicle = parkingRecords.find((v) => v.id === selectedVehicleId);
    const newOrder = calculateParkingFee(
      billingPlate.trim(),
      billingEntryTime,
      selectedVehicleId || undefined,
      vehicle?.zone
    );
    addOrder(newOrder);
    showMessage('success', `订单 ${newOrder.id} 已生成`);
    setShowBillingModal(false);
    setBillingPlate('');
    setBillingEntryTime('');
    setSelectedVehicleId(null);
    setBillingResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">订单收费</h1>
          <p className="mt-1 text-sm text-slate-400">管理停车订单与收费</p>
        </div>
        <button
          onClick={() => setShowBillingModal(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Calculator className="h-4 w-4" />
          临停计费
        </button>
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

      <div className="flex items-center gap-4 rounded-xl bg-slate-800/50 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索订单号或车牌号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="all">全部状态</option>
            <option value="pending">待支付</option>
            <option value="paid">已支付</option>
            <option value="abnormal">异常</option>
            <option value="refunded">已退款</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 overflow-hidden rounded-xl bg-slate-800/50">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">订单号</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">车牌号</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">时长</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">金额</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">状态</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-400">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className={`cursor-pointer transition-colors hover:bg-slate-700/30 ${
                    selectedOrderData?.id === order.id ? 'bg-slate-700/50' : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-4 py-3 font-mono text-sm text-white">{order.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{order.plateNumber}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{formatDuration(order.duration)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-white">{formatCurrency(order.paidAmount)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {order.status === 'pending' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePayOrder(order.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                      >
                        <Check className="h-3 w-3" />
                        收费
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-slate-800/50 p-5">
          {selectedOrderData ? (
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-white">订单详情</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">订单号</span>
                  <span className="font-mono text-white">{selectedOrderData.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">车牌号</span>
                  <span className="text-white">{selectedOrderData.plateNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">入场时间</span>
                  <span className="text-white">{formatDateTime(selectedOrderData.entryTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">出场时间</span>
                  <span className="text-white">{formatDateTime(selectedOrderData.exitTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">停车时长</span>
                  <span className="text-white">{formatDuration(selectedOrderData.duration)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">支付时间</span>
                  <span className="text-white">
                    {selectedOrderData.paidAt ? formatDateTime(selectedOrderData.paidAt) : '-'}
                  </span>
                </div>
                {selectedOrderData.zone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">停车区域</span>
                    <span className="text-white">
                      {selectedOrderData.zone}区 ({selectedOrderData.floor})
                    </span>
                  </div>
                )}
              </div>

              {relatedVehicle && (
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-medium text-blue-400">关联车辆记录</span>
                    </div>
                    <span className="text-xs text-blue-300">{relatedVehicle.status === 'parking' ? '停车中' : '已离场'}</span>
                  </div>
                  <p className="mt-1 text-xs text-blue-300">
                    入场: {formatDateTime(relatedVehicle.entryTime)}
                  </p>
                  {relatedVehicle.exitTime && (
                    <p className="text-xs text-blue-300">
                      离场: {formatDateTime(relatedVehicle.exitTime)}
                    </p>
                  )}
                </div>
              )}

              {relatedTicket && (
                <div className="rounded-lg bg-purple-500/10 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-400" />
                      <span className="text-xs font-medium text-purple-400">关联工单</span>
                    </div>
                    <StatusBadge status={relatedTicket.status} size="sm" />
                  </div>
                  <p className="mt-1 text-xs text-purple-300">
                    {relatedTicket.id} - {relatedTicket.title}
                  </p>
                </div>
              )}

              <div className="rounded-lg bg-blue-500/10 p-3">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 text-blue-400" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-blue-400">计费规则</p>
                    <p className="text-xs text-blue-300">
                      {FREE_PARKING_MINUTES}分钟内免费，{HOURLY_RATE}元/小时，每日封顶{MAX_DAILY_RATE}元
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h4 className="mb-3 text-sm font-medium text-white">费用明细</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">应付金额</span>
                    <span className="text-white">{formatCurrency(selectedOrderData.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">免费时长</span>
                    <span className="text-emerald-400">{selectedOrderData.freeMinutes}分钟</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">优惠抵扣</span>
                    <span className="text-emerald-400">-{formatCurrency(selectedOrderData.discountAmount)}</span>
                  </div>
                  {selectedOrderData.couponCode && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">优惠券码</span>
                      <span className="text-blue-400">{selectedOrderData.couponCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-700 pt-2 text-base font-semibold">
                    <span className="text-white">实付金额</span>
                    <span className="text-orange-400">{formatCurrency(selectedOrderData.paidAmount)}</span>
                  </div>
                </div>
              </div>

              {selectedOrderData.invoiceInfo && (
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-4 w-4 text-blue-400" />
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-blue-400">发票信息</p>
                      <p className="text-xs text-blue-300">抬头：{selectedOrderData.invoiceInfo.title}</p>
                      {selectedOrderData.invoiceInfo.taxNumber && (
                        <p className="text-xs text-blue-300">税号：{selectedOrderData.invoiceInfo.taxNumber}</p>
                      )}
                      <p className="text-xs text-blue-300">邮箱：{selectedOrderData.invoiceInfo.email}</p>
                      <p className="text-xs text-blue-400">申请时间：{formatDateTime(selectedOrderData.invoiceInfo.requestedAt)}</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedOrderData.abnormalRemark && (
                <div className="rounded-lg bg-red-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-red-400" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-400">异常备注</p>
                      <p className="text-xs text-red-300">{selectedOrderData.abnormalRemark}</p>
                    </div>
                    {!selectedOrderData.ticketId && (
                      <button
                        onClick={handleCreateTicketFromOrder}
                        className="flex items-center gap-1 rounded bg-red-500/20 px-2 py-1 text-xs text-red-400 hover:bg-red-500/30"
                      >
                        <MessageSquare className="h-3 w-3" />
                        创建工单
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t border-slate-700 pt-4">
                {selectedOrderData.status === 'pending' && (
                  <button
                    onClick={() => handlePayOrder(selectedOrderData.id)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    <Check className="h-4 w-4" />
                    完成支付
                  </button>
                )}
                <button
                  onClick={() => setShowCouponModal(true)}
                  disabled={selectedOrderData.status === 'paid' || selectedOrderData.couponApplied}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Tag className="h-4 w-4" />
                  {selectedOrderData.couponApplied ? '已使用优惠券' : '核销优惠券'}
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    disabled={selectedOrderData.invoiceRequested}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4" />
                    {selectedOrderData.invoiceRequested ? '已申请' : '申请发票'}
                  </button>
                  <button
                    onClick={() => setShowAbnormalModal(true)}
                    disabled={selectedOrderData.status === 'abnormal'}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-600/50 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    标记异常
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <Receipt className="h-12 w-12 text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">选择订单查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* 优惠券核销弹窗 */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white">核销优惠券</h3>
            <p className="mt-1 text-sm text-slate-400">输入优惠券核销码</p>
            <div className="mt-4">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                placeholder="请输入核销码"
              />
            </div>
            <div className="mt-3 rounded-lg bg-slate-700/50 p-3">
              <p className="text-xs text-slate-400 mb-2">可用优惠券示例：</p>
              <div className="space-y-1">
                {VALID_COUPONS.filter((c) => c.valid).slice(0, 3).map((c) => (
                  <div key={c.code} className="flex justify-between text-xs">
                    <span className="text-slate-300 font-mono">{c.code}</span>
                    <span className="text-emerald-400">{c.description}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCouponModal(false);
                  setCouponCode('');
                }}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleApplyCoupon}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                确认核销
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 发票申请弹窗 */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white">申请电子发票</h3>
            <p className="mt-1 text-sm text-slate-400">发票将发送至用户邮箱</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-slate-300">
                  发票抬头 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={invoiceForm.title}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, title: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    invoiceErrors.title ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none`}
                  placeholder="请输入发票抬头"
                />
                {invoiceErrors.title && <p className="mt-1 text-xs text-red-400">{invoiceErrors.title}</p>}
              </div>
              <div>
                <label className="text-sm text-slate-300">纳税人识别号</label>
                <input
                  type="text"
                  value={invoiceForm.taxNumber}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, taxNumber: e.target.value.toUpperCase() })}
                  className={`mt-1 w-full rounded-lg border ${
                    invoiceErrors.taxNumber ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none`}
                  placeholder="选填，企业发票需提供"
                />
                {invoiceErrors.taxNumber && <p className="mt-1 text-xs text-red-400">{invoiceErrors.taxNumber}</p>}
              </div>
              <div>
                <label className="text-sm text-slate-300">
                  邮箱地址 <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={invoiceForm.email}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, email: e.target.value })}
                  className={`mt-1 w-full rounded-lg border ${
                    invoiceErrors.email ? 'border-red-500' : 'border-slate-700'
                  } bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none`}
                  placeholder="请输入接收发票的邮箱"
                />
                {invoiceErrors.email && <p className="mt-1 text-xs text-red-400">{invoiceErrors.email}</p>}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setInvoiceForm({ title: '', taxNumber: '', email: '' });
                  setInvoiceErrors({});
                }}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleRequestInvoice}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 异常标记弹窗 */}
      {showAbnormalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white">标记异常订单</h3>
            <p className="mt-1 text-sm text-slate-400">请填写异常原因</p>
            <div className="mt-4">
              <textarea
                value={abnormalRemark}
                onChange={(e) => setAbnormalRemark(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                rows={4}
                placeholder="请描述异常原因..."
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAbnormalModal(false);
                  setAbnormalRemark('');
                }}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleMarkAbnormal}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              >
                确认标记
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 临停计费弹窗 */}
      {showBillingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[500px] rounded-xl bg-slate-800 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white">临停计费</h3>
            <p className="mt-1 text-sm text-slate-400">计算停车费用并生成订单</p>

            <div className="mt-4 space-y-4">
              {parkingRecords.length > 0 && (
                <div>
                  <label className="text-sm text-slate-300">选择当前停车记录</label>
                  <div className="mt-2 max-h-32 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/50">
                    {parkingRecords.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        onClick={() => handleSelectVehicle(vehicle)}
                        className={`flex items-center justify-between border-b border-slate-700/50 px-3 py-2 cursor-pointer hover:bg-slate-700/50 last:border-0 ${
                          selectedVehicleId === vehicle.id ? 'bg-blue-500/10' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-white">{vehicle.plateNumber}</span>
                          {vehicle.zone && (
                            <span className="text-xs text-slate-500">({vehicle.zone}区)</span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">入场 {formatDateTime(vehicle.entryTime)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300">车牌号</label>
                  <input
                    type="text"
                    value={billingPlate}
                    onChange={(e) => {
                      setBillingPlate(e.target.value);
                      setSelectedVehicleId(null);
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    placeholder="手动输入车牌号"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300">入场时间</label>
                  <input
                    type="datetime-local"
                    value={billingEntryTime ? billingEntryTime.slice(0, 16) : ''}
                    onChange={(e) => {
                      setBillingEntryTime(new Date(e.target.value).toISOString());
                      setSelectedVehicleId(null);
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCalculateBilling}
                className="w-full rounded-lg bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
              >
                <Calculator className="inline h-4 w-4 mr-1" />
                计算费用
              </button>

              {billingResult && (
                <div className="rounded-lg bg-slate-900 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-300">停车时长：{formatDuration(billingResult.durationMinutes)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">免费时长</span>
                      <span className="text-emerald-400">{billingResult.freeMinutes}分钟</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">计费时长</span>
                      <span className="text-white">{Math.ceil(billingResult.billableMinutes / 60)}小时</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">单价</span>
                      <span className="text-white">{billingResult.hourlyRate}元/小时</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">日封顶</span>
                      <span className="text-white">{billingResult.maxDailyRate}元</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex justify-between">
                    <span className="text-white font-medium">应收金额</span>
                    <span className="text-orange-400 font-bold text-lg">
                      {formatCurrency(billingResult.totalAmount)}
                    </span>
                  </div>
                  {billingResult.baseAmount > billingResult.cappedAmount && (
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
                      <AlertCircle className="h-3 w-3" />
                      已享受日封顶优惠，减免{formatCurrency(billingResult.baseAmount - billingResult.cappedAmount)}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBillingModal(false);
                  setBillingPlate('');
                  setBillingEntryTime('');
                  setSelectedVehicleId(null);
                  setBillingResult(null);
                }}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleGenerateOrder}
                disabled={!billingResult}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                生成订单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
