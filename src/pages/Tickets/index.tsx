import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Filter,
  MessageSquare,
  User,
  Clock,
  Send,
  Users,
  Flag,
  Link2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Car,
  Receipt,
  UserCircle,
  ChevronDown,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useParkingStore } from '@/store/useParkingStore';
import { Ticket, RelatedObject, Order, VehicleRecord, Member, Device } from '@/types';
import { formatDateTime, generateRandomId } from '@/utils/format';
import { TICKET_TYPE_LABELS, TICKET_STATUS_LABELS, STATUS_LABELS, ASSIGNEES } from '@/utils/constants';

export const Tickets: React.FC = () => {
  const location = useLocation();
  const tickets = useParkingStore((state) => state.tickets);
  const orders = useParkingStore((state) => state.orders);
  const vehicleRecords = useParkingStore((state) => state.vehicleRecords);
  const members = useParkingStore((state) => state.members);
  const devices = useParkingStore((state) => state.devices);
  const addTicket = useParkingStore((state) => state.addTicket);
  const updateTicket = useParkingStore((state) => state.updateTicket);
  const addTicketHistory = useParkingStore((state) => state.addTicketHistory);
  const assignTicket = useParkingStore((state) => state.assignTicket);
  const updateTicketPriority = useParkingStore((state) => state.updateTicketPriority);
  const linkRelatedObject = useParkingStore((state) => state.linkRelatedObject);
  const currentUser = useParkingStore((state) => state.currentUser);

  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const state = location.state as { filterStatus?: string };
    if (state?.filterStatus) {
      setFilterStatus(state.filterStatus);
    }
  }, [location.state]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [linkType, setLinkType] = useState<'order' | 'vehicle' | 'member'>('order');
  const [linkSearch, setLinkSearch] = useState('');
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    type: 'consult' as Ticket['type'],
    priority: 'medium' as Ticket['priority'],
    assignee: '',
  });
  const [replyText, setReplyText] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      return filterStatus === 'all' || t.status === filterStatus;
    });
  }, [tickets, filterStatus]);

  const selectedTicketData = useMemo(() => {
    if (!selectedTicket) return null;
    return tickets.find((t) => t.id === selectedTicket.id) || selectedTicket;
  }, [tickets, selectedTicket]);

  const linkableItems = useMemo(() => {
    const query = linkSearch.toLowerCase();
    if (linkType === 'order') {
      return orders
        .filter((o) => o.id.toLowerCase().includes(query) || o.plateNumber.toLowerCase().includes(query))
        .slice(0, 10)
        .map((o) => ({
          id: o.id,
          displayName: `${o.id} - ${o.plateNumber}`,
          type: 'order' as const,
        }));
    } else if (linkType === 'vehicle') {
      return vehicleRecords
        .filter((v) => v.plateNumber.toLowerCase().includes(query))
        .slice(0, 10)
        .map((v) => ({
          id: v.id,
          displayName: v.plateNumber,
          type: 'vehicle' as const,
        }));
    } else {
      return members
        .filter((m) => m.name.toLowerCase().includes(query) || m.phone.includes(query))
        .slice(0, 10)
        .map((m) => ({
          id: m.id,
          displayName: `${m.name} - ${m.plateNumber}`,
          type: 'member' as const,
        }));
    }
  }, [linkType, linkSearch, orders, vehicleRecords, members]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateTicket = () => {
    if (!newTicket.title.trim()) {
      showMessage('error', '请输入工单标题');
      return;
    }

    const now = new Date().toISOString();
    const ticket: Ticket = {
      id: 'TK' + Date.now().toString().slice(-6),
      ...newTicket,
      status: 'pending',
      creator: currentUser,
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: generateRandomId(),
          action: '创建工单',
          operator: currentUser,
          remark: newTicket.description,
          timestamp: now,
        },
      ],
    };

    if (newTicket.assignee) {
      ticket.history.push({
        id: generateRandomId(),
        action: `分配给${newTicket.assignee}`,
        operator: currentUser,
        remark: '',
        timestamp: now,
      });
    }

    addTicket(ticket);
    showMessage('success', '工单创建成功');
    setShowCreateModal(false);
    setNewTicket({ title: '', description: '', type: 'consult', priority: 'medium', assignee: '' });
  };

  const handleUpdateStatus = (status: Ticket['status']) => {
    if (!selectedTicketData) return;

    addTicketHistory(selectedTicketData.id, {
      id: generateRandomId(),
      action: `变更状态为${TICKET_STATUS_LABELS[status]}`,
      operator: currentUser,
      remark: replyText || '',
      timestamp: new Date().toISOString(),
    });
    updateTicket(selectedTicketData.id, { status });
    setReplyText('');
    showMessage('success', `工单状态已更新为${TICKET_STATUS_LABELS[status]}`);
  };

  const handleSendReply = () => {
    if (!selectedTicketData || !replyText.trim()) return;

    addTicketHistory(selectedTicketData.id, {
      id: generateRandomId(),
      action: '回复工单',
      operator: currentUser,
      remark: replyText.trim(),
      timestamp: new Date().toISOString(),
    });
    setReplyText('');
    showMessage('success', '回复已发送');
  };

  const handleAssignTicket = () => {
    if (!selectedTicketData || !selectedAssignee) return;

    assignTicket(selectedTicketData.id, selectedAssignee);
    showMessage('success', `工单已分配给${selectedAssignee}`);
    setShowAssignModal(false);
    setSelectedAssignee('');
  };

  const handleUpdatePriority = (priority: Ticket['priority']) => {
    if (!selectedTicketData) return;
    updateTicketPriority(selectedTicketData.id, priority);
    showMessage('success', `优先级已调整为${STATUS_LABELS[priority]}`);
  };

  const handleLinkObject = (item: { id: string; displayName: string; type: 'order' | 'vehicle' | 'member' }) => {
    if (!selectedTicketData) return;

    const relatedObject: RelatedObject = {
      type: item.type,
      id: item.id,
      displayName: item.displayName,
    };

    linkRelatedObject(selectedTicketData.id, relatedObject);
    showMessage('success', '关联成功');
    setShowLinkModal(false);
    setLinkSearch('');
  };

  const priorityColors = {
    low: 'bg-blue-500/20 text-blue-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">客服工单</h1>
          <p className="mt-1 text-sm text-slate-400">处理用户咨询与投诉</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          创建工单
        </button>
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

      <div className="flex items-center gap-4 rounded-xl bg-slate-800/50 p-4">
        <Filter className="h-4 w-4 text-slate-400" />
        <div className="flex gap-2">
          {['all', 'pending', 'processing', 'resolved', 'closed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {status === 'all' ? '全部' : TICKET_STATUS_LABELS[status as keyof typeof TICKET_STATUS_LABELS]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-blue-500/50 ${
                selectedTicketData?.id === ticket.id
                  ? 'border-blue-500 bg-slate-800'
                  : 'border-slate-700 bg-slate-800/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-white">{ticket.title}</p>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">{ticket.description}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusBadge status={ticket.status} size="sm" />
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[ticket.priority]}`}>
                    {STATUS_LABELS[ticket.priority]}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{formatDateTime(ticket.createdAt)}</span>
              </div>
              {ticket.assignee && (
                <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                  <User className="h-3 w-3" />
                  处理人：{ticket.assignee}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="col-span-2 rounded-xl bg-slate-800/50 p-5">
          {selectedTicketData ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-700 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedTicketData.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={selectedTicketData.status} />
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[selectedTicketData.priority]}`}>
                        {STATUS_LABELS[selectedTicketData.priority]}优先级
                      </span>
                      <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                        {TICKET_TYPE_LABELS[selectedTicketData.type]}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>工单号：{selectedTicketData.id}</p>
                    <p>创建人：{selectedTicketData.creator}</p>
                    <p>处理人：{selectedTicketData.assignee || '未分配'}</p>
                  </div>
                </div>

                {selectedTicketData.relatedObject && (
                  <div className="mt-3 rounded-lg bg-blue-500/10 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-blue-400" />
                      <span className="text-xs text-blue-400">
                        关联{selectedTicketData.relatedObject.type === 'order' ? '订单' : selectedTicketData.relatedObject.type === 'vehicle' ? '车辆' : selectedTicketData.relatedObject.type === 'device' ? '设备' : '会员'}：
                        {selectedTicketData.relatedObject.displayName}
                      </span>
                      {selectedTicketData.relatedObject.type === 'order' && (
                        <Receipt className="h-3 w-3 text-blue-400 ml-auto" />
                      )}
                      {selectedTicketData.relatedObject.type === 'vehicle' && (
                        <Car className="h-3 w-3 text-blue-400 ml-auto" />
                      )}
                      {selectedTicketData.relatedObject.type === 'device' && (
                        <AlertCircle className="h-3 w-3 text-blue-400 ml-auto" />
                      )}
                      {selectedTicketData.relatedObject.type === 'member' && (
                        <UserCircle className="h-3 w-3 text-blue-400 ml-auto" />
                      )}
                    </div>
                    {selectedTicketData.relatedObject.type === 'device' && (() => {
                      const device = devices.find((d) => d.id === selectedTicketData.relatedObject?.id);
                      if (!device) return null;
                      return (
                        <div className="mt-2 space-y-1 border-t border-blue-500/20 pt-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">设备名称:</span>
                            <span className="text-white">{device.name}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">设备位置:</span>
                            <span className="text-white">{device.location}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">当前状态:</span>
                            <StatusBadge status={device.status} size="sm" />
                          </div>
                          {device.zone && (
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">所属区域:</span>
                              <span className="text-white">{device.zone}区 ({device.floor})</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    <Users className="h-3 w-3" />
                    分配处理人
                  </button>
                  <div className="relative group">
                    <button className="flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700">
                      <Flag className="h-3 w-3" />
                      调整优先级
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <div className="absolute left-0 top-full mt-1 hidden w-32 rounded-lg border border-slate-700 bg-slate-800 py-1 group-hover:block z-10">
                      {(['low', 'medium', 'high'] as const).map((p) => (
                        <button
                          key={p}
                          onClick={() => handleUpdatePriority(p)}
                          className={`w-full px-3 py-1.5 text-left text-xs hover:bg-slate-700 ${
                            selectedTicketData.priority === p ? 'text-blue-400' : 'text-slate-300'
                          }`}
                        >
                          {STATUS_LABELS[p]}优先级
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLinkModal(true)}
                    className="flex items-center gap-1 rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-300 hover:bg-slate-700"
                  >
                    <Link2 className="h-3 w-3" />
                    关联业务
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto py-4 pr-2">
                {selectedTicketData.history.map((h) => (
                  <div key={h.id} className="flex gap-3 animate-fade-in">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600/20">
                      <User className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1 rounded-lg bg-slate-700/30 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white">{h.operator}</span>
                        <span className="text-xs text-slate-500">{formatDateTime(h.timestamp)}</span>
                      </div>
                      <p className="mt-1 text-sm text-blue-400">{h.action}</p>
                      {h.remark && <p className="mt-1 text-sm text-slate-300">{h.remark}</p>}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-700 pt-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                    placeholder="输入回复内容..."
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleUpdateStatus('processing')}
                    disabled={selectedTicketData.status === 'processing'}
                    className="rounded-lg border border-blue-600/50 px-3 py-1.5 text-xs text-blue-400 transition-colors hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    开始处理
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={selectedTicketData.status === 'resolved' || selectedTicketData.status === 'closed'}
                    className="rounded-lg border border-emerald-600/50 px-3 py-1.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    标记解决
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('closed')}
                    disabled={selectedTicketData.status === 'closed'}
                    className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-slate-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    关闭工单
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-12 w-12 text-slate-600" />
              <p className="mt-3 text-sm text-slate-500">选择工单查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* 创建工单弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[480px] rounded-xl bg-slate-800 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white">创建工单</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-slate-300">
                  标题 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="请输入工单标题"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">描述</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="请描述问题详情"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-300">类型</label>
                  <select
                    value={newTicket.type}
                    onChange={(e) => setNewTicket({ ...newTicket, type: e.target.value as Ticket['type'] })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="complaint">投诉</option>
                    <option value="consult">咨询</option>
                    <option value="fault">故障</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-slate-300">优先级</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as Ticket['priority'] })}
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-300">分配处理人（选填）</label>
                <select
                  value={newTicket.assignee}
                  onChange={(e) => setNewTicket({ ...newTicket, assignee: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">不分配</option>
                  {ASSIGNEES.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleCreateTicket}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分配处理人弹窗 */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white">分配处理人</h3>
            <p className="mt-1 text-sm text-slate-400">选择工单处理人</p>
            <div className="mt-4">
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">请选择处理人</option>
                {ASSIGNEES.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedAssignee('');
                }}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleAssignTicket}
                disabled={!selectedAssignee}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                确认分配
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 关联业务对象弹窗 */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[480px] rounded-xl bg-slate-800 p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-white">关联业务对象</h3>
            <p className="mt-1 text-sm text-slate-400">关联相关的订单、车辆或会员</p>

            <div className="mt-4 space-y-3">
              <div className="flex gap-2">
                {(['order', 'vehicle', 'member'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setLinkType(type)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors ${
                      linkType === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {type === 'order' ? '订单' : type === 'vehicle' ? '车辆' : '会员'}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={linkSearch}
                  onChange={(e) => setLinkSearch(e.target.value)}
                  placeholder={`搜索${linkType === 'order' ? '订单号或车牌号' : linkType === 'vehicle' ? '车牌号' : '会员姓名或电话'}...`}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-slate-900/50">
                {linkableItems.length > 0 ? (
                  linkableItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLinkObject(item)}
                      className="flex items-center gap-3 border-b border-slate-700/50 px-3 py-2 cursor-pointer hover:bg-slate-700/50 last:border-0"
                    >
                      {item.type === 'order' && <Receipt className="h-4 w-4 text-slate-400" />}
                      {item.type === 'vehicle' && <Car className="h-4 w-4 text-slate-400" />}
                      {item.type === 'member' && <UserCircle className="h-4 w-4 text-slate-400" />}
                      <span className="text-sm text-white">{item.displayName}</span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-slate-500">
                    没有找到相关记录
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkSearch('');
                }}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
