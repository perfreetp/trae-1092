import { addHours, addDays, subDays } from 'date-fns';
import {
  ParkingSpot,
  VehicleRecord,
  Order,
  Member,
  Device,
  Ticket,
  ZoneStats,
  HourlyTraffic,
  DailyRevenue,
  Coupon,
  BillingCalculation,
} from '@/types';
import { PARKING_ZONES, HOURLY_RATE, MAX_DAILY_RATE, FREE_PARKING_MINUTES, VALID_COUPONS } from './constants';
import { generateRandomId, calculateDuration } from './format';

const provinces = ['京', '沪', '粤', '苏', '浙', '川', '鄂', '鲁', '豫', '冀'];
const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

function generatePlate(): string {
  const province = provinces[Math.floor(Math.random() * provinces.length)];
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const numbers = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  return province + letter + numbers;
}

function generatePhone(): string {
  return '1' + ['3', '5', '7', '8', '9'][Math.floor(Math.random() * 5)] + Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
}

const names = ['张三', '李四', '王五', '赵六', '陈七', '周八', '吴九', '郑十', '钱一', '孙二'];

export function calculateBilling(entryTime: string, exitTime: string): BillingCalculation {
  const durationMinutes = calculateDuration(entryTime, exitTime);
  const freeMinutes = FREE_PARKING_MINUTES;
  const billableMinutes = Math.max(0, durationMinutes - freeMinutes);
  const hourlyRate = HOURLY_RATE;
  const maxDailyRate = MAX_DAILY_RATE;

  const baseAmount = billableMinutes > 0 ? Math.ceil(billableMinutes / 60) * hourlyRate : 0;
  const cappedAmount = Math.min(baseAmount, maxDailyRate);
  const totalAmount = cappedAmount;

  return {
    entryTime,
    exitTime,
    durationMinutes,
    freeMinutes,
    billableMinutes,
    hourlyRate,
    maxDailyRate,
    baseAmount,
    cappedAmount,
    totalAmount,
  };
}

export function generateParkingSpots(): ParkingSpot[] {
  const spots: ParkingSpot[] = [];
  PARKING_ZONES.forEach((zone) => {
    for (let i = 1; i <= zone.spots; i++) {
      const rand = Math.random();
      let status: ParkingSpot['status'] = 'available';
      if (rand < 0.65) status = 'occupied';
      else if (rand < 0.7) status = 'reserved';
      else if (rand < 0.72) status = 'disabled';

      spots.push({
        id: `${zone.id}-${i}`,
        spotNumber: `${zone.id}${i.toString().padStart(3, '0')}`,
        zone: zone.id,
        floor: zone.floor,
        status,
        vehiclePlate: status === 'occupied' ? generatePlate() : undefined,
      });
    }
  });
  return spots;
}

export function generateVehicleRecords(count: number = 50): VehicleRecord[] {
  const records: VehicleRecord[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const isUnlicensed = Math.random() < 0.05;
    const isParked = Math.random() < 0.3;
    const entryTime = addHours(now, -Math.random() * 48);
    const exitTime = isParked ? undefined : addHours(entryTime, Math.random() * 8);

    records.push({
      id: generateRandomId(),
      plateNumber: isUnlicensed ? '无牌车' : generatePlate(),
      entryTime: entryTime.toISOString(),
      exitTime: exitTime?.toISOString(),
      status: isParked ? 'parking' : 'exited',
      isUnlicensed,
      correctedPlate: isUnlicensed && !isParked ? generatePlate() : undefined,
    });
  }

  return records.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
}

export function generateOrders(count: number = 40): Order[] {
  const orders: Order[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const entryTime = addHours(now, -Math.random() * 72);
    const exitTime = addHours(entryTime, Math.random() * 6);
    const billing = calculateBilling(entryTime.toISOString(), exitTime.toISOString());

    const hasCoupon = Math.random() < 0.3;
    const coupon = hasCoupon ? VALID_COUPONS[Math.floor(Math.random() * VALID_COUPONS.length)] : null;
    const discountAmount = coupon ? (coupon.type === 'fixed' ? coupon.value : Math.floor(billing.totalAmount * (coupon.value / 100))) : 0;
    const paidAmount = Math.max(0, billing.totalAmount - discountAmount);

    const rand = Math.random();
    let status: Order['status'] = 'paid';
    if (rand < 0.15) status = 'pending';
    else if (rand < 0.2) status = 'abnormal';
    else if (rand < 0.22) status = 'refunded';

    orders.push({
      id: 'ORD' + generateRandomId().toUpperCase(),
      plateNumber: generatePlate(),
      entryTime: entryTime.toISOString(),
      exitTime: exitTime.toISOString(),
      duration: billing.durationMinutes,
      totalAmount: billing.totalAmount,
      discountAmount,
      paidAmount,
      status,
      couponCode: coupon?.code,
      couponApplied: hasCoupon,
      invoiceRequested: Math.random() < 0.25,
      invoiceInfo: Math.random() < 0.25 ? {
        title: '某某有限公司',
        taxNumber: '91110000MA01234567',
        email: 'finance@example.com',
        requestedAt: subDays(now, Math.random() * 7).toISOString(),
      } : undefined,
      remark: status === 'abnormal' ? '车牌识别异常' : undefined,
      abnormalRemark: status === 'abnormal' ? '车牌识别异常' : undefined,
      freeMinutes: FREE_PARKING_MINUTES,
      hourlyRate: HOURLY_RATE,
      maxDailyRate: MAX_DAILY_RATE,
      createdAt: exitTime.toISOString(),
      paidAt: status === 'paid' ? exitTime.toISOString() : undefined,
    });
  }

  return orders.sort((a, b) => new Date(b.exitTime).getTime() - new Date(a.exitTime).getTime());
}

