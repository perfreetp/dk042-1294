// ============================================
// 疗程相关 Mock 数据
// ============================================
import type { StageInfo, TimelineNode, TabooItem, CalendarEvent } from '@/types';
import { formatDate, addDays } from '@/utils/dateUtils';

const today = new Date();
const startDate = addDays(today, -14);

export const stageList: StageInfo[] = [
  {
    id: 'initial',
    name: '初诊阶段',
    description: '建立病历档案，医生初步评估',
    color: '#74B9FF',
    bgColor: '#EBF5FF',
    startDate: formatDate(startDate),
    endDate: formatDate(addDays(startDate, 3)),
    status: 'completed',
    progress: 100
  },
  {
    id: 'check',
    name: '术前检查',
    description: '双方全面身体检查',
    color: '#A29BFE',
    bgColor: '#F0EEFF',
    startDate: formatDate(addDays(startDate, 4)),
    endDate: formatDate(addDays(startDate, 8)),
    status: 'completed',
    progress: 100
  },
  {
    id: 'ovulation',
    name: '促排卵',
    description: '用药促排，定期监测卵泡',
    color: '#FDCB6E',
    bgColor: '#FFF9E6',
    startDate: formatDate(addDays(startDate, 9)),
    endDate: formatDate(addDays(startDate, 18)),
    status: 'current',
    progress: 60
  },
  {
    id: 'retrieval',
    name: '取卵手术',
    description: '麻醉下取卵，术后休息',
    color: '#E17055',
    bgColor: '#FDF0EC',
    startDate: formatDate(addDays(startDate, 19)),
    endDate: formatDate(addDays(startDate, 21)),
    status: 'pending',
    progress: 0
  },
  {
    id: 'transfer',
    name: '胚胎移植',
    description: '精选优质胚胎植入子宫',
    color: '#FF8BA7',
    bgColor: '#FFF0F3',
    startDate: formatDate(addDays(startDate, 24)),
    endDate: formatDate(addDays(startDate, 24)),
    status: 'pending',
    progress: 0
  },
  {
    id: 'test',
    name: '验孕确认',
    description: '移植后14天抽血验孕',
    color: '#00B894',
    bgColor: '#E8F8F5',
    startDate: formatDate(addDays(startDate, 38)),
    endDate: formatDate(addDays(startDate, 40)),
    status: 'pending',
    progress: 0
  }
];

export const timelineNodes: TimelineNode[] = [
  {
    id: 't1',
    stage: 'initial',
    title: '首次就诊',
    date: formatDate(startDate),
    time: '09:00',
    description: '携带身份证、结婚证，建立档案',
    status: 'completed',
    isReminder: true
  },
  {
    id: 't2',
    stage: 'initial',
    title: '医生问诊',
    date: formatDate(addDays(startDate, 2)),
    time: '14:30',
    description: '了解病史，制定初步方案',
    status: 'completed',
    isReminder: false
  },
  {
    id: 't3',
    stage: 'check',
    title: '女方体检',
    date: formatDate(addDays(startDate, 5)),
    time: '08:00',
    description: '空腹抽血、B超、心电图等',
    status: 'completed',
    isReminder: true
  },
  {
    id: 't4',
    stage: 'check',
    title: '男方体检',
    date: formatDate(addDays(startDate, 6)),
    time: '09:00',
    description: '精液常规、抽血检查',
    status: 'completed',
    isReminder: true
  },
  {
    id: 't5',
    stage: 'check',
    title: '检查报告解读',
    date: formatDate(addDays(startDate, 8)),
    time: '15:00',
    description: '医生确认检查结果，进周',
    status: 'completed',
    isReminder: true
  },
  {
    id: 't6',
    stage: 'ovulation',
    title: '促排开始',
    date: formatDate(addDays(startDate, 9)),
    time: '08:30',
    description: '月经第2天，开始打促排针',
    status: 'completed',
    isReminder: true
  },
  {
    id: 't7',
    stage: 'ovulation',
    title: 'B超监测 #1',
    date: formatDate(addDays(startDate, 13)),
    time: '08:00',
    description: '检查卵泡发育情况',
    status: 'completed',
    isReminder: true
  },
  {
    id: 't8',
    stage: 'ovulation',
    title: 'B超监测 #2',
    date: formatDate(today),
    time: '08:00',
    description: '检查卵泡发育，调整药量',
    status: 'current',
    isReminder: true
  },
  {
    id: 't9',
    stage: 'ovulation',
    title: 'B超监测 #3',
    date: formatDate(addDays(today, 2)),
    time: '08:00',
    description: '预计卵泡接近成熟',
    status: 'pending',
    isReminder: true
  },
  {
    id: 't10',
    stage: 'ovulation',
    title: '打夜针',
    date: formatDate(addDays(today, 4)),
    time: '22:00',
    description: '促进卵子最后成熟，必须准时',
    status: 'pending',
    isReminder: true
  },
  {
    id: 't11',
    stage: 'retrieval',
    title: '取卵手术',
    date: formatDate(addDays(today, 6)),
    time: '08:00',
    description: '术前禁食8小时，男方同日取精',
    status: 'pending',
    isReminder: true
  },
  {
    id: 't12',
    stage: 'retrieval',
    title: '术后复查',
    date: formatDate(addDays(today, 8)),
    time: '10:00',
    description: '检查恢复情况，了解受精结果',
    status: 'pending',
    isReminder: true
  },
  {
    id: 't13',
    stage: 'transfer',
    title: '胚胎移植',
    date: formatDate(addDays(today, 11)),
    time: '09:30',
    description: '移植前憋尿，术后卧床2小时',
    status: 'pending',
    isReminder: true
  },
  {
    id: 't14',
    stage: 'test',
    title: '验孕检查',
    date: formatDate(addDays(today, 25)),
    time: '08:00',
    description: '抽血查HCG，确认是否好孕',
    status: 'pending',
    isReminder: true
  }
];

