import React, { useState } from 'react';
import { Search, Filter, Edit, Plus, AlertCircle, Car as CarIcon } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { useParkingStore } from '@/store/useParkingStore';
import { VehicleRecord } from '@/types';
import { formatDateTime } from '@/utils/format';

export const Vehicles: React.FC = () => {
  const vehicleRecords = useParkingStore((state) => state.vehicleRecords);
  const updateVehicleRecord = useParkingStore((state) => state.updateVehicleRecord);
  const addVehicleRecord = useParkingStore((state) => state.addVehicleRecord);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<VehicleRecord | null>(null);
  const [editPlate, setEditPlate] = useState('');
  const [newPlate, setNewPlate] = useState('');

  const filteredRecords = vehicleRecords.filter((r) => {
    const matchSearch = r.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.correctedPlate?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleEditPlate = (record: VehicleRecord) => {
    setSelectedRecord(record);
    setEditPlate(record.correctedPlate || record.plateNumber);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (selectedRecord && editPlate) {
      updateVehicleRecord(selectedRecord.id, {
        correctedPlate: editPlate,
        plateNumber: editPlate,
        isUnlicensed: false,
      });
    }
    setShowEditModal(false);
    setSelectedRecord(null);
  };

  const handleAddUnlicensed = () => {
    if (newPlate) {
      addVehicleRecord({
        id: Math.random().toString(36).substring(2, 10),
        plateNumber: newPlate || '无牌车',
        entryTime: new Date().toISOString(),
        status: 'parking',
        isUnlicensed: !newPlate,
        correctedPlate: newPlate || undefined,
      });
    }
    setShowAddModal(false);
    setNewPlate('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">车辆记录</h1>
          <p className="mt-1 text-sm text-slate-400">管理车辆入出场记录</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          无牌车登记
        </button>
      </div>

      <div className="flex items-center gap-4 rounded-xl bg-slate-800/50 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="搜索车牌号..."
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
            <option value="parking">停车中</option>
            <option value="exited">已离场</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-slate-800/50">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">车牌号</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">入场时间</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">出场时间</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">状态</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-400">标记</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-400">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredRecords.map((record) => (
              <tr key={record.id} className="transition-colors hover:bg-slate-700/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <CarIcon className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-white">{record.plateNumber}</span>
                    {record.correctedPlate && record.correctedPlate !== record.plateNumber && (
                      <span className="text-xs text-slate-500">→ {record.correctedPlate}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-300">{formatDateTime(record.entryTime)}</td>
                <td className="px-4 py-3 text-sm text-slate-300">
                  {record.exitTime ? formatDateTime(record.exitTime) : '-'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={record.status} />
                </td>
                <td className="px-4 py-3">
                  {record.isUnlicensed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-400">
                      <AlertCircle className="h-3 w-3" />
                      无牌车
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleEditPlate(record)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10"
                  >
                    <Edit className="h-3 w-3" />
                    纠错
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white">车牌纠错</h3>
            <p className="mt-1 text-sm text-slate-400">修改识别错误的车牌号码</p>
            <div className="mt-4">
              <label className="text-sm text-slate-300">正确车牌号</label>
              <input
                type="text"
                value={editPlate}
                onChange={(e) => setEditPlate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                placeholder="请输入正确车牌号"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-xl bg-slate-800 p-6">
            <h3 className="text-lg font-semibold text-white">无牌车登记</h3>
            <p className="mt-1 text-sm text-slate-400">手动登记无牌车辆信息</p>
            <div className="mt-4">
              <label className="text-sm text-slate-300">车牌号（如有）</label>
              <input
                type="text"
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                placeholder="请输入车牌号，不填则标记为无牌车"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                取消
              </button>
              <button
                onClick={handleAddUnlicensed}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              >
                确认登记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