export function generateCoupons(): Coupon[] {
  return VALID_COUPONS;
}

export function generateMembers(count: number = 30): Member[] {
  const members: Member[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const cardTypes: Member['cardType'][] = ['monthly', 'quarterly', 'yearly'];
    const cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)];

    const rand = Math.random();
    let status: Member['status'] = 'active';
    if (rand < 0.15) status = 'expired';
    else if (rand < 0.2) status = 'blacklisted';

    const expireDays = cardType === 'monthly' ? 30 : cardType === 'quarterly' ? 90 : 365;
    const expireDate = status === 'expired'
      ? subDays(now, Math.floor(Math.random() * 30))
      : addDays(now, Math.floor(Math.random() * expireDays));

    members.push({
      id: generateRandomId(),
      name: names[Math.floor(Math.random() * names.length)],
      phone: generatePhone(),
      plateNumber: generatePlate(),
      cardType,
      expireDate: expireDate.toISOString(),
      status,
    });
  }

  return members;
}

export function generateDevices(): Device[] {
  const devices: Device[] = [
    { id: 'gate-1', name: '东门入口道闸', type: 'gate', location: '东入口', status: 'online', lastHeartbeat: new Date().toISOString() },
    { id: 'gate-2', name: '东门出口道闸', type: 'gate', location: '东出口', status: 'online', lastHeartbeat: new Date().toISOString() },
    { id: 'gate-3', name: '南门入口道闸', type: 'gate', location: '南入口', status: 'online', lastHeartbeat: new Date().toISOString() },
    { id: 'gate-4', name: '南门出口道闸', type: 'gate', location: '南出口', status: 'fault', lastHeartbeat: addHours(new Date(), -2).toISOString() },
    { id: 'cam-1', name: '东入口摄像机', type: 'camera', location: '东入口', status: 'online', lastHeartbeat: new Date().toISOString() },
    { id: 'cam-2', name: '东出口摄像机', type: 'camera', location: '东出口', status: 'online', lastHeartbeat: new Date().toISOString() },
    { id: 'cam-3', name: '南入口摄像机', type: 'camera', location: '南入口', status: 'offline', lastHeartbeat: addHours(new Date(), -6).toISOString() },
    { id: 'cam-4', name: '南出口摄像机', type: 'camera', location: '南出口', status: 'online', lastHeartbeat: new Date().toISOString() },
    { id: 'cam-5', name: 'B1层A区摄像机', type: 'camera', location: 'B1-A区', status: 'online', lastHeartbeat: new Date().toISOString() },
    { id: 'cam-6', name: 'B1层B区摄像机', type: 'camera', location: 'B1-B区', status: 'online', lastHeartbeat: new Date().toISOString() },
    { id: 'cam-7', name: 'B2层D区摄像机', type: 'camera', location: 'B2-D区', status: 'online', lastHeartbeat: new Date().toISOString() },
    { id: 'cam-8', name: 'B2层E区摄像机', type: 'camera', location: 'B2-E区', status: 'online', lastHeartbeat: new Date().toISOString() },
  ];
  return devices;
}

