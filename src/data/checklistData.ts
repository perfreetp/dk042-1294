// ============================================
// 就诊清单 Mock 数据
// ============================================
import type { TodoItem, MedicationRecord, MedicalDocument, ExpenseRecord, QuestionCard } from '@/types';
import { formatDate, addDays } from '@/utils/dateUtils';

const today = new Date();
const startDate = addDays(today, -14);

export const todoList: TodoItem[] = [
  {
    id: 'todo1',
    type: 'appointment',
    title: 'B超监测卵泡 #2',
    date: formatDate(today),
    time: '08:00',
    description: '请空腹，提前半小时到院缴费挂号',
    completed: false,
    isImportant: true,
    stage: 'ovulation'
  },
  {
    id: 'todo2',
    type: 'injection',
    title: '打促排针 果纳芬',
    date: formatDate(today),
    time: '20:00',
    description: '剂量 225IU，皮下注射，左右腹交替',
    completed: false,
    isImportant: true,
    stage: 'ovulation'
  },
  {
    id: 'todo3',
    type: 'medication',
    title: '口服 阿司匹林',
    date: formatDate(today),
    time: '08:00',
    description: '饭后服用，25mg 每日一次',
    completed: true,
    completedAt: formatDate(today) + ' 08:15',
    isImportant: false,
    stage: 'ovulation'
  },
  {
    id: 'todo4',
    type: 'medication',
    title: '口服 叶酸',
    date: formatDate(today),
    time: '08:00',
    description: '0.4mg 每日一次',
    completed: true,
    completedAt: formatDate(today) + ' 08:15',
    isImportant: false,
    stage: 'ovulation'
  },
  {
    id: 'todo5',
    type: 'checkup',
    title: 'B超监测 #3',
    date: formatDate(addDays(today, 2)),
    time: '08:00',
    description: '',
    completed: false,
    isImportant: true,
    stage: 'ovulation'
  },
  {
    id: 'todo6',
    type: 'injection',
    title: '打夜针 HCG',
    date: formatDate(addDays(today, 4)),
    time: '22:00',
    description: '必须在指定时间精确注射，提前10分钟准备',
    completed: false,
    isImportant: true,
    stage: 'ovulation'
  },
  {
    id: 'todo7',
    type: 'appointment',
    title: '取卵手术',
    date: formatDate(addDays(today, 6)),
    time: '08:00',
    description: '术前禁食禁水8小时，穿宽松衣物',
    completed: false,
    isImportant: true,
    stage: 'retrieval'
  },
  {
    id: 'todo8',
    type: 'other',
    title: '准备取卵用品',
    date: formatDate(addDays(today, 5)),
    description: '身份证、结婚证、卫生巾、水杯',
    completed: false,
    isImportant: false,
    stage: 'retrieval'
  }
];

export const medicationList: MedicationRecord[] = [
  {
    id: 'med1',
    name: '果纳芬 重组促卵泡素',
    dosage: '225IU',
    type: 'injection',
    frequency: '每日一次',
    startTime: formatDate(addDays(startDate, 9)),
    endTime: formatDate(addDays(today, 4)),
    timesPerDay: 1,
    reminderTimes: ['20:00'],
    todayCompleted: 0
  },
  {
    id: 'med2',
    name: '阿司匹林肠溶片',
    dosage: '25mg',
    type: 'oral',
    frequency: '每日一次',
    startTime: formatDate(addDays(startDate, 9)),
    endTime: formatDate(addDays(today, 15)),
    timesPerDay: 1,
    reminderTimes: ['08:00'],
    todayCompleted: 1
  },
  {
    id: 'med3',
    name: '叶酸片',
    dosage: '0.4mg',
    type: 'oral',
    frequency: '每日一次',
    startTime: formatDate(addDays(startDate, -30)),
    endTime: formatDate(addDays(today, 30)),
    timesPerDay: 1,
    reminderTimes: ['08:00'],
    todayCompleted: 1
  },
  {
    id: 'med4',
    name: '维生素E软胶囊',
    dosage: '100mg',
    type: 'oral',
    frequency: '每日一次',
    startTime: formatDate(addDays(startDate, 9)),
    timesPerDay: 1,
    reminderTimes: ['12:00'],
    todayCompleted: 1
  }
];

export const documentList: MedicalDocument[] = [
  {
    id: 'doc1',
    title: '血常规检查报告',
    category: 'report',
    date: formatDate(addDays(startDate, 5)),
    hospital: 'XX市妇幼保健院',
    notes: '一切正常'
  },
  {
    id: 'doc2',
    title: '性激素六项报告',
    category: 'report',
    date: formatDate(addDays(startDate, 5)),
    hospital: 'XX市妇幼保健院',
    notes: 'FSH偏高，医生已确认不影响'
  },
  {
    id: 'doc3',
    title: 'B超监测单 #1',
    category: 'report',
    date: formatDate(addDays(startDate, 13)),
    hospital: 'XX市妇幼保健院',
    notes: '卵泡数 左5 右6'
  },
  {
    id: 'doc4',
    title: '促排药物处方',
    category: 'prescription',
    date: formatDate(addDays(startDate, 9)),
    hospital: 'XX市妇幼保健院'
  },
  {
    id: 'doc5',
    title: '首次缴费发票',
    category: 'invoice',
    date: formatDate(addDays(startDate, 1)),
    hospital: 'XX市妇幼保健院',
    notes: '检查费 3800元'
  },
  {
    id: 'doc6',
    title: '药费收据',
    category: 'invoice',
    date: formatDate(addDays(startDate, 9)),
    hospital: 'XX市妇幼保健院',
    notes: '促排药 5200元'
  }
];

export const expenseList: ExpenseRecord[] = [
  {
    id: 'exp1',
    date: formatDate(addDays(startDate, 1)),
    category: 'examination',
    amount: 3800,
    description: '双方术前全面检查',
    hospital: 'XX市妇幼保健院'
  },
  {
    id: 'exp2',
    date: formatDate(addDays(startDate, 9)),
    category: 'medication',
    amount: 5200,
    description: '促排药物（果纳芬等）',
    hospital: 'XX市妇幼保健院'
  },
  {
    id: 'exp3',
    date: formatDate(addDays(startDate, 13)),
    category: 'examination',
    amount: 580,
    description: 'B超监测 #1 + 抽血',
    hospital: 'XX市妇幼保健院'
  },
  {
    id: 'exp4',
    date: formatDate(addDays(today, -3)),
    category: 'examination',
    amount: 580,
    description: 'B超监测 #2 + 抽血',
    hospital: 'XX市妇幼保健院'
  },
  {
    id: 'exp5',
    date: formatDate(addDays(startDate, 2)),
    category: 'other',
    amount: 360,
    description: '往返交通费、餐费',
    hospital: ''
  }
];

export const questionList: QuestionCard[] = [
  {
    id: 'q1',
    question: '促排期间肚子有点胀，正常吗？',
    answer: '轻度腹胀是正常的，卵泡发育会使卵巢增大。如果腹胀严重或伴随呼吸困难，请立即联系医生。',
    date: formatDate(addDays(today, -2)),
    isAsked: true,
    doctor: '王主任'
  },
  {
    id: 'q2',
    question: '打夜针的时间必须精确到分钟吗？',
    date: formatDate(today),
    isAsked: false
  },
  {
    id: 'q3',
    question: '取卵后多久可以正常上班？',
    date: formatDate(today),
    isAsked: false
  },
  {
    id: 'q4',
    question: '移植后需要一直卧床吗？',
    date: formatDate(addDays(today, 1)),
    isAsked: false
  }
];
