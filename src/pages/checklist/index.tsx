import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import TodoItemComp from '@/components/TodoItem';
import EmptyState from '@/components/EmptyState';

import { todoList, medicationList, documentList, expenseList, questionList } from '@/data/checklistData';
import { formatDate, isToday, parseDate, diffDays, formatDateCN } from '@/utils/dateUtils';
import type {
  TodoItem, MedicationItem, MedicalDocument,
  ExpenseRecord, QuestionCard, VisitSummary
} from '@/types';

type TabType = 'todo' | 'medication' | 'document' | 'expense' | 'question';

const tabs = [
  { key: 'todo' as TabType, label: '待办清单', icon: '📋' },
  { key: 'medication' as TabType, label: '用药记录', icon: '💊' },
  { key: 'document' as TabType, label: '医院单据', icon: '📄' },
  { key: 'expense' as TabType, label: '费用记录', icon: '💰' },
  { key: 'question' as TabType, label: '问题卡片', icon: '❓' }
];

const medTypeConfig: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  oral: { bg: '#EBF5FF', color: '#74B9FF', label: '口服药', icon: '💊' },
  injection: { bg: '#FDF0EC', color: '#E17055', label: '注射针', icon: '💉' },
  external: { bg: '#E8F8F5', color: '#00B894', label: '外用药', icon: '🧴' }
};

const docCategoryConfig: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  report: { bg: '#F0EEFF', color: '#A29BFE', label: '检查报告', icon: '🔬' },
  prescription: { bg: '#EBF5FF', color: '#74B9FF', label: '处方单据', icon: '📝' },
  invoice: { bg: '#FFF9E6', color: '#FDCB6E', label: '缴费发票', icon: '🧾' },
  other: { bg: '#FFF0F3', color: '#FF8BA7', label: '其他', icon: '📁' }
};

const expenseCategoryConfig: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  examination: { bg: '#F0EEFF', color: '#A29BFE', label: '检查费', icon: '🔬' },
  medication: { bg: '#EBF5FF', color: '#74B9FF', label: '药费', icon: '💊' },
  surgery: { bg: '#FDF0EC', color: '#E17055', label: '手术费', icon: '🏥' },
  other: { bg: '#FFF0F3', color: '#FF8BA7', label: '其他', icon: '💳' }
};

