import { addHours, addDays, subDays, format } from 'date-fns';
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

export function generateVehicleRecords(count: number = 80): VehicleRecord[] {
  const records: VehicleRecord[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const isUnlicensed = Math.random() < 0.05;
    const isParked = Math.random() < 0.35;
    const entryTime = addHours(now, -Math.random() * 72);
    const exitTime = isParked ? undefined : addHours(entryTime, Math.random() * 8);
    const zone = PARKING_ZONES[Math.floor(Math.random() * PARKING_ZONES.length)];

    records.push({
      id: generateRandomId(),
      plateNumber: isUnlicensed ? '无牌车' : generatePlate(),
      entryTime: entryTime.toISOString(),
      exitTime: exitTime?.toISOString(),
      status: isParked ? 'parking' : 'exited',
      isUnlicensed,
      correctedPlate: isUnlicensed && !isParked ? generatePlate() : undefined,
      zone: zone.id,
      floor: zone.floor,
      orderId: !isParked ? 'ORD' + Math.floor(Math.random() * 100000) : undefined,
    });
  }

  return records.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
}

export function generateOrders(count: number = 80): Order[] {
  const orders: Order[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const entryTime = addHours(subDays(now, daysAgo), Math.random() * 12);
    const exitTime = addHours(entryTime, Math.random() * 8);
    const billing = calculateBilling(entryTime.toISOString(), exitTime.toISOString());
    const zone = PARKING_ZONES[Math.floor(Math.random() * PARKING_ZONES.length)];

    const hasCoupon = Math.random() < 0.25;
    const validCoupons = VALID_COUPONS.filter((c) => c.valid);
    const coupon = hasCoupon ? validCoupons[Math.floor(Math.random() * validCoupons.length)] : null;
    const discountAmount = coupon ? (coupon.type === 'fixed' ? coupon.value : Math.floor(billing.totalAmount * (coupon.value / 100))) : 0;
    const paidAmount = Math.max(0, billing.totalAmount - discountAmount);

    const rand = Math.random();
    let status: Order['status'] = 'paid';
    if (rand < 0.12) status = 'pending';
    else if (rand < 0.18) status = 'abnormal';
    else if (rand < 0.2) status = 'refunded';

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
      invoiceRequested: Math.random() < 0.2,
      invoiceInfo: Math.random() < 0.15 ? {
        title: '某某有限公司',
        taxNumber: '91110000MA01234567',
        email: 'finance@example.com',
        requestedAt: addHours(exitTime, 1).toISOString(),
      } : undefined,
      remark: status === 'abnormal' ? '车牌识别异常' : undefined,
      abnormalRemark: status === 'abnormal' ? '车牌识别异常' : undefined,
      freeMinutes: FREE_PARKING_MINUTES,
      hourlyRate: HOURLY_RATE,
      maxDailyRate: MAX_DAILY_RATE,
      createdAt: exitTime.toISOString(),
      paidAt: status === 'paid' ? addHours(exitTime, Math.random() * 0.5).toISOString() : undefined,
      zone: zone.id,
      floor: zone.floor,
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
    { id: 'gate-1', name: '东门入口道闸', type: 'gate', location: '东入口', status: 'online', lastHeartbeat: new Date().toISOString(), zone: 'A', floor: 'B1' },
    { id: 'gate-2', name: '东门出口道闸', type: 'gate', location: '东出口', status: 'online', lastHeartbeat: new Date().toISOString(), zone: 'A', floor: 'B1' },
    { id: 'gate-3', name: '南门入口道闸', type: 'gate', location: '南入口', status: 'online', lastHeartbeat: new Date().toISOString(), zone: 'D', floor: 'B2' },
    { id: 'gate-4', name: '南门出口道闸', type: 'gate', location: '南出口', status: 'fault', lastHeartbeat: addHours(new Date(), -2).toISOString(), zone: 'D', floor: 'B2' },
    { id: 'cam-1', name: '东入口摄像机', type: 'camera', location: '东入口', status: 'online', lastHeartbeat: new Date().toISOString(), zone: 'A', floor: 'B1' },
    { id: 'cam-2', name: '东出口摄像机', type: 'camera', location: '东出口', status: 'online', lastHeartbeat: new Date().toISOString(), zone: 'A', floor: 'B1' },
    { id: 'cam-3', name: '南入口摄像机', type: 'camera', location: '南入口', status: 'offline', lastHeartbeat: addHours(new Date(), -6).toISOString(), zone: 'D', floor: 'B2' },
    { id: 'cam-4', name: '南出口摄像机', type: 'camera', location: '南出口', status: 'online', lastHeartbeat: new Date().toISOString(), zone: 'D', floor: 'B2' },
    { id: 'cam-5', name: 'B1层A区摄像机', type: 'camera', location: 'B1-A区', status: 'online', lastHeartbeat: new Date().toISOString(), zone: 'A', floor: 'B1' },
    { id: 'cam-6', name: 'B1层B区摄像机', type: 'camera', location: 'B1-B区', status: 'online', lastHeartbeat: new Date().toISOString(), zone: 'B', floor: 'B1' },
    { id: 'cam-7', name: 'B2层D区摄像机', type: 'camera', location: 'B2-D区', status: 'online', lastHeartbeat: new Date().toISOString(), zone: 'D', floor: 'B2' },
    { id: 'cam-8', name: 'B2层E区摄像机', type: 'camera', location: 'B2-E区', status: 'online', lastHeartbeat: new Date().toISOString(), zone: 'E', floor: 'B2' },
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
      relatedObject: {
        type: 'order',
        id: 'gate-4',
        displayName: '南门出口道闸',
      },
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

export function generateHourlyTraffic(days: number = 30): HourlyTraffic[] {
  const data: HourlyTraffic[] = [];
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const date = subDays(now, d);
    const dateStr = format(date, 'MM/dd');

    PARKING_ZONES.forEach((zone) => {
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, '0') + ':00';
        let entry = Math.floor(Math.random() * 15) + 5;
        let exit = Math.floor(Math.random() * 12) + 3;

        if (i >= 8 && i <= 10) entry = Math.floor(Math.random() * 30) + 20;
        if (i >= 17 && i <= 20) {
          entry = Math.floor(Math.random() * 35) + 25;
          exit = Math.floor(Math.random() * 25) + 15;
        }
        if (i >= 0 && i <= 6) {
          entry = Math.floor(Math.random() * 3);
          exit = Math.floor(Math.random() * 2);
        }

        data.push({ hour, entry, exit, zone: zone.id, date: dateStr });
      }
    });
  }

  return data;
}

export function generateDailyRevenue(days: number = 30): DailyRevenue[] {
  const data: DailyRevenue[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(now, i);
    const dateStr = format(date, 'MM/dd');
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseRevenue = isWeekend ? 8000 : 5000;
    const baseOrders = isWeekend ? 300 : 180;

    PARKING_ZONES.forEach((zone) => {
      const zoneFactor = zone.spots / 100;
      data.push({
        date: dateStr,
        revenue: Math.floor((Math.random() * 2000 + baseRevenue) * zoneFactor * 0.3),
        orders: Math.floor((Math.random() * 100 + baseOrders) * zoneFactor * 0.3),
        zone: zone.id,
        entryTraffic: Math.floor(Math.random() * 50 + 80),
        exitTraffic: Math.floor(Math.random() * 45 + 75),
      });
    });
  }

  return data;
}
