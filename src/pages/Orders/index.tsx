import React, { useState } from 'react';
import { Search, Filter, Receipt, Tag, FileText, AlertTriangle, Check } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useParkingStore } from '@/store/useParkingStore';
import { Order } from '@/types';
import { formatDateTime, formatDuration, formatCurrency } from '@/utils/format';

export const Orders: React.FC = () => {
  const orders = useParkingStore((state) => state.orders);
  const updateOrder = useParkingStore((state) => state.updateOrder);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showAbnormalModal, setShowAbnormalModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [abnormalRemark, setAbnormalRemark] = useState('');

  const filteredOrders = orders.filter((o) => {
    const matchSearch = o.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleApplyCoupon = () => {
    if (selectedOrder && couponCode) {
      const discount = Math.min(20, Math.floor(Math.random() * 20) + 5);
      updateOrder(selectedOrder.id, {
        couponCode,
        discountAmount: selectedOrder.discountAmount + discount,
        paidAmount: selectedOrder.totalAmount - selectedOrder.discountAmount - discount,
      });
    }
    setShowCouponModal(false);
    setCouponCode('');
  };

  const handleRequestInvoice = () => {
    if (selectedOrder) {
      updateOrder(selectedOrder.id, { invoiceRequested: true });
    }
    setShowInvoiceModal(false);
  };

  const handleMarkAbnormal = () => {
    if (selectedOrder) {
      updateOrder(selectedOrder.id, {
        status: 'abnormal',
        remark: abnormalRemark,
      });
    }
    setShowAbnormalModal(false);
    setAbnormalRemark('');
  };

  const handlePayOrder = (order: Order) => {
    updateOrder(order.id, { status: 'paid' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">订单收费</h1>
          <p className="mt-1 text-sm text-slate-400">管理停车订单与收费</p>
        </div>
      </div>

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
                    selectedOrder?.id === order.id ? 'bg-slate-700/50' : ''
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
                          handlePayOrder(order);
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
          {selectedOrder ? (
            <div className="space-y-5">
              <h3 className="text-base font-semibold text-white">订单详情</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">订单号</span>
                  <span className="font-mono text-white">{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">车牌号</span>
                  <span className="text-white">{selectedOrder.plateNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">入场时间</span>
                  <span className="text-white">{formatDateTime(selectedOrder.entryTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">出场时间</span>
                  <span className="text-white">{formatDateTime(selectedOrder.exitTime)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">停车时长</span>
                  <span className="text-white">{formatDuration(selectedOrder.duration)}</span>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4">
                <h4 className="mb-3 text-sm font-medium text-white">费用明细</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">应付金额</span>
                    <span className="text-white">{formatCurrency(selectedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">优惠抵扣</span>
                    <span className="text-emerald-400">-{formatCurrency(selectedOrder.discountAmount)}</span>
                  </div>
                  {selectedOrder.couponCode && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">优惠券</span>
                      <span className="text-blue-400">{selectedOrder.couponCode}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-700 pt-2 text-base font-semibold">
                    <span className="text-white">实付金额</span>
                    <span className="text-orange-400">{formatCurrency(selectedOrder.paidAmount)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.remark && (
                <div className="rounded-lg bg-red-500/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-red-400" />
                    <div>
                      <p className="text-xs font-medium text-red-400">异常备注</p>
                      <p className="text-xs text-red-300">{selectedOrder.remark}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 border-t border-slate-700 pt-4">
                <button
                  onClick={() => setShowCouponModal(true)}
                  disabled={selectedOrder.status === 'paid'}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Tag className="h-4 w-4" />
                  核销优惠券
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    disabled={selectedOrder.invoiceRequested}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4" />
                    {selectedOrder.invoiceRequested ? '已申请' : '申请发票'}
                  </button>
                  <button
                    onClick={() => setShowAbnormalModal(true)}
                    disabled={selectedOrder.status === 'abnormal'}
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

      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white">核销优惠券</h3>
            <p className="mt-1 text-sm text-slate-400">输入优惠券核销码</p>
            <div className="mt-4">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                placeholder="请输入核销码"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCouponModal(false)}
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

      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white">申请电子发票</h3>
            <p className="mt-1 text-sm text-slate-400">发票将发送至用户邮箱</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-slate-300">发票抬头</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="请输入发票抬头"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">邮箱</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="请输入邮箱地址"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowInvoiceModal(false)}
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

      {showAbnormalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6">
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
                onClick={() => setShowAbnormalModal(false)}
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
    </div>
  );
};
