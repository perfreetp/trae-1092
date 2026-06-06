import React, { useState } from 'react';
import { Plus, Filter, MessageSquare, User, Clock, Send } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useParkingStore } from '@/store/useParkingStore';
import { Ticket } from '@/types';
import { formatDateTime, generateRandomId } from '@/utils/format';
import { TICKET_TYPE_LABELS, TICKET_STATUS_LABELS, STATUS_LABELS } from '@/utils/constants';

export const Tickets: React.FC = () => {
  const tickets = useParkingStore((state) => state.tickets);
  const addTicket = useParkingStore((state) => state.addTicket);
  const updateTicket = useParkingStore((state) => state.updateTicket);
  const addTicketHistory = useParkingStore((state) => state.addTicketHistory);
  const currentUser = useParkingStore((state) => state.currentUser);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    type: 'consult' as Ticket['type'],
    priority: 'medium' as Ticket['priority'],
    assignee: '',
  });
  const [replyText, setReplyText] = useState('');

  const filteredTickets = tickets.filter((t) => {
    return filterStatus === 'all' || t.status === filterStatus;
  });

  const handleCreateTicket = () => {
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
    addTicket(ticket);
    setShowCreateModal(false);
    setNewTicket({ title: '', description: '', type: 'consult', priority: 'medium', assignee: '' });
  };

  const handleUpdateStatus = (status: Ticket['status']) => {
    if (selectedTicket) {
      addTicketHistory(selectedTicket.id, {
        id: generateRandomId(),
        action: `变更状态为${TICKET_STATUS_LABELS[status]}`,
        operator: currentUser,
        remark: replyText || '',
        timestamp: new Date().toISOString(),
      });
      updateTicket(selectedTicket.id, { status });
      setReplyText('');
    }
  };

  const handleSendReply = () => {
    if (selectedTicket && replyText) {
      addTicketHistory(selectedTicket.id, {
        id: generateRandomId(),
        action: '回复工单',
        operator: currentUser,
        remark: replyText,
        timestamp: new Date().toISOString(),
      });
      setReplyText('');
    }
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
        <div className="col-span-1 space-y-3">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`cursor-pointer rounded-xl border p-4 transition-all hover:border-blue-500/50 ${
                selectedTicket?.id === ticket.id
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
            </div>
          ))}
        </div>

        <div className="col-span-2 rounded-xl bg-slate-800/50 p-5">
          {selectedTicket ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-700 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{selectedTicket.title}</h3>
                    <div className="mt-2 flex items-center gap-3">
                      <StatusBadge status={selectedTicket.status} />
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[selectedTicket.priority]}`}>
                        {STATUS_LABELS[selectedTicket.priority]}优先级
                      </span>
                      <span className="rounded-full bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-300">
                        {TICKET_TYPE_LABELS[selectedTicket.type]}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>工单号：{selectedTicket.id}</p>
                    <p>创建人：{selectedTicket.creator}</p>
                    <p>处理人：{selectedTicket.assignee || '未分配'}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto py-4">
                {selectedTicket.history.map((h) => (
                  <div key={h.id} className="flex gap-3">
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
                    placeholder="输入回复内容..."
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!replyText}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus('processing')}
                    disabled={selectedTicket.status === 'processing'}
                    className="rounded-lg border border-blue-600/50 px-3 py-1.5 text-xs text-blue-400 transition-colors hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    开始处理
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={selectedTicket.status === 'resolved' || selectedTicket.status === 'closed'}
                    className="rounded-lg border border-emerald-600/50 px-3 py-1.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    标记解决
                  </button>
                  <button
                    onClick={() => handleUpdateStatus('closed')}
                    disabled={selectedTicket.status === 'closed'}
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

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white">创建工单</h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-slate-300">标题</label>
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
    </div>
  );
};