export function generateTickets(): Ticket[] {
  const tickets: Ticket[] = [
    {
      id: 'TK202401001',
      title: '停车费收费异常',
      description: '用户反映停车时间计算错误，多收了1小时费用',
      type: 'complaint',
      status: 'processing',
      priority: 'high',
      assignee: '李客服',
      creator: '张经理',
      createdAt: subDays(new Date(), 1).toISOString(),
      updatedAt: subDays(new Date(), 1).toISOString(),
      history: [
        { id: 'h1', action: '创建工单', operator: '张经理', remark: '用户投诉收费异常', timestamp: subDays(new Date(), 1).toISOString() },
        { id: 'h2', action: '分配工单', operator: '系统', remark: '分配给李客服', timestamp: subDays(new Date(), 1).toISOString() },
      ],
      relatedObject: {
        type: 'order',
        id: 'ORD123456',
        displayName: 'ORD123456 - 京A12345',
      },
    },
    {
      id: 'TK202401002',
      title: '道闸无法正常抬起',
      description: '南出口道闸故障，车辆无法正常驶出',
      type: 'fault',
      status: 'pending',
      priority: 'high',
      assignee: '王运维',
      creator: '李客服',
      createdAt: subDays(new Date(), 0).toISOString(),
      updatedAt: subDays(new Date(), 0).toISOString(),
      history: [
        { id: 'h1', action: '创建工单', operator: '李客服', remark: '现场报告道闸故障', timestamp: subDays(new Date(), 0).toISOString() },
      ],
    },
    {
      id: 'TK202401003',
      title: '月卡续费咨询',
      description: '用户咨询年卡续费优惠活动',
      type: 'consult',
      status: 'resolved',
      priority: 'low',
      assignee: '赵客服',
      creator: '赵客服',
      createdAt: subDays(new Date(), 2).toISOString(),
      updatedAt: subDays(new Date(), 2).toISOString(),
      history: [
        { id: 'h1', action: '创建工单', operator: '赵客服', remark: '用户来电咨询', timestamp: subDays(new Date(), 2).toISOString() },
        { id: 'h2', action: '处理完成', operator: '赵客服', remark: '已告知用户年卡续费8折优惠', timestamp: subDays(new Date(), 2).toISOString() },
      ],
      relatedObject: {
        type: 'member',
        id: 'MBR001',
        displayName: '张三 - 年卡会员',
      },
    },
    {
      id: 'TK202401004',
      title: '车牌识别错误',
      description: '用户车牌识别错误，需要人工纠正',
      type: 'fault',
      status: 'resolved',
      priority: 'medium',
      assignee: '李客服',
      creator: '李客服',
      createdAt: subDays(new Date(), 3).toISOString(),
      updatedAt: subDays(new Date(), 3).toISOString(),
      history: [
        { id: 'h1', action: '创建工单', operator: '李客服', remark: '车牌识别错误', timestamp: subDays(new Date(), 3).toISOString() },
        { id: 'h2', action: '处理完成', operator: '李客服', remark: '已纠正车牌信息', timestamp: subDays(new Date(), 3).toISOString() },
      ],
    },
    {
      id: 'TK202401005',
      title: '发票开具问题',
      description: '用户反映发票信息填写错误需要修改',
      type: 'consult',
      status: 'processing',
      priority: 'medium',
      assignee: '赵客服',
      creator: '赵客服',
      createdAt: subDays(new Date(), 1).toISOString(),
      updatedAt: subDays(new Date(), 1).toISOString(),
      history: [
        { id: 'h1', action: '创建工单', operator: '赵客服', remark: '用户来电', timestamp: subDays(new Date(), 1).toISOString() },
      ],
    },
  ];
  return tickets;
}

export function generateZoneStats(): ZoneStats[] {
  return PARKING_ZONES.map((zone) => {
    const occupied = Math.floor(zone.spots * (0.5 + Math.random() * 0.3));
    return {
      name: zone.name,
      total: zone.spots,
      available: zone.spots - occupied,
      occupied,
    };
  });
}

export function generateHourlyTraffic(): HourlyTraffic[] {
  const data: HourlyTraffic[] = [];
  for (let i = 0; i < 24; i++) {
    const hour = i.toString().padStart(2, '0') + ':00';
    let entry = Math.floor(Math.random() * 30) + 10;
    let exit = Math.floor(Math.random() * 25) + 5;
    if (i >= 8 && i <= 10) entry = Math.floor(Math.random() * 50) + 40;
    if (i >= 17 && i <= 20) {
      entry = Math.floor(Math.random() * 60) + 50;
      exit = Math.floor(Math.random() * 40) + 30;
    }
    if (i >= 0 && i <= 6) {
      entry = Math.floor(Math.random() * 5);
      exit = Math.floor(Math.random() * 3);
    }
    data.push({ hour, entry, exit });
  }
  return data;
}

export function generateDailyRevenue(): DailyRevenue[] {
  const data: DailyRevenue[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: formatDate(date),
      revenue: Math.floor(Math.random() * 3000) + 5000,
      orders: Math.floor(Math.random() * 200) + 100,
    });
  }
  return data;
}

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
