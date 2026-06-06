export const STATUS_COLORS = {
  available: 'bg-emerald-500',
  occupied: 'bg-orange-500',
  reserved: 'bg-blue-500',
  disabled: 'bg-gray-500',
  online: 'bg-emerald-500',
  offline: 'bg-red-500',
  fault: 'bg-yellow-500',
  pending: 'bg-yellow-500',
  paid: 'bg-emerald-500',
  refunded: 'bg-blue-500',
  abnormal: 'bg-red-500',
  active: 'bg-emerald-500',
  expired: 'bg-gray-500',
  blacklisted: 'bg-red-500',
  processing: 'bg-blue-500',
  resolved: 'bg-emerald-500',
  closed: 'bg-gray-500',
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
  parking: 'bg-blue-500',
  exited: 'bg-gray-500',
};

export const STATUS_LABELS = {
  available: '空闲',
  occupied: '已占用',
  reserved: '预留',
  disabled: '禁用',
  online: '在线',
  offline: '离线',
  fault: '故障',
  pending: '待支付',
  paid: '已支付',
  refunded: '已退款',
  abnormal: '异常',
  active: '正常',
  expired: '已过期',
  blacklisted: '黑名单',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
  low: '低',
  medium: '中',
  high: '高',
  parking: '停车中',
  exited: '已离场',
};

export const TICKET_STATUS_LABELS = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

export const CARD_TYPE_LABELS = {
  monthly: '月卡',
  quarterly: '季卡',
  yearly: '年卡',
};

export const TICKET_TYPE_LABELS = {
  complaint: '投诉',
  consult: '咨询',
  fault: '故障',
  other: '其他',
};

export const PARKING_ZONES = [
  { id: 'A', name: 'A区', floor: 'B1', spots: 120 },
  { id: 'B', name: 'B区', floor: 'B1', spots: 100 },
  { id: 'C', name: 'C区', floor: 'B1', spots: 80 },
  { id: 'D', name: 'D区', floor: 'B2', spots: 150 },
  { id: 'E', name: 'E区', floor: 'B2', spots: 120 },
  { id: 'F', name: 'F区', floor: 'B2', spots: 90 },
];

export const HOURLY_RATE = 5;
export const MAX_DAILY_RATE = 60;
export const FREE_PARKING_MINUTES = 30;

export const VALID_COUPONS = [
  { code: 'NEWUSER10', value: 10, type: 'fixed' as const, valid: true, minAmount: 20, description: '新用户专享10元券' },
  { code: 'VIP20', value: 20, type: 'fixed' as const, valid: true, minAmount: 50, description: 'VIP会员20元抵扣券' },
  { code: 'DISCOUNT20', value: 20, type: 'percent' as const, valid: true, minAmount: 30, description: '8折优惠券' },
  { code: 'FREE5', value: 5, type: 'fixed' as const, valid: true, minAmount: 0, description: '5元无门槛券' },
  { code: 'SUMMER15', value: 15, type: 'fixed' as const, valid: true, minAmount: 40, description: '夏季特惠15元券' },
  { code: 'EXPIRED01', value: 10, type: 'fixed' as const, valid: false, minAmount: 0, description: '已过期优惠券' },
];

export const ASSIGNEES = ['张经理', '李客服', '王运维', '赵客服', '陈运维'];