export const tabooList: TabooItem[] = [
  {
    id: 'tab1',
    stage: 'ovulation',
    category: 'food',
    title: '多吃高蛋白食物',
    description: '鸡蛋、牛奶、鱼虾、豆制品等，促进卵泡发育',
    isAllowed: true
  },
  {
    id: 'tab2',
    stage: 'ovulation',
    category: 'food',
    title: '忌生冷辛辣',
    description: '避免冰饮、生冷水果、辣椒等刺激性食物',
    isAllowed: false
  },
  {
    id: 'tab3',
    stage: 'ovulation',
    category: 'exercise',
    title: '避免剧烈运动',
    description: '卵泡发育期间卵巢增大，避免跑跳等剧烈运动',
    isAllowed: false
  },
  {
    id: 'tab4',
    stage: 'ovulation',
    category: 'lifestyle',
    title: '保证充足睡眠',
    description: '每天8小时以上睡眠，不熬夜，有利于激素分泌',
    isAllowed: true
  },
  {
    id: 'tab5',
    stage: 'ovulation',
    category: 'medication',
    title: '按时打针吃药',
    description: '严格按医嘱时间用药，切勿自行停药或调整剂量',
    isAllowed: true
  },
  {
    id: 'tab6',
    stage: 'ovulation',
    category: 'lifestyle',
    title: '保持心情放松',
    description: '避免过度紧张焦虑，可听音乐、散步调节情绪',
    isAllowed: true
  }
];

export const generateCalendarEvents = (): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  
  timelineNodes.forEach(node => {
    events.push({
      id: `evt-${node.id}`,
      date: node.date,
      title: node.title,
      type: node.stage === 'ovulation' ? 'appointment' : 'stage',
      stage: node.stage,
      isImportant: node.isReminder
    });
  });

  for (let i = 9; i <= 18; i++) {
    events.push({
      id: `med-${i}`,
      date: formatDate(addDays(startDate, i)),
      title: '打促排针',
      type: 'injection',
      stage: 'ovulation',
      isImportant: true
    });
  }

  for (let i = 9; i <= 18; i++) {
    events.push({
      id: `oral-${i}`,
      date: formatDate(addDays(startDate, i)),
      title: '口服药物',
      type: 'medication',
      stage: 'ovulation',
      isImportant: false
    });
  }

  return events;
};

export const calendarEvents = generateCalendarEvents();
