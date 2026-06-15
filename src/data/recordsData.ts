// ============================================
// 身体记录 Mock 数据
// ============================================
import type { BodyRecord, PregnancyTest } from '@/types';
import { formatDate, addDays } from '@/utils/dateUtils';

const today = new Date();
const startDate = addDays(today, -13);

export const bodyRecords: BodyRecord[] = [
  {
    id: 'br1',
    date: formatDate(addDays(today, -1)),
    temperature: 36.7,
    weight: 52.3,
    symptoms: ['轻微腹胀', '乳房触痛'],
    mood: '平静',
    moodLevel: 4,
    notes: '今天感觉腹胀比昨天明显一点',
    isAbnormal: false
  },
  {
    id: 'br2',
    date: formatDate(addDays(today, -2)),
    temperature: 36.6,
    weight: 52.1,
    symptoms: ['情绪波动'],
    mood: '焦虑',
    moodLevel: 3,
    notes: '想到取卵有点紧张',
    isAbnormal: false
  },
  {
    id: 'br3',
    date: formatDate(addDays(today, -3)),
    temperature: 36.5,
    weight: 52.0,
    symptoms: [],
    mood: '愉快',
    moodLevel: 5,
    notes: '今天状态不错，出去散了步',
    isAbnormal: false
  },
  {
    id: 'br4',
    date: formatDate(addDays(today, -4)),
    temperature: 36.8,
    weight: 51.9,
    symptoms: ['注射部位酸痛'],
    mood: '平静',
    moodLevel: 4,
    isAbnormal: false
  },
  {
    id: 'br5',
    date: formatDate(addDays(today, -5)),
    temperature: 36.7,
    weight: 51.8,
    symptoms: ['头晕'],
    mood: '疲惫',
    moodLevel: 2,
    notes: '下午突然头晕，躺了一会儿好转',
    isAbnormal: true
  },
  {
    id: 'br6',
    date: formatDate(addDays(today, -6)),
    temperature: 36.6,
    weight: 51.9,
    symptoms: [],
    mood: '平静',
    moodLevel: 4,
    isAbnormal: false
  },
  {
    id: 'br7',
    date: formatDate(addDays(today, -7)),
    temperature: 36.5,
    weight: 51.7,
    symptoms: ['食欲下降'],
    mood: '焦虑',
    moodLevel: 3,
    isAbnormal: false
  }
];

export const pregnancyTests: PregnancyTest[] = [];

export const symptomOptions = [
  '腹胀', '轻微腹胀', '严重腹胀',
  '腹痛', '乳房触痛', '乳房胀痛',
  '头晕', '头痛', '恶心', '呕吐',
  '食欲下降', '食欲增加',
  '疲惫', '失眠', '嗜睡',
  '情绪波动', '焦虑', '低落',
  '注射部位酸痛', '注射部位红肿',
  '阴道出血', '阴道分泌物增多',
  '呼吸困难', '胸闷', '尿量减少'
];

export const moodOptions = [
  { label: '愉快', emoji: '😊', level: 5 },
  { label: '平静', emoji: '😌', level: 4 },
  { label: '一般', emoji: '😐', level: 3 },
  { label: '焦虑', emoji: '😟', level: 2 },
  { label: '低落', emoji: '😢', level: 1 }
];
