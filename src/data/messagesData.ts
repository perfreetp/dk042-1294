// ============================================
// 消息 Mock 数据
// ============================================
import type { MessageItem } from '@/types';
import { formatDate, addDays } from '@/utils/dateUtils';

const today = new Date();

export const messageList: MessageItem[] = [
  {
    id: 'm1',
    type: 'appointment',
    title: '明天就诊提醒',
    content: '您预约了 06-17 08:00 的 B超监测 #2，请提前到院缴费挂号，记得空腹哦~',
    date: formatDate(today),
    time: '19:30',
    isRead: false,
    stage: 'ovulation'
  },
  {
    id: 'm2',
    type: 'medication',
    title: '用药提醒',
    content: '距离打促排针还有 30 分钟，请提前准备好药品和注射用具。',
    date: formatDate(today),
    time: '19:30',
    isRead: false,
    stage: 'ovulation'
  },
  {
    id: 'm3',
    type: 'family',
    title: '配偶发来消息',
    content: '亲爱的，明天早上我请假陪你一起去医院，早上7点半出发可以吗？爱你❤️',
    date: formatDate(today),
    time: '18:20',
    isRead: false
  },
  {
    id: 'm4',
    type: 'reminder',
    title: '禁忌提示',
    content: '促排期间建议多吃高蛋白食物（鸡蛋、牛奶、鱼虾），多喝水，避免剧烈运动~',
    date: formatDate(today),
    time: '09:00',
    isRead: true,
    stage: 'ovulation'
  },
  {
    id: 'm5',
    type: 'appointment',
    title: '复诊日期已确认',
    content: '王主任已确认您下次就诊日期为 06-18 08:00（B超监测 #3），已同步到日历。',
    date: formatDate(addDays(today, -1)),
    time: '15:30',
    isRead: true,
    stage: 'ovulation'
  },
  {
    id: 'm6',
    type: 'system',
    title: '检查报告已更新',
    content: '您的「性激素六项」报告已上传，请在「就诊清单-医院单据」中查看。',
    date: formatDate(addDays(today, -3)),
    time: '10:15',
    isRead: true
  },
  {
    id: 'm7',
    type: 'medication',
    title: '用药打卡成功',
    content: '您已完成今天的 阿司匹林 + 叶酸 打卡，共 2/3 项。继续加油！',
    date: formatDate(addDays(today, -1)),
    time: '08:15',
    isRead: true
  },
  {
    id: 'm8',
    type: 'reminder',
    title: '阶段小结：促排第6天',
    content: '恭喜您已完成促排阶段的60%！距离取卵手术还有 6 天，请保持良好作息，按时用药。',
    date: formatDate(addDays(today, -2)),
    time: '20:00',
    isRead: true,
    stage: 'ovulation'
  },
  {
    id: 'm9',
    type: 'family',
    title: '共享提醒：家属已查看',
    content: '您的配偶已查看了「B超监测 #2」的就诊安排，将陪您一同前往。',
    date: formatDate(addDays(today, -2)),
    time: '14:00',
    isRead: true
  },
  {
    id: 'm10',
    type: 'system',
    title: '欢迎使用IVF疗程日历',
    content: '已为您生成专属疗程计划，请确认各阶段时间是否正确。如有疑问可随时联系主治医生。',
    date: formatDate(addDays(today, -14)),
    time: '10:00',
    isRead: true
  }
];

export const getUnreadCount = (): number => {
  return messageList.filter(m => !m.isRead).length;
};
