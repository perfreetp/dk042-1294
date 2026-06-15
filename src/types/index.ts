// ============================================
// 全局类型定义
// ============================================

// 疗程阶段枚举
export type TreatmentStage = 'initial' | 'check' | 'ovulation' | 'retrieval' | 'transfer' | 'test';

// 疗程阶段信息
export interface StageInfo {
  id: TreatmentStage;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  startDate: string;
  endDate?: string;
  status: 'pending' | 'current' | 'completed';
  progress: number;
}

// 时间线节点
export interface TimelineNode {
  id: string;
  stage: TreatmentStage;
  title: string;
  date: string;
  time?: string;
  description: string;
  status: 'pending' | 'current' | 'completed' | 'warning';
  isReminder: boolean;
}

// 待办事项类型
export type TodoType = 'checkup' | 'medication' | 'injection' | 'appointment' | 'other';

// 待办事项
export interface TodoItem {
  id: string;
  type: TodoType;
  title: string;
  date: string;
  time?: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  isImportant: boolean;
  stage: TreatmentStage;
}

// 用药记录
export interface MedicationRecord {
  id: string;
  name: string;
  dosage: string;
  type: 'oral' | 'injection' | 'external';
  frequency: string;
  startTime: string;
  endTime?: string;
  timesPerDay: number;
  reminderTimes: string[];
  todayCompleted: number;
}

// 身体记录
export interface BodyRecord {
  id: string;
  date: string;
  temperature?: number;
  weight?: number;
  symptoms: string[];
  mood: string;
  moodLevel: number; // 1-5
  notes?: string;
  isAbnormal: boolean;
}

// 验孕记录
export interface PregnancyTest {
  id: string;
  date: string;
  daysAfterTransfer: number;
  hcgValue?: number;
  result: 'positive' | 'negative' | 'pending';
  testType: 'urine' | 'blood';
  notes?: string;
  imageUrl?: string;
}

// 医院单据
export interface MedicalDocument {
  id: string;
  title: string;
  category: 'report' | 'prescription' | 'invoice' | 'other';
  date: string;
  hospital: string;
  imageUrl?: string;
  notes?: string;
}

// 费用记录
export interface ExpenseRecord {
  id: string;
  date: string;
  category: 'examination' | 'medication' | 'surgery' | 'other';
  amount: number;
  description: string;
  hospital?: string;
}

// 问题卡片
export interface QuestionCard {
  id: string;
  question: string;
  answer?: string;
  date: string;
  isAsked: boolean;
  doctor?: string;
}

// 消息类型
export type MessageType = 'reminder' | 'system' | 'family' | 'appointment' | 'medication';

// 消息
export interface MessageItem {
  id: string;
  type: MessageType;
  title: string;
  content: string;
  date: string;
  time: string;
  isRead: boolean;
  stage?: TreatmentStage;
}

// 日历事件
export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: 'checkup' | 'medication' | 'injection' | 'appointment' | 'stage' | 'reminder';
  stage?: TreatmentStage;
  isImportant: boolean;
}

// 首页统计数据
export interface HomeStats {
  currentStage: StageInfo;
  totalDays: number;
  completedChecks: number;
  totalChecks: number;
  medicationToday: number;
  medicationTotal: number;
  nextAppointment?: { date: string; title: string; daysLeft: number };
}

// 禁忌事项
export interface TabooItem {
  id: string;
  stage: TreatmentStage;
  category: 'food' | 'exercise' | 'lifestyle' | 'medication';
  title: string;
  description: string;
  isAllowed: boolean; // true = 应该做, false = 禁忌
}
