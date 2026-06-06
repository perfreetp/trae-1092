import React, { useState } from 'react';
import { Search, Plus, UserPlus, RefreshCw, Ban, UserCheck } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useParkingStore } from '@/store/useParkingStore';
import { Member } from '@/types';
import { formatDate, formatCurrency, generateRandomId } from '@/utils/format';
import { CARD_TYPE_LABELS } from '@/utils/constants';

const cardPrices = {
  monthly: 300,
  quarterly: 800,
  yearly: 3000,
};

export const Members: React.FC = () => {
  const members = useParkingStore((state) => state.members);
  const addMember = useParkingStore((state) => state.addMember);
  const updateMember = useParkingStore((state) => state.updateMember);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    phone: '',
    plateNumber: '',
    cardType: 'monthly' as Member['cardType'],
  });
  const [renewType, setRenewType] = useState<Member['cardType']>('monthly');

  const filteredMembers = members.filter((m) => {
    const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      m.plateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleAddMember = () => {
    const days = newMember.cardType === 'monthly' ? 30 : newMember.cardType === 'quarterly' ? 90 : 365;
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + days);
    
    addMember({
      id: generateRandomId(),
      ...newMember,
      expireDate: expireDate.toISOString(),
      status: 'active',
    });
    
    setShowAddModal(false);
    setNewMember({ name: '', phone: '', plateNumber: '', cardType: 'monthly' });
  };

  const handleRenew = () => {
    if (selectedMember) {
      const days = renewType === 'monthly' ? 30 : renewType === 'quarterly' ? 90 : 365;
      const currentExpire = new Date(selectedMember.expireDate);
      const newExpire = new Date(Math.max(currentExpire.getTime(), Date.now()));
      newExpire.setDate(newExpire.getDate() + days);
      
      updateMember(selectedMember.id, {
        expireDate: newExpire.toISOString(),
        status: 'active',
        cardType: renewType,
      });
    }
    setShowRenewModal(false);
    setSelectedMember(null);
  };

  const handleToggleBlacklist = (member: Member) => {
    updateMember(member.id, {
      status: member.status === 'blacklisted' ? 'active' : 'blacklisted',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">会员月卡</h1>
          <p className="mt-1 text-sm text-slate-400">管理会员与月卡服务</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          新增会员
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">会员总数</p>
          <p className="mt-2 text-2xl font-bold text-white">{members.length}</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">有效会员</p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {members.filter((m) => m.status === 'active').length}
          </p>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">即将过期</p>
          <p className="mt-2 text-2xl font-bold text-yellow-400">
            {members.filter((m) => {
              const expire = new Date(m.expireDate);
              const diff = expire.getTime() - Date.now();
              return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
            }).length}
          </p>
        </div>
        <div className="rounded-xl bg-slate-800/50 p-4">
          <p className="text-sm text-slate-400">黑名单</p>
          <p className="mt-2 text-2xl font-bold text-red-400">
            {members.filter((m) => m.status === 'blacklisted').length}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-slate-800/50 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索姓名、电话或车牌号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/50 py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
        >
          <option value="all">全部状态</option>
          <option value="active">正常</option>
          <option value="expired">已过期</option>
          <option value="blacklisted">黑名单</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl bg-slate-800/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">会员信息</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">车牌号</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">卡类型</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">到期时间</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">状态</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredMembers.map((member) => (
              <tr key={member.id} className="transition-colors hover:bg-slate-700/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/20">
                      <UserCheck className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{member.name}</p>
                      <p className="text-xs text-slate-400">{member.phone}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{member.plateNumber}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
                    {CARD_TYPE_LABELS[member.cardType]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{formatDate(member.expireDate)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={member.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => {
                        setSelectedMember(member);
                        setRenewType(member.cardType);
                        setShowRenewModal(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <RefreshCw className="h-3 w-3" />
                      续费
                    </button>
                    <button
                      onClick={() => handleToggleBlacklist(member)}
                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-opacity-10 ${
                        member.status === 'blacklisted'
                          ? 'text-emerald-400 hover:bg-emerald-500'
                          : 'text-red-400 hover:bg-red-500'
                      }`}
                    >
                      <Ban className="h-3 w-3" />
                      {member.status === 'blacklisted' ? '解除' : '拉黑'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white">新增会员</h3>
            <p className="mt-1 text-sm text-slate-400">填写会员信息开通月卡</p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm text-slate-300">姓名</label>
                <input
                  type="text"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">手机号</label>
                <input
                  type="tel"
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="请输入手机号"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">车牌号</label>
                <input
                  type="text"
                  value={newMember.plateNumber}
                  onChange={(e) => setNewMember({ ...newMember, plateNumber: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                  placeholder="请输入车牌号"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300">卡类型</label>
                <select
                  value={newMember.cardType}
                  onChange={(e) => setNewMember({ ...newMember, cardType: e.target.value as Member['cardType'] })}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="monthly">月卡 - {formatCurrency(cardPrices.monthly)}</option>
                  <option value="quarterly">季卡 - {formatCurrency(cardPrices.quarterly)}</option>
                  <option value="yearly">年卡 - {formatCurrency(cardPrices.yearly)}</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleAddMember}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4" />
                开通会员
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenewModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white">会员续费</h3>
            <p className="mt-1 text-sm text-slate-400">
              会员：{selectedMember.name}（{selectedMember.plateNumber}）
            </p>
            <p className="mt-1 text-xs text-slate-500">
              当前到期：{formatDate(selectedMember.expireDate)}
            </p>
            <div className="mt-4">
              <label className="text-sm text-slate-300">续费类型</label>
              <select
                value={renewType}
                onChange={(e) => setRenewType(e.target.value as Member['cardType'])}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="monthly">月卡 - {formatCurrency(cardPrices.monthly)}</option>
                <option value="quarterly">季卡 - {formatCurrency(cardPrices.quarterly)}</option>
                <option value="yearly">年卡 - {formatCurrency(cardPrices.yearly)}</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRenewModal(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleRenew}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-700"
              >
                <RefreshCw className="h-4 w-4" />
                确认续费
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
