import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import TodoItemComp from '@/components/TodoItem';
import EmptyState from '@/components/EmptyState';

import { todoList, medicationList, documentList, expenseList, questionList } from '@/data/checklistData';
import { formatDate, isToday, parseDate, diffDays, formatDateCN } from '@/utils/dateUtils';
import type { TodoItem, MedicationRecord, MedicalDocument, ExpenseRecord, QuestionCard } from '@/types';

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

const ChecklistPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  const [todos, setTodos] = useState<TodoItem[]>(todoList);
  const [medications, setMedications] = useState(medicationList);
  const [docCategory, setDocCategory] = useState<string>('all');

  const todayStr = formatDate(new Date());

  // 待办分组
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
  const unansweredQuestions = questionList.filter(q => !q.isAsked).length;
  const activeMedications = medications.filter(m => !m.endDate || parseDate(m.endDate) >= new Date()).length;

  // 费用统计
  const totalExpense = expenseList.reduce((sum, e) => sum + e.amount, 0);
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = { examination: 0, medication: 0, surgery: 0, other: 0 };
    expenseList.forEach(e => { map[e.category] += e.amount; });
    return map;
  }, []);

  // 单据过滤
  const filteredDocs = docCategory === 'all'
    ? documentList
    : documentList.filter(d => d.category === docCategory);

  const handleTodoToggle = (id: string, completed: boolean) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, completed, completedAt: completed ? formatDate(new Date()) : undefined } : t
    ));
    console.log('[Checklist] 待办状态切换:', id, completed);
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

  const renderTodoTab = () => {
    const groups = [
      { key: 'today', title: '📌 今日待办', data: todoGroups.today, color: '#FF8BA7' },
      { key: 'tomorrow', title: '⏰ 明日待办', data: todoGroups.tomorrow, color: '#FDCB6E' },
      { key: 'future', title: '🗓️ 未来安排', data: todoGroups.future, color: '#74B9FF' }
    ];

    return (
      <View>
        {/* 完成进度 */}
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
            return (
              <View key={doc.id} className={styles.docCard}>
                <View className={styles.docIconWrap} style={{ backgroundColor: config.bg }}>
                  <Text className={styles.docIcon}>{config.icon}</Text>
                </View>
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
                    borderRadius: '8rpx'
                  }}>
                    {doc.notes}
                  </Text>
                )}
              </View>
            );
          })}

          <View
            className={classnames(styles.docCard, styles.docAddCard)}
            onClick={() => Taro.chooseImage({
              count: 1,
              success: () => Taro.showToast({ title: '上传成功', icon: 'success' })
            })}
          >
            <Text className={styles.docAddIcon}>📷</Text>
            <Text className={styles.docAddText}>拍照归档</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderExpenseTab = () => {
    const categories = Object.entries(expenseByCategory).filter(([_, v]) => v > 0);
    const categoryMap = Object.keys(expenseCategoryConfig);

    return (
      <View>
        {/* 总金额卡片 */}
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
        </View>

        {/* 费用列表 */}
        {expenseList.sort((a, b) => b.date.localeCompare(a.date)).map(exp => {
          const config = expenseCategoryConfig[exp.category];
          return (
            <View key={exp.id} className={styles.expenseItem}>
              <View className={styles.expenseLeft}>
                <View className={styles.expenseIconWrap} style={{ backgroundColor: config.bg }}>
                  <Text className={styles.expenseIcon}>{config.icon}</Text>
                </View>
                <View className={styles.expenseInfo}>
                  <Text className={styles.expenseTitle}>{exp.description}</Text>
                  <Text className={styles.expenseDate}>
                    {exp.date.slice(5)} {exp.hospital ? `· ${exp.hospital}` : ''}
                  </Text>
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
          onClick={() => Taro.showToast({ title: '添加费用记录', icon: 'none' })}
        >
          <Text style={{ color: '#FF8BA7', fontSize: '26rpx', fontWeight: 500 }}>
            ➕ 新增费用记录
          </Text>
        </View>
      </View>
    );
  };

  const renderQuestionTab = () => {
    const answered = questionList.filter(q => q.isAsked);
    const unanswered = questionList.filter(q => !q.isAsked);

    return (
      <View>
        <View className={styles.summaryCard} style={{
          background: 'linear-gradient(135deg, #8B5CF6 0%, #C4B5FD 100%)'
        }}>
          <Text className={styles.summaryTitle}>💭 想问医生的问题</Text>
          <View style={{ display: 'flex', alignItems: 'baseline', marginBottom: '16rpx' }}>
            <Text className={styles.summaryAmount}>{unanswered.length}</Text>
            <Text style={{ fontSize: '28rpx', color: '#fff', opacity: 0.85, marginLeft: '8rpx' }}>
              个待提问 · {answered.length} 个已回答
            </Text>
          </View>
          <Text style={{ fontSize: '24rpx', opacity: 0.85, lineHeight: 1.5 }}>
            💡 就诊时带着这些问题问医生，避免忘记哦~
          </Text>
        </View>

        {/* 未回答 */}
        {unanswered.length > 0 && (
          <View>
            <View className={styles.groupHeader}>
              <Text className={styles.groupTitle}>📝 待咨询</Text>
              <Text className={styles.groupCount}>{unanswered.length} 个</Text>
            </View>
            {unanswered.map(q => (
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
                    style={{ fontSize: '24rpx', color: '#FF8BA7' }}
                    onClick={() => Taro.showToast({ title: '已添加到就诊提醒', icon: 'none' })}
                  >
                    🔔 就诊时提醒我
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 已回答 */}
        {answered.length > 0 && (
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

        {/* 新增提问 */}
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
          onClick={() => Taro.showModal({
            title: '记录新问题',
            editable: true,
            placeholderText: '输入你想问医生的问题...',
            confirmText: '保存',
            confirmColor: '#8B5CF6',
            success: (res) => {
              if (res.confirm && res.content) {
                Taro.showToast({ title: '问题已保存', icon: 'success' });
              }
            }
          })}
        >
          <Text style={{ fontSize: '48rpx', display: 'block', marginBottom: '12rpx' }}>❓</Text>
          <Text style={{ color: '#8B5CF6', fontSize: '26rpx', fontWeight: 500 }}>
            记录新问题
          </Text>
        </View>
      </View>
    );
  };

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