const STORAGE_KEY_DOCS = 'ivf_medical_documents';
const STORAGE_KEY_EXPENSES = 'ivf_expense_records';
const STORAGE_KEY_VISITS = 'ivf_visit_summaries';

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const data = Taro.getStorageSync(key);
    if (data && typeof data === 'string' && data.length > 0) {
      return JSON.parse(data);
    }
    return fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key: string, data: any) => {
  try {
    Taro.setStorageSync(key, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const ChecklistPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  const [todos, setTodos] = useState<TodoItem[]>(todoList);
  const [medications, setMedications] = useState(medicationList);
  const [documents, setDocuments] = useState<MedicalDocument[]>(() => loadFromStorage(STORAGE_KEY_DOCS, documentList));
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => loadFromStorage(STORAGE_KEY_EXPENSES, expenseList));
  const [questions, setQuestions] = useState<QuestionCard[]>(questionList);
  const [docCategory, setDocCategory] = useState<string>('all');
  const [expenseCategory, setExpenseCategory] = useState<string>('all');
  const [expenseHospital, setExpenseHospital] = useState<string>('all');
  const [highlightId, setHighlightId] = useState<string>('');

  const jumpToDocument = (docId: string) => {
    setDocCategory('all');
    setHighlightId(docId);
    setActiveTab('document');
    setTimeout(() => setHighlightId(''), 3000);
  };

  const jumpToExpense = (expId: string) => {
    const exp = expenses.find(e => e.id === expId);
    if (exp) {
      setExpenseCategory('all');
      setExpenseHospital(exp.hospital || 'all');
    }
    setHighlightId(expId);
    setActiveTab('expense');
    setTimeout(() => setHighlightId(''), 3000);
  };

  useEffect(() => {
    saveToStorage(STORAGE_KEY_DOCS, documents);
  }, [documents]);

  useEffect(() => {
    saveToStorage(STORAGE_KEY_EXPENSES, expenses);
  }, [expenses]);

  const todayStr = formatDate(new Date());

  // ===== 模态框状态 =====
  const [showDocModal, setShowDocModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  // 单据表单
  const [newDoc, setNewDoc] = useState<{
    imageUrl: string;
    title: string;
    category: MedicalDocument['category'];
    date: string;
    hospital: string;
    notes: string;
    createExpense: boolean;
    expenseAmount: string;
  }>({
    imageUrl: '',
    title: '',
    category: 'report',
    date: todayStr,
    hospital: '',
    notes: '',
    createExpense: false,
    expenseAmount: ''
  });

  // 费用表单
  const [newExpense, setNewExpense] = useState<{
    amount: string;
    category: ExpenseRecord['category'];
    date: string;
    hospital: string;
    description: string;
  }>({
    amount: '',
    category: 'examination',
    date: todayStr,
    hospital: '',
    description: ''
  });

  // 问题表单
  const [newQuestion, setNewQuestion] = useState('');
  const [isVisitMode, setIsVisitMode] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [answeringId, setAnsweringId] = useState<string>('');
  const [answerText, setAnswerText] = useState('');
  const [answerDoctor, setAnswerDoctor] = useState('');

  const [visitSummaries, setVisitSummaries] = useState<VisitSummary[]>(() => loadFromStorage(STORAGE_KEY_VISITS, []));
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryForm, setSummaryForm] = useState<{
    hospital: string;
    doctor: string;
    questions: Array<{ question: string; answer?: string; doctor?: string }>;
    followUps: string[];
    notes: string;
  }>({
    hospital: '',
    doctor: '',
    questions: [],
    followUps: [],
    notes: ''
  });
  const [newFollowUp, setNewFollowUp] = useState('');

  useEffect(() => {
    saveToStorage(STORAGE_KEY_VISITS, visitSummaries);
  }, [visitSummaries]);

  // ==========================================
  // 待办分组
  // ==========================================
  const todoGroups = useMemo(() => {
    const today: TodoItem[] = [];
    const tomorrow: TodoItem[] = [];
    const future: TodoItem[] = [];
    const completed: TodoItem[] = [];

    todos.forEach(todo => {
      if (todo.completed) {
        completed.push(todo);
        return;
      }
      const diff = diffDays(parseDate(todo.date), new Date());
      if (diff <= 0) today.push(todo);
      else if (diff === 1) tomorrow.push(todo);
      else future.push(todo);
    });

    return { today, tomorrow, future, completed };
  }, [todos]);

  const pendingTodos = todos.filter(t => !t.completed).length;
  const unansweredQuestions = questions.filter(q => !q.isAsked).length;
  const remindedQuestions = questions.filter(q => !q.isAsked && (q as any).isReminded).length;
  const activeMedications = medications.filter(m => !m.endDate || parseDate(m.endDate) >= new Date()).length;

  // ==========================================
  // 费用统计（基于筛选后的结果）
  // ==========================================
  const hospitalOptions = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => e.hospital && set.add(e.hospital));
    return Array.from(set);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (expenseCategory !== 'all' && e.category !== expenseCategory) return false;
      if (expenseHospital !== 'all' && e.hospital !== expenseHospital) return false;
      return true;
    });
  }, [expenses, expenseCategory, expenseHospital]);

  const totalExpense = useMemo(() =>
    filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
  , [filteredExpenses]);

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = { examination: 0, medication: 0, surgery: 0, other: 0 };
    filteredExpenses.forEach(e => { map[e.category] += e.amount; });
    return map;
  }, [filteredExpenses]);

  // ==========================================
  // 单据过滤（基于 state）
  // ==========================================
  const filteredDocs = useMemo(() =>
    docCategory === 'all'
      ? documents
      : documents.filter(d => d.category === docCategory)
  , [documents, docCategory]);

  // ==========================================
  // 问题分组（基于 state）
  // ==========================================
  const questionGroups = useMemo(() => {
    const unanswered = questions.filter(q => !q.isAsked);
    const answered = questions.filter(q => q.isAsked);
    return { unanswered, answered };
  }, [questions]);

  // ==========================================
  // 交互函数
  // ==========================================
  const handleTodoToggle = (id: string, completed: boolean) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, completed, completedAt: completed ? formatDate(new Date()) : undefined } : t
    ));
  };

  const handleMedicationCheck = (medId: string) => {
    setMedications(prev => prev.map(m => {
      if (m.id !== medId) return m;
      const next = Math.min(m.todayCompleted + 1, m.timesPerDay);
      Taro.showToast({
        title: next >= m.timesPerDay ? '今日用药已完成！' : '打卡成功',
        icon: 'none'
      });
      return { ...m, todayCompleted: next };
    }));
  };

  // ===== 单据：拍照归档 =====
  const openDocForm = () => {
    Taro.chooseImage({
      count: 1,
      success: (res) => {
        const filePath = res.tempFilePaths?.[0] || '';
        setNewDoc(prev => ({ ...prev, imageUrl: filePath }));
        setShowDocModal(true);
      },
      fail: () => {
        setNewDoc({
          imageUrl: '', title: '', category: 'report',
          date: todayStr, hospital: '', notes: '',
          createExpense: false, expenseAmount: ''
        });
        setShowDocModal(true);
      }
    });
  };

  const saveDocument = () => {
    if (!newDoc.title) {
      Taro.showToast({ title: '请填写单据名称', icon: 'none' });
      return;
    }
    if (newDoc.createExpense) {
      const amt = parseFloat(newDoc.expenseAmount);
      if (!amt || amt <= 0) {
        Taro.showToast({ title: '请输入费用金额', icon: 'none' });
        return;
      }
      if (!newDoc.date || !newDoc.date.trim()) {
        Taro.showToast({ title: '请填写日期', icon: 'none' });
        return;
      }
      if (!newDoc.hospital || !newDoc.hospital.trim()) {
        Taro.showToast({ title: '请填写医院名称', icon: 'none' });
        return;
      }
    }

    const docId = `doc-u${Date.now()}`;
    const doc: MedicalDocument = {
      id: docId,
      title: newDoc.title,
      category: newDoc.category,
      date: newDoc.date,
      hospital: newDoc.hospital || '待补充',
      imageUrl: newDoc.imageUrl || undefined,
      notes: newDoc.notes || undefined,
      relatedExpenseId: undefined
    };

    if (newDoc.createExpense) {
      const amt = parseFloat(newDoc.expenseAmount);
      const expId = `exp-u${Date.now()}`;
      const exp: ExpenseRecord = {
        id: expId,
        date: newDoc.date,
        category: 'other',
        amount: amt,
        description: newDoc.title,
        hospital: newDoc.hospital.trim(),
        relatedDocumentId: docId
      };
      doc.relatedExpenseId = expId;
      setExpenses(prev => [exp, ...prev]);
      Taro.showToast({ title: '单据和费用已关联保存！', icon: 'success' });
    } else {
      Taro.showToast({ title: '单据归档成功！', icon: 'success' });
    }

    setDocuments(prev => [doc, ...prev]);
    setShowDocModal(false);
    setNewDoc({
      imageUrl: '', title: '', category: 'report',
      date: todayStr, hospital: '', notes: '',
      createExpense: false, expenseAmount: ''
    });
  };

  // ===== 费用：录入流程 =====
  const openExpenseForm = () => {
    setNewExpense({
      amount: '', category: 'examination',
      date: todayStr, hospital: '', description: ''
    });
    setShowExpenseModal(true);
  };

  const saveExpense = () => {
    const amt = parseFloat(newExpense.amount);
    if (!amt || amt <= 0) {
      Taro.showToast({ title: '请输入有效金额', icon: 'none' });
      return;
    }
    if (!newExpense.date || !newExpense.date.trim()) {
      Taro.showToast({ title: '请填写日期', icon: 'none' });
      return;
    }
    if (!newExpense.hospital || !newExpense.hospital.trim()) {
      Taro.showToast({ title: '请填写医院名称', icon: 'none' });
      return;
    }
    const exp: ExpenseRecord = {
      id: `exp-u${Date.now()}`,
      date: newExpense.date,
      category: newExpense.category,
      amount: amt,
      description: newExpense.description || expenseCategoryConfig[newExpense.category].label,
      hospital: newExpense.hospital.trim()
    };
    setExpenses(prev => [exp, ...prev]);
    setShowExpenseModal(false);
    Taro.showToast({ title: '费用已记录！', icon: 'success' });
  };

  // ===== 问题卡片：新增 =====
  const saveQuestion = () => {
    if (!newQuestion.trim()) {
      Taro.showToast({ title: '请输入问题内容', icon: 'none' });
      return;
    }
    const q: QuestionCard = {
      id: `q-u${Date.now()}`,
      question: newQuestion.trim(),
      date: formatDateCN(new Date()),
      isAsked: false
    };
    setQuestions(prev => [q, ...prev]);
    setShowQuestionModal(false);
    setNewQuestion('');
    Taro.showToast({ title: '已保存到待咨询区', icon: 'success' });
  };

  const toggleQuestionReminder = (id: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;
      const reminded = !(q as any).isReminded;
      Taro.showToast({
        title: reminded ? '已添加到就诊提醒！' : '已取消就诊提醒',
        icon: 'none'
      });
      return { ...(q as any), isReminded: reminded };
    }));
  };

  const openAnswerModal = (id: string) => {
    setAnsweringId(id);
    setAnswerText('');
    setAnswerDoctor('');
    setShowAnswerModal(true);
  };

  const saveAnswer = () => {
    if (!answeringId) return;
    setQuestions(prev => prev.map(q => {
      if (q.id !== answeringId) return q;
      return {
        ...q,
        isAsked: true,
        answer: answerText.trim() || undefined,
        doctor: answerDoctor.trim() || undefined,
        answerDate: formatDateCN(new Date())
      };
    }));
    setShowAnswerModal(false);
    setAnsweringId('');
    Taro.showToast({ title: '已标记为已咨询', icon: 'success' });
  };

  const markAllRemindedAsAsked = () => {
    const remindedCount = questions.filter(q => !q.isAsked && (q as any).isReminded).length;
    if (remindedCount === 0) {
      Taro.showToast({ title: '暂无就诊提醒问题', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '一键标记已咨询',
      content: `确定将 ${remindedCount} 个就诊提醒问题全部标记为已咨询吗？`,
      confirmText: '全部标记',
      confirmColor: '#6EC6B7',
      success: (res) => {
        if (res.confirm) {
          setQuestions(prev => prev.map(q => {
            if (q.isAsked || !(q as any).isReminded) return q;
            return { ...q, isAsked: true, answerDate: formatDateCN(new Date()) };
          }));
          Taro.showToast({ title: '已全部标记为已咨询', icon: 'success' });
        }
      }
    });
  };

  const openSummaryForm = () => {
    const todayAsked = questions.filter(q => q.isAsked && q.answerDate === formatDateCN(new Date()));
    setSummaryForm({
      hospital: '',
      doctor: '',
      questions: todayAsked.map(q => ({
        question: q.question,
        answer: q.answer,
        doctor: q.doctor
      })),
      followUps: [],
      notes: ''
    });
    setNewFollowUp('');
    setShowSummaryModal(true);
  };

  const addFollowUp = () => {
    if (!newFollowUp.trim()) return;
    setSummaryForm(prev => ({
      ...prev,
      followUps: [...prev.followUps, newFollowUp.trim()]
    }));
    setNewFollowUp('');
  };

  const removeFollowUp = (idx: number) => {
    setSummaryForm(prev => ({
      ...prev,
      followUps: prev.followUps.filter((_, i) => i !== idx)
    }));
  };

  const saveVisitSummary = () => {
    if (!summaryForm.hospital.trim()) {
      Taro.showToast({ title: '请填写医院名称', icon: 'none' });
      return;
    }
    const summary: VisitSummary = {
      id: `visit-u${Date.now()}`,
      date: todayStr,
      hospital: summaryForm.hospital.trim(),
      doctor: summaryForm.doctor.trim() || undefined,
      questions: [...summaryForm.questions],
      followUps: [...summaryForm.followUps],
      notes: summaryForm.notes.trim() || undefined
    };
    setVisitSummaries(prev => [summary, ...prev]);
    setShowSummaryModal(false);
    Taro.showToast({ title: '就诊小结已生成！', icon: 'success' });
  };

  // ==========================================
  // 模态框通用渲染函数
  // ==========================================
  const renderModal = (
    visible: boolean,
    title: string,
    onClose: () => void,
    content: React.ReactNode,
    onSubmit: () => void,
    submitText: string = '保存'
  ) => {
    if (!visible) return null;
    return (
      <View className={styles.modalMask} onClick={onClose}>
        <View className={styles.modalSheet} onClick={e => e.stopPropagation()}>
          <View className={styles.modalHeader}>
            <Text className={styles.modalTitle}>{title}</Text>
            <View className={styles.modalClose} onClick={onClose}>✕</View>
          </View>
          {content}
          <View className={styles.modalFooter}>
            <View className={styles.cancelBtn} onClick={onClose}>
              <Text>取消</Text>
            </View>
            <View className={styles.submitBtn} onClick={onSubmit}>
              <Text>{submitText}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // ==========================================
  // 待办 Tab
  // ==========================================
  const renderTodoTab = () => {
    const groups = [
      { key: 'today', title: '📌 今日待办', data: todoGroups.today, color: '#FF8BA7' },
      { key: 'tomorrow', title: '⏰ 明日待办', data: todoGroups.tomorrow, color: '#FDCB6E' },
      { key: 'future', title: '🗓️ 未来安排', data: todoGroups.future, color: '#74B9FF' }
    ];

    return (
      <View>
        <View className={classnames(styles.summaryCard)} style={{
          background: 'linear-gradient(135deg, #6EC6B7 0%, #A8DDD3 100%)'
        }}>
          <Text className={styles.summaryTitle}>待办完成进度</Text>
          <View style={{ display: 'flex', alignItems: 'baseline', marginBottom: '16rpx' }}>
            <Text className={styles.summaryAmount}>{todos.length - pendingTodos}</Text>
            <Text style={{ fontSize: '36rpx', color: '#fff', opacity: 0.8, margin: '0 8rpx' }}>/ {todos.length}</Text>
            <Text style={{ fontSize: '28rpx', color: '#fff', opacity: 0.85 }}>
              （完成 {Math.round((todos.length - pendingTodos) / todos.length * 100)}%）
            </Text>
          </View>
          <View style={{ height: '20rpx', background: 'rgba(255,255,255,0.25)', borderRadius: '999rpx', overflow: 'hidden' }}>
            <View style={{
              height: '100%',
              width: `${(todos.length - pendingTodos) / todos.length * 100}%`,
              background: '#fff',
              borderRadius: '999rpx',
              transition: 'width 0.3s ease'
            }} />
          </View>
        </View>

        {groups.map(group => group.data.length > 0 && (
          <View key={group.key}>
            <View className={styles.groupHeader}>
              <Text className={styles.groupTitle} style={{ color: group.color }}>{group.title}</Text>
              <Text className={styles.groupCount}>{group.data.length} 项</Text>
            </View>
            {group.data.map(todo => (
              <TodoItemComp
                key={todo.id}
                id={todo.id}
                type={todo.type}
                title={todo.title}
                time={todo.time}
                description={todo.description}
                completed={todo.completed}
                isImportant={todo.isImportant}
                stage={todo.stage}
                onToggle={handleTodoToggle}
              />
            ))}
          </View>
        ))}

        {todoGroups.completed.length > 0 && (
          <View style={{ marginTop: '16rpx' }}>
            <View className={styles.groupHeader}>
              <Text className={styles.groupTitle}>✅ 已完成</Text>
              <Text className={styles.groupCount}>{todoGroups.completed.length} 项</Text>
            </View>
            {todoGroups.completed.slice(0, 3).map(todo => (
              <TodoItemComp
                key={todo.id}
                id={todo.id}
                type={todo.type}
                title={todo.title}
                time={todo.time}
                description={todo.description}
                completed={todo.completed}
                isImportant={todo.isImportant}
                stage={todo.stage}
                onToggle={handleTodoToggle}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  // ==========================================
  // 用药 Tab
  // ==========================================
  const renderMedicationTab = () => (
    <View>
      <View className={styles.summaryCard} style={{
        background: 'linear-gradient(135deg, #74B9FF 0%, #A3D5FF 100%)'
      }}>
        <Text className={styles.summaryTitle}>今日用药进度</Text>
        <View style={{ display: 'flex', alignItems: 'baseline', gap: '8rpx', marginBottom: '24rpx' }}>
          {medications.map(m => (
            <Text key={m.id} className={styles.summaryAmount} style={{ fontSize: '48rpx' }}>
              {m.todayCompleted}<Text style={{ fontSize: '24rpx', opacity: 0.7 }}>/{m.timesPerDay}</Text>
              <Text style={{ fontSize: '24rpx', margin: '0 16rpx', opacity: 0.4 }}>|</Text>
            </Text>
          ))}
        </View>
        <Text style={{ fontSize: '26rpx', opacity: 0.9 }}>
          共 {activeMedications} 种药物在使用中
        </Text>
      </View>

      {medications.map(med => {
        const config = medTypeConfig[med.type];
        const progress = Math.round(med.todayCompleted / med.timesPerDay * 100);
        const isDone = med.todayCompleted >= med.timesPerDay;

        return (
          <View
            key={med.id}
            className={styles.medCard}
            style={{ borderLeftColor: config.color }}
          >
            <View className={styles.medHeader}>
              <View className={styles.medTitleWrap}>
                <View className={styles.medTypeTag} style={{ backgroundColor: config.bg }}>
                  <Text style={{ fontSize: '20rpx' }}>{config.icon}</Text>
                  <Text className={styles.medTypeTagText} style={{ color: config.color }}>{config.label}</Text>
                </View>
                <Text className={styles.medName}>{med.name}</Text>
              </View>
              <View
                className={styles.medActionBtn}
                style={{ backgroundColor: isDone ? '#E8F8F5' : config.bg }}
                onClick={() => !isDone && handleMedicationCheck(med.id)}
              >
                <Text className={styles.medActionIcon}>{isDone ? '✅' : config.icon}</Text>
              </View>
            </View>

            <View className={styles.medMeta}>
              <View className={styles.medMetaItem}>
                <Text className={styles.medMetaIcon}>💊</Text>
                <Text className={styles.medMetaText}>{med.dosage} · {med.frequency}</Text>
              </View>
              <View className={styles.medMetaItem}>
                <Text className={styles.medMetaIcon}>⏰</Text>
                <Text className={styles.medMetaText}>提醒：{med.reminderTimes.join('、')}</Text>
              </View>
              <View className={styles.medMetaItem}>
                <Text className={styles.medMetaIcon}>📅</Text>
                <Text className={styles.medMetaText}>
                  {med.startDate.slice(5)} ~ {med.endDate ? med.endDate.slice(5) : '长期'}
                </Text>
              </View>
              <View className={styles.medMetaItem}>
                <Text className={styles.medMetaIcon}>📊</Text>
                <Text className={styles.medMetaText}>
                  总疗程 {med.endDate ? diffDays(parseDate(med.endDate), parseDate(med.startDate)) + 1 : '?'} 天
                </Text>
              </View>
            </View>

            <View className={styles.medProgress}>
              <View className={styles.progressBarMini}>
                <View
                  className={styles.progressFillMini}
                  style={{
                    width: `${progress}%`,
                    backgroundColor: isDone ? '#00B894' : config.color
                  }}
                />
              </View>
              <Text className={styles.progressTextMini} style={{
                color: isDone ? '#00B894' : config.color
              }}>
                {med.todayCompleted}/{med.timesPerDay} {isDone ? '已完成' : ''}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );

  // ==========================================
  // 单据 Tab（支持拍照+保存）
  // ==========================================
  const renderDocumentTab = () => {
    const categories = [
      { key: 'all', label: '全部' },
      { key: 'report', label: '检查报告' },
      { key: 'prescription', label: '处方' },
      { key: 'invoice', label: '发票' },
      { key: 'other', label: '其他' }
    ];

    return (
      <View>
        <ScrollView scrollX className={styles.categoryTabs} showScrollbar={false}>
          {categories.map(cat => (
            <View
              key={cat.key}
              className={classnames(styles.categoryTab, docCategory === cat.key && styles.active)}
              onClick={() => setDocCategory(cat.key)}
            >
              {cat.label}
            </View>
          ))}
        </ScrollView>

        <View className={styles.docGrid}>
          {filteredDocs.map(doc => {
            const config = docCategoryConfig[doc.category];
            const isHighlighted = highlightId === doc.id;
            return (
              <View key={doc.id} className={classnames(styles.docCard, isHighlighted && styles.highlightCard)}>
                {(doc as any).imageUrl ? (
                  <View
                    className={styles.docIconWrap}
                    style={{
                      backgroundImage: `url(${(doc as any).imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      width: '100%',
                      height: '200rpx',
                      borderRadius: '12rpx',
                      marginBottom: '16rpx'
                    }}
                  />
                ) : (
                  <View className={styles.docIconWrap} style={{ backgroundColor: config.bg }}>
                    <Text className={styles.docIcon}>{config.icon}</Text>
                  </View>
                )}
                <Text className={styles.docTitle}>{doc.title}</Text>
                <View className={styles.docMeta}>
                  <Text>🏥</Text>
                  <Text style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.hospital}</Text>
                </View>
                <View className={styles.docMeta}>
                  <Text>📅</Text>
                  <Text>{doc.date.slice(5)}</Text>
                  <Text style={{ marginLeft: 'auto', color: config.color, fontSize: '20rpx' }}>
                    {config.label}
                  </Text>
                </View>
                {doc.notes && (
                  <Text style={{
                    fontSize: '22rpx',
                    color: '#86909C',
                    lineHeight: 1.5,
                    background: '#F7F8FA',
                    padding: '8rpx 12rpx',
                    borderRadius: '8rpx',
                    marginTop: '8rpx'
                  }}>
                    {doc.notes}
                  </Text>
                )}
                {doc.relatedExpenseId && (() => {
                  const relExp = expenses.find(e => e.id === doc.relatedExpenseId);
                  if (!relExp) return null;
                  return (
                    <View
                      className={styles.linkTag}
                      onClick={() => jumpToExpense(doc.relatedExpenseId!)}
                    >
                      <Text style={{ fontSize: '22rpx', color: '#6EC6B7' }}>
                        💰 关联费用：¥{relExp.amount} · {relExp.description} →
                      </Text>
                    </View>
                  );
                })()}
              </View>
            );
          })}

          <View
            className={classnames(styles.docCard, styles.docAddCard)}
            onClick={openDocForm}
          >
            <Text className={styles.docAddIcon}>📷</Text>
            <Text className={styles.docAddText}>拍照归档</Text>
          </View>
        </View>

        {/* 单据表单模态 */}
        {renderModal(
          showDocModal,
          '📄 新增医院单据',
          () => setShowDocModal(false),
          (
            <View>
              <View
                className={styles.uploadPreview}
                onClick={() => Taro.chooseImage({
                  count: 1,
                  success: (r) => setNewDoc(prev => ({ ...prev, imageUrl: r.tempFilePaths?.[0] || prev.imageUrl }))
                })}
              >
                {newDoc.imageUrl ? (
                  <View style={{
                    width: '100%', height: '100%',
                    backgroundImage: `url(${newDoc.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '12rpx'
                  }} />
                ) : (
                  <>
                    <Text className={styles.previewIcon}>🖼️</Text>
                    <Text className={styles.previewText}>点击上传/拍照（可选）</Text>
                  </>
                )}
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>单据名称 *</Text>
                <View className={styles.formInput}>
                  <Input
                    placeholder="例如：性激素六项报告"
                    placeholderClass={styles.formPlaceholder}
                    value={newDoc.title}
                    onInput={e => setNewDoc(prev => ({ ...prev, title: e.detail.value }))}
                    style={{ width: '100%', fontSize: '28rpx' }}
                  />
                </View>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>分类</Text>
                <View className={styles.formRow}>
                  {Object.entries(docCategoryConfig).map(([key, cfg]) => (
                    <View
                      key={key}
                      className={classnames(styles.chip, newDoc.category === key && styles.active)}
                      onClick={() => setNewDoc(prev => ({ ...prev, category: key as any }))}
                    >
                      {cfg.icon} {cfg.label}
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>日期</Text>
                <View className={styles.formInput}>
                  <Input
                    type='text'
                    value={newDoc.date}
                    placeholder='YYYY-MM-DD'
                    onInput={e => setNewDoc(prev => ({ ...prev, date: e.detail.value }))}
                    style={{ width: '100%', fontSize: '28rpx' }}
                  />
                </View>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>医院 *</Text>
                <View className={styles.formInput}>
                  <Input
                    placeholder="例如：XX市妇幼保健院"
                    placeholderClass={styles.formPlaceholder}
                    value={newDoc.hospital}
                    onInput={e => setNewDoc(prev => ({ ...prev, hospital: e.detail.value }))}
                    style={{ width: '100%', fontSize: '28rpx' }}
                  />
                </View>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>备注</Text>
                <View className={styles.formInput}>
                  <Input
                    placeholder="其他需要记录的信息..."
                    placeholderClass={styles.formPlaceholder}
                    value={newDoc.notes}
                    onInput={e => setNewDoc(prev => ({ ...prev, notes: e.detail.value }))}
                    style={{ width: '100%', fontSize: '28rpx' }}
                  />
                </View>
              </View>

              <View style={{
                padding: '16rpx 20rpx',
                background: newDoc.createExpense ? '#FFF5F7' : '#F7F8FA',
                borderRadius: '12rpx',
                marginBottom: '16rpx',
                border: newDoc.createExpense ? '2rpx solid #FFC3D0' : '2rpx solid transparent'
              }}>
                <View
                  style={{ display: 'flex', alignItems: 'center', gap: '12rpx' }}
                  onClick={() => setNewDoc(prev => ({ ...prev, createExpense: !prev.createExpense }))}
                >
                  <View
                    className={classnames(styles.chip, newDoc.createExpense && styles.active)}
                    style={{ padding: '10rpx 20rpx', fontSize: '24rpx' }}
                  >
                    <Text>💰 同时生成费用记录</Text>
                  </View>
                  <Text style={{ fontSize: '22rpx', color: '#86909C' }}>保存后自动关联</Text>
                </View>
              </View>

              {newDoc.createExpense && (
                <View style={{ padding: '20rpx', background: '#FFF5F7', borderRadius: '12rpx', marginBottom: '16rpx' }}>
                  <View className={styles.formGroup} style={{ marginBottom: 0 }}>
                    <Text className={styles.formLabel}>费用金额 *</Text>
                    <View className={styles.formInput}>
                      <Input
                        type='digit'
                        placeholder="请输入金额，例如 865.50"
                        placeholderClass={styles.formPlaceholder}
                        value={newDoc.expenseAmount}
                        onInput={e => setNewDoc(prev => ({ ...prev, expenseAmount: e.detail.value }))}
                        style={{ width: '100%', fontSize: '28rpx' }}
                      />
                    </View>
                    <Text style={{ fontSize: '22rpx', color: '#B2BEC3', marginTop: '8rpx', display: 'block' }}>
                      💡 单据名称、日期、医院会自动带入费用记录
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ),
          saveDocument,
          '保存归档'
        )}
      </View>
    );
  };

  // ==========================================
  // 费用 Tab（支持完整录入）
  // ==========================================
  const renderExpenseTab = () => {
    const categories = Object.entries(expenseByCategory).filter(([_, v]) => v > 0);

    return (
      <View>
        <View className={styles.summaryCard}>
          <Text className={styles.summaryTitle}>💸 疗程累计花费</Text>
          <View style={{ display: 'flex', alignItems: 'baseline' }}>
            <Text className={styles.summaryAmountUnit}>¥</Text>
            <Text className={styles.summaryAmount}>{totalExpense.toLocaleString()}</Text>
          </View>
          <View className={styles.summaryBreakdown}>
            {categories.slice(0, 4).map(([cat, amount]) => {
              const config = expenseCategoryConfig[cat];
              return (
                <View key={cat} className={styles.summaryItem}>
                  <Text className={styles.summaryItemValue}>¥{amount}</Text>
                  <Text className={styles.summaryItemLabel}>{config.label}</Text>
                </View>
              );
            })}
            {categories.length === 0 && (
              <View className={styles.summaryItem}>
                <Text className={styles.summaryItemValue}>-</Text>
                <Text className={styles.summaryItemLabel}>暂无</Text>
              </View>
            )}
          </View>
          {(expenseCategory !== 'all' || expenseHospital !== 'all') && (
            <Text style={{ fontSize: '22rpx', opacity: 0.8, marginTop: '12rpx', display: 'block' }}>
              🔍 当前为筛选结果（共 {filteredExpenses.length} 条）
            </Text>
          )}
        </View>

        {/* 类别筛选 */}
        <ScrollView scrollX className={styles.filterRow} showScrollbar={false}>
          <View
            className={classnames(styles.filterChip, expenseCategory === 'all' && styles.active)}
            onClick={() => setExpenseCategory('all')}
          >
            全部类别
          </View>
          {Object.entries(expenseCategoryConfig).map(([key, cfg]) => (
            <View
              key={key}
              className={classnames(styles.filterChip, expenseCategory === key && styles.active)}
              onClick={() => setExpenseCategory(key)}
            >
              {cfg.icon} {cfg.label}
            </View>
          ))}
        </ScrollView>

        {/* 医院筛选 */}
        {hospitalOptions.length > 0 && (
          <ScrollView scrollX className={styles.filterRow} showScrollbar={false}>
            <View
              className={classnames(styles.filterChip, styles.filterChipSecondary, expenseHospital === 'all' && styles.active)}
              onClick={() => setExpenseHospital('all')}
            >
              全部医院
            </View>
            {hospitalOptions.map(h => (
              <View
                key={h}
                className={classnames(styles.filterChip, styles.filterChipSecondary, expenseHospital === h && styles.active)}
                onClick={() => setExpenseHospital(h)}
              >
                🏥 {h}
              </View>
            ))}
          </ScrollView>
        )}

        {filteredExpenses.slice().sort((a, b) => b.date.localeCompare(a.date)).map(exp => {
          const config = expenseCategoryConfig[exp.category];
          const relatedDoc = exp.relatedDocumentId
            ? documents.find(d => d.id === exp.relatedDocumentId)
            : undefined;
          const isHighlighted = highlightId === exp.id;
          return (
            <View key={exp.id} className={classnames(styles.expenseItem, isHighlighted && styles.highlightCard)}>
              <View className={styles.expenseLeft}>
                <View className={styles.expenseIconWrap} style={{ backgroundColor: config.bg }}>
                  <Text className={styles.expenseIcon}>{config.icon}</Text>
                </View>
                <View className={styles.expenseInfo}>
                  <Text className={styles.expenseTitle}>{exp.description}</Text>
                  <Text className={styles.expenseDate}>
                    {exp.date.slice(5)} {exp.hospital ? `· ${exp.hospital}` : ''}
                  </Text>
                  {relatedDoc && (
                    <View
                      className={styles.linkTag}
                      onClick={() => jumpToDocument(relatedDoc.id)}
                    >
                      <Text style={{ fontSize: '22rpx', color: '#FF8BA7' }}>
                        📄 关联单据：{relatedDoc.title} →
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <View className={styles.expenseRight}>
                <Text className={styles.expenseAmount}>-¥{exp.amount}</Text>
                <Text className={styles.expenseCategory} style={{ color: config.color, backgroundColor: config.bg }}>
                  {config.label}
                </Text>
              </View>
            </View>
          );
        })}

        <View
          style={{
            marginTop: '16rpx',
            padding: '24rpx',
            background: '#fff',
            borderRadius: '16rpx',
            textAlign: 'center',
            border: '2rpx dashed #FFE4EA'
          }}
          onClick={openExpenseForm}
        >
          <Text style={{ color: '#FF8BA7', fontSize: '26rpx', fontWeight: 500 }}>
            ➕ 新增费用记录
          </Text>
        </View>

        {/* 费用表单模态 */}
        {renderModal(
          showExpenseModal,
          '💰 记录费用',
          () => setShowExpenseModal(false),
          (
            <View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>金额 *</Text>
                <View className={styles.formInput}>
                  <Text style={{ fontSize: '36rpx', color: '#FF8BA7', fontWeight: 600, marginRight: '8rpx' }}>¥</Text>
                  <Input
                    type='digit'
                    placeholder="0.00"
                    placeholderClass={styles.formPlaceholder}
                    value={newExpense.amount}
                    onInput={e => setNewExpense(prev => ({ ...prev, amount: e.detail.value }))}
                    style={{ flex: 1, fontSize: '32rpx', fontWeight: 600, color: '#2D3436' }}
                  />
                </View>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>类别</Text>
                <View className={styles.formRow}>
                  {Object.entries(expenseCategoryConfig).map(([key, cfg]) => (
                    <View
                      key={key}
                      className={classnames(styles.chip, newExpense.category === key && styles.active)}
                      onClick={() => setNewExpense(prev => ({ ...prev, category: key as any }))}
                    >
                      {cfg.icon} {cfg.label}
                    </View>
                  ))}
                </View>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>费用说明（可选）</Text>
                <View className={styles.formInput}>
                  <Input
                    placeholder="例如：B超监测 #2"
                    placeholderClass={styles.formPlaceholder}
                    value={newExpense.description}
                    onInput={e => setNewExpense(prev => ({ ...prev, description: e.detail.value }))}
                    style={{ width: '100%', fontSize: '28rpx' }}
                  />
                </View>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>日期 *</Text>
                <View className={styles.formInput}>
                  <Input
                    value={newExpense.date}
                    placeholder='YYYY-MM-DD'
                    onInput={e => setNewExpense(prev => ({ ...prev, date: e.detail.value }))}
                    style={{ width: '100%', fontSize: '28rpx' }}
                  />
                </View>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>医院 *</Text>
                <View className={styles.formInput}>
                  <Input
                    placeholder="例如：XX市妇幼保健院"
                    placeholderClass={styles.formPlaceholder}
                    value={newExpense.hospital}
                    onInput={e => setNewExpense(prev => ({ ...prev, hospital: e.detail.value }))}
                    style={{ width: '100%', fontSize: '28rpx' }}
                  />
                </View>
              </View>
            </View>
          ),
          saveExpense,
          '保存记录'
        )}
      </View>
    );
  };

  // ==========================================
  // 问题卡片 Tab（支持新增 + 就诊提醒标记）
  // ==========================================
  const renderQuestionTab = () => {
    const { unanswered, answered } = questionGroups;
    const remindedUnanswered = unanswered.filter(q => (q as any).isReminded);
    const normalUnanswered = unanswered.filter(q => !(q as any).isReminded);

    return (
      <View>
        <View className={styles.summaryCard} style={{
          background: isVisitMode
            ? 'linear-gradient(135deg, #6EC6B7 0%, #A8DDD3 100%)'
            : 'linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 100%)'
        }}>
          <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text className={styles.summaryTitle}>
                {isVisitMode ? '🏥 今日就诊模式' : '💭 想问医生的问题'}
              </Text>
              <View style={{ display: 'flex', alignItems: 'baseline', marginBottom: '12rpx' }}>
                <Text className={styles.summaryAmount}>
                  {isVisitMode ? remindedUnanswered.length : unanswered.length}
                </Text>
                <Text style={{ fontSize: '28rpx', color: '#fff', opacity: 0.85, marginLeft: '8rpx' }}>
                  {isVisitMode
                    ? `个就诊提醒问题 · 共${unanswered.length}个待提问`
                    : `个待提问 · ${answered.length} 个已回答`}
                </Text>
              </View>
              <Text style={{ fontSize: '24rpx', opacity: 0.85, lineHeight: 1.5 }}>
                {isVisitMode
                  ? '📋 逐个问医生，问完点「已咨询」标记一下'
                  : '💡 就诊时带着这些问题问医生，避免忘记哦~'}
              </Text>
            </View>
            <View
              className={isVisitMode ? styles.visitModeBtnActive : styles.visitModeBtn}
              onClick={() => setIsVisitMode(!isVisitMode)}
            >
              <Text style={{ fontSize: '24rpx', fontWeight: 600 }}>
                {isVisitMode ? '退出就诊' : '进入就诊'}
              </Text>
            </View>
          </View>
        </View>

        {isVisitMode && (
          <View
            className={styles.generateSummaryBtn}
            onClick={openSummaryForm}
          >
            <Text style={{ fontSize: '28rpx', color: '#fff', fontWeight: 600 }}>
              📋 生成本次就诊小结
            </Text>
          </View>
        )}

        {isVisitMode && visitSummaries.length > 0 && (
          <View style={{ marginTop: '16rpx' }}>
            <View className={styles.groupHeader}>
              <Text className={styles.groupTitle}>📚 历史就诊小结</Text>
              <Text className={styles.groupCount}>{visitSummaries.length} 次</Text>
            </View>
            {visitSummaries.slice(0, 5).map(s => (
              <View key={s.id} className={styles.summaryCardPreview}>
                <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View>
                    <Text style={{ fontSize: '26rpx', fontWeight: 600, color: '#2D3436' }}>
                      🏥 {s.hospital}
                    </Text>
                    <Text style={{ fontSize: '22rpx', color: '#86909C', marginTop: '4rpx', display: 'block' }}>
                      📅 {s.date.slice(5)} {s.doctor ? `· ${s.doctor}` : ''}
                    </Text>
                  </View>
                  <Text style={{ fontSize: '22rpx', color: '#6EC6B7', background: '#E8F8F5', padding: '6rpx 12rpx', borderRadius: '8rpx' }}>
                    {s.questions.length} 个问题
                  </Text>
                </View>
                {s.followUps.length > 0 && (
                  <View style={{ marginTop: '12rpx' }}>
                    <Text style={{ fontSize: '22rpx', color: '#E17055', fontWeight: 500 }}>
                      ⏰ 待办：{s.followUps[0]}
                      {s.followUps.length > 1 && ` +${s.followUps.length - 1} 项`}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {isVisitMode && remindedUnanswered.length > 0 && (
          <View style={{ marginTop: '16rpx' }}>
            <View style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12rpx' }}>
              <View className={styles.groupHeader} style={{ marginBottom: 0, padding: 0 }}>
                <Text className={styles.groupTitle} style={{ color: '#E17055' }}>🔔 就诊提醒（优先问）</Text>
                <Text className={styles.groupCount}>{remindedUnanswered.length} 个</Text>
              </View>
              <Text
                style={{ fontSize: '22rpx', color: '#6EC6B7', fontWeight: 500 }}
                onClick={markAllRemindedAsAsked}
              >
                一键全部已咨询
              </Text>
            </View>
            {remindedUnanswered.map(q => (
              <View key={q.id} className={classnames(styles.questionCard, styles.unanswered, styles.visitQuestion)}>
                <View className={styles.questionHeader}>
                  <Text className={styles.questionText} style={{ marginBottom: 0 }}>{q.question}</Text>
                  <View className={styles.questionStatus} style={{ backgroundColor: '#FFF9E6' }}>
                    <Text className={styles.questionStatusText} style={{ color: '#F39C12' }}>待咨询</Text>
                  </View>
                </View>
                <View className={styles.questionFooter}>
                  <Text className={styles.questionDate}>{q.date}</Text>
                  <View className={styles.visitActionBtn} onClick={() => openAnswerModal(q.id)}>
                    <Text style={{ color: '#fff', fontSize: '24rpx', fontWeight: 600 }}>✓ 已咨询</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {isVisitMode && normalUnanswered.length > 0 && (
          <View style={{ marginTop: '16rpx' }}>
            <View className={styles.groupHeader}>
              <Text className={styles.groupTitle}>📝 其他待咨询</Text>
              <Text className={styles.groupCount}>{normalUnanswered.length} 个</Text>
            </View>
            {normalUnanswered.map(q => (
              <View key={q.id} className={classnames(styles.questionCard, styles.unanswered)}>
                <View className={styles.questionHeader}>
                  <Text className={styles.questionText} style={{ marginBottom: 0 }}>{q.question}</Text>
                  <View className={styles.questionStatus} style={{ backgroundColor: '#FFF9E6' }}>
                    <Text className={styles.questionStatusText} style={{ color: '#F39C12' }}>待咨询</Text>
                  </View>
                </View>
                <View className={styles.questionFooter}>
                  <Text className={styles.questionDate}>{q.date}</Text>
                  <View style={{ display: 'flex', gap: '16rpx', alignItems: 'center' }}>
                    <Text
                      style={{ fontSize: '24rpx', color: '#FF8BA7' }}
                      onClick={() => toggleQuestionReminder(q.id)}
                    >
                      � 设为提醒
                    </Text>
                    <View className={styles.visitActionBtnSecondary} onClick={() => openAnswerModal(q.id)}>
                      <Text style={{ color: '#6EC6B7', fontSize: '24rpx', fontWeight: 500 }}>已咨询</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {!isVisitMode && unanswered.length > 0 && (
          <View>
            <View className={styles.groupHeader}>
              <Text className={styles.groupTitle}>📝 待咨询</Text>
              <Text className={styles.groupCount}>{unanswered.length} 个</Text>
            </View>
            {unanswered.map(q => {
              const isReminded = !!(q as any).isReminded;
              return (
                <View key={q.id} className={classnames(styles.questionCard, styles.unanswered)}>
                  <View className={styles.questionHeader}>
                    <Text className={styles.questionText} style={{ marginBottom: 0 }}>{q.question}</Text>
                    <View className={styles.questionStatus} style={{ backgroundColor: '#FFF9E6' }}>
                      <Text className={styles.questionStatusText} style={{ color: '#F39C12' }}>待咨询</Text>
                    </View>
                  </View>
                  <View className={styles.questionFooter}>
                    <Text className={styles.questionDate}>{q.date}</Text>
                    <Text
                      className={isReminded ? styles.questionReminderActive : ''}
                      style={{ fontSize: '24rpx', color: isReminded ? '#E17055' : '#FF8BA7', fontWeight: isReminded ? 500 : 400 }}
                      onClick={() => toggleQuestionReminder(q.id)}
                    >
                      {isReminded ? '🔔 就诊提醒中' : '🔔 就诊时提醒我'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!isVisitMode && answered.length > 0 && (
          <View style={{ marginTop: '8rpx' }}>
            <View className={styles.groupHeader}>
              <Text className={styles.groupTitle}>✅ 已解答</Text>
              <Text className={styles.groupCount}>{answered.length} 个</Text>
            </View>
            {answered.map(q => (
              <View key={q.id} className={styles.questionCard}>
                <View className={styles.questionHeader}>
                  <Text className={styles.questionText} style={{ marginBottom: 0 }}>{q.question}</Text>
                  <View className={styles.questionStatus} style={{ backgroundColor: '#E8F8F5' }}>
                    <Text className={styles.questionStatusText} style={{ color: '#00B894' }}>已回答</Text>
                  </View>
                </View>
                {q.answer && (
                  <View className={styles.questionAnswer}>
                    <Text className={styles.answerLabel}>
                      💬 {q.doctor || '医生'}回复：
                    </Text>
                    <Text className={styles.answerText}>{q.answer}</Text>
                  </View>
                )}
                <View className={styles.questionFooter}>
                  <Text className={styles.questionDate}>{q.date}</Text>
                  {q.doctor && <Text className={styles.questionDoctor}>👩‍⚕️ {q.doctor}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        <View
          style={{
            marginTop: '16rpx',
            padding: '32rpx 24rpx',
            background: '#fff',
            borderRadius: '16rpx',
            textAlign: 'center',
            border: '2rpx dashed #DDD6FE',
            boxShadow: '0 4rpx 16rpx rgba(139, 92, 246, 0.06)'
          }}
          onClick={() => setShowQuestionModal(true)}
        >
          <Text style={{ fontSize: '48rpx', display: 'block', marginBottom: '12rpx' }}>❓</Text>
          <Text style={{ color: '#8B5CF6', fontSize: '26rpx', fontWeight: 500 }}>
            记录新问题
          </Text>
        </View>

        {/* 新增问题表单模态 */}
        {renderModal(
          showQuestionModal,
          '❓ 记录新问题',
          () => setShowQuestionModal(false),
          (
            <View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>想问医生的问题 *</Text>
                <View className={styles.formTextarea}>
                  <Input
                    placeholder="例如：促排期间肚子胀正常吗？"
                    placeholderClass={styles.formPlaceholder}
                    value={newQuestion}
                    onInput={e => setNewQuestion(e.detail.value)}
                    style={{
                      width: '100%',
                      fontSize: '28rpx',
                      minHeight: '200rpx',
                      lineHeight: '1.6'
                    }}
                  />
                </View>
              </View>
              <Text style={{ fontSize: '22rpx', color: '#B2BEC3' }}>
                💡 保存后将自动加入「待咨询」区，就诊时可一键标记提醒
              </Text>
            </View>
          ),
          saveQuestion,
          '加入待咨询'
        )}

        {/* 记录医生回复模态 */}
        {renderModal(
          showAnswerModal,
          '💬 记录医生回复',
          () => setShowAnswerModal(false),
          (
            <View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>医生姓名（可选）</Text>
                <View className={styles.formInput}>
                  <Input
                    placeholder="例如：张医生"
                    placeholderClass={styles.formPlaceholder}
                    value={answerDoctor}
                    onInput={e => setAnswerDoctor(e.detail.value)}
                    style={{ width: '100%', fontSize: '28rpx' }}
                  />
                </View>
              </View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>医生回复内容</Text>
                <View className={styles.formTextarea}>
                  <Input
                    placeholder="记录医生的回答和建议..."
                    placeholderClass={styles.formPlaceholder}
                    value={answerText}
                    onInput={e => setAnswerText(e.detail.value)}
                    style={{
                      width: '100%',
                      fontSize: '28rpx',
                      minHeight: '200rpx',
                      lineHeight: '1.6'
                    }}
                  />
                </View>
              </View>
              <Text style={{ fontSize: '22rpx', color: '#B2BEC3' }}>
                💡 保存后问题将移到「已解答」区
              </Text>
            </View>
          ),
          saveAnswer,
          '标记为已咨询'
        )}

        {/* 就诊小结模态 */}
        {renderModal(
          showSummaryModal,
          '📋 就诊小结',
          () => setShowSummaryModal(false),
          (
            <View>
              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>医院 *</Text>
                <View className={styles.formInput}>
                  <Input
                    placeholder="例如：XX市妇幼保健院"
                    placeholderClass={styles.formPlaceholder}
                    value={summaryForm.hospital}
                    onInput={e => setSummaryForm(prev => ({ ...prev, hospital: e.detail.value }))}
                    style={{ width: '100%', fontSize: '28rpx' }}
                  />
                </View>
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>医生（可选）</Text>
                <View className={styles.formInput}>
                  <Input
                    placeholder="例如：李医生"
                    placeholderClass={styles.formPlaceholder}
                    value={summaryForm.doctor}
                    onInput={e => setSummaryForm(prev => ({ ...prev, doctor: e.detail.value }))}
                    style={{ width: '100%', fontSize: '28rpx' }}
                  />
                </View>
              </View>

              {summaryForm.questions.length > 0 && (
                <View className={styles.formGroup}>
                  <Text className={styles.formLabel}>
                    📝 本次已咨询问题 ({summaryForm.questions.length}个)
                  </Text>
                  <View style={{ gap: '12rpx', display: 'flex', flexDirection: 'column' }}>
                    {summaryForm.questions.map((q, idx) => (
                      <View
                        key={idx}
                        style={{
                          background: '#F7F8FA',
                          padding: '16rpx',
                          borderRadius: '12rpx'
                        }}
                      >
                        <Text style={{ fontSize: '24rpx', fontWeight: 500, color: '#2D3436' }}>
                          Q: {q.question}
                        </Text>
                        {q.answer && (
                          <Text style={{ fontSize: '22rpx', color: '#6EC6B7', marginTop: '6rpx', display: 'block' }}>
                            A: {q.answer}
                          </Text>
                        )}
                        {!q.answer && (
                          <Text style={{ fontSize: '22rpx', color: '#B2BEC3', marginTop: '6rpx', display: 'block' }}>
                            (未记录医生回复)
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>⏰ 后续待办</Text>
                <View style={{ display: 'flex', gap: '12rpx', marginBottom: '12rpx' }}>
                  <View className={styles.formInput} style={{ flex: 1, marginBottom: 0 }}>
                    <Input
                      placeholder="例如：3天后复查血值"
                      placeholderClass={styles.formPlaceholder}
                      value={newFollowUp}
                      onInput={e => setNewFollowUp(e.detail.value)}
                      style={{ width: '100%', fontSize: '28rpx' }}
                      onConfirm={addFollowUp}
                    />
                  </View>
                  <View
                    className={styles.visitActionBtn}
                    style={{ padding: '0 28rpx', height: '80rpx' }}
                    onClick={addFollowUp}
                  >
                    <Text style={{ color: '#fff', fontSize: '24rpx', fontWeight: 600 }}>添加</Text>
                  </View>
                </View>
                {summaryForm.followUps.length > 0 && (
                  <View style={{ gap: '8rpx', display: 'flex', flexDirection: 'column' }}>
                    {summaryForm.followUps.map((item, idx) => (
                      <View
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12rpx 16rpx',
                          background: '#FFF9E6',
                          borderRadius: '8rpx'
                        }}
                      >
                        <Text style={{ fontSize: '24rpx', color: '#E17055' }}>
                          ⏰ {item}
                        </Text>
                        <Text
                          style={{ fontSize: '24rpx', color: '#B2BEC3', padding: '4rpx 8rpx' }}
                          onClick={() => removeFollowUp(idx)}
                        >
                          ✕
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View className={styles.formGroup}>
                <Text className={styles.formLabel}>备注（可选）</Text>
                <View className={styles.formInput}>
                  <Input
                    placeholder="其他需要记录的信息..."
                    placeholderClass={styles.formPlaceholder}
                    value={summaryForm.notes}
                    onInput={e => setSummaryForm(prev => ({ ...prev, notes: e.detail.value }))}
                    style={{ width: '100%', fontSize: '28rpx' }}
                  />
                </View>
              </View>
            </View>
          ),
          saveVisitSummary,
          '保存就诊小结'
        )}
      </View>
    );
  };

  // ==========================================
  // Tab Badge
  // ==========================================
  const getBadge = (tab: TabType): number | null => {
    switch (tab) {
      case 'todo': return pendingTodos > 0 ? pendingTodos : null;
      case 'question': return unansweredQuestions > 0 ? unansweredQuestions : null;
      default: return null;
    }
  };

  return (
    <ScrollView className={styles.page} scrollY>
      <View className='page-container'>
        {/* Tab Bar */}
        <ScrollView scrollX className={styles.tabBar} showScrollbar={false}>
          {tabs.map(tab => {
            const badge = getBadge(tab.key);
            return (
              <View
                key={tab.key}
                className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
                style={{ position: 'relative' }}
                onClick={() => setActiveTab(tab.key)}
              >
                {badge && (
                  <View className={styles.tabBadge}>{badge > 99 ? '99+' : badge}</View>
                )}
                <Text className={styles.tabIcon}>{tab.icon}</Text>
                <Text className={styles.tabLabel}>{tab.label}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Tab 内容 */}
        {activeTab === 'todo' && renderTodoTab()}
        {activeTab === 'medication' && renderMedicationTab()}
        {activeTab === 'document' && renderDocumentTab()}
        {activeTab === 'expense' && renderExpenseTab()}
        {activeTab === 'question' && renderQuestionTab()}

        <View style={{ height: '40rpx' }} />
      </View>
    </ScrollView>
  );
};

export default ChecklistPage;
