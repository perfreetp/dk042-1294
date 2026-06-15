import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Input } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import EmptyState from '@/components/EmptyState';

import { bodyRecords as initialBodyRecords, symptomOptions, moodOptions } from '@/data/recordsData';
import { formatDate, formatDateCN, parseDate, addDays, diffDays } from '@/utils/dateUtils';
import type { BodyRecord, PregnancyTest } from '@/types';

type TabType = 'diary' | 'test' | 'trend';

const tabs = [
  { key: 'diary' as TabType, label: '症状日记', icon: '📝' },
  { key: 'test' as TabType, label: '验孕结果', icon: '🤰' },
  { key: 'trend' as TabType, label: '数据趋势', icon: '📊' }
];

const abnormalSymptoms = ['严重腹胀', '剧烈腹痛', '阴道出血', '呼吸困难', '胸闷', '尿量减少', '严重头晕', '高热'];

const RecordsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('diary');

  const [recordsList, setRecordsList] = useState<BodyRecord[]>(initialBodyRecords);
  const [testsList, setTestsList] = useState<PregnancyTest[]>([]);

  const [temperature, setTemperature] = useState<string>('36.7');
  const [weight, setWeight] = useState<string>('52.3');
  const [selectedMood, setSelectedMood] = useState<number>(4);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(['轻微腹胀']);
  const [notes, setNotes] = useState<string>('');
  const [isAbnormal, setIsAbnormal] = useState<boolean>(false);

  const [showTestModal, setShowTestModal] = useState(false);
  const [newTest, setNewTest] = useState<{
    testType: 'urine' | 'blood';
    result: 'positive' | 'negative' | 'pending';
    hcgValue: string;
    notes: string;
    daysAfterTransfer: string;
  }>({
    testType: 'urine',
    result: 'pending',
    hcgValue: '',
    notes: '',
    daysAfterTransfer: ''
  });

  const todayStr = formatDate(new Date());

  const transferDate = useMemo(() => {
    const base = new Date();
    return addDays(base, 11);
  }, []);

  const daysAfterTransfer = useMemo(() => {
    const today = new Date();
    const diff = diffDays(today, transferDate);
    return diff > 0 ? diff : 0;
  }, [transferDate]);

  const daysUntilTest = Math.max(0, 14 - daysAfterTransfer);

  const allTests = useMemo(() => {
    const baseTests: PregnancyTest[] = [];
    if (daysAfterTransfer > 0) {
      for (let i = 10; i <= Math.min(daysAfterTransfer, 14); i++) {
        baseTests.push({
          id: `test-base-${i}`,
          date: formatDate(addDays(transferDate, i)),
          daysAfterTransfer: i,
          result: i < 12 ? 'negative' : i === 12 ? 'pending' : 'positive',
          testType: i >= 13 ? 'blood' : 'urine',
          hcgValue: i >= 13 ? (i - 12) * 120 : undefined,
          notes: i === 14 ? '血检确认怀孕，HCG值良好' : undefined
        });
      }
    }
    const combined = [...baseTests, ...testsList];
    combined.sort((a, b) => b.daysAfterTransfer - a.daysAfterTransfer);
    return combined;
  }, [daysAfterTransfer, transferDate, testsList]);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptom)) {
        return prev.filter(s => s !== symptom);
      }
      return [...prev, symptom];
    });
  };

  const handleSave = () => {
    const hasAbnormal = selectedSymptoms.some(s => abnormalSymptoms.includes(s)) || isAbnormal;
    const moodInfo = moodOptions.find(m => m.level === selectedMood) || moodOptions[1];

    const tempNum = parseFloat(temperature);
    const weightNum = parseFloat(weight);

    const newRecord: BodyRecord = {
      id: `br-u${Date.now()}`,
      date: todayStr,
      temperature: !isNaN(tempNum) ? tempNum : undefined,
      weight: !isNaN(weightNum) ? weightNum : undefined,
      symptoms: [...selectedSymptoms],
      mood: moodInfo.label,
      moodLevel: selectedMood,
      notes: notes.trim() || undefined,
      isAbnormal: hasAbnormal
    };

    setRecordsList(prev => [newRecord, ...prev]);

    Taro.showToast({
      title: hasAbnormal ? '已保存并标记异常！' : '记录已保存',
      icon: 'none'
    });

    setIsAbnormal(false);
  };

  const markAbnormal = () => {
    Taro.showModal({
      title: '标记异常情况',
      content: '已将今日情况标记为异常。建议及时联系医生或前往就诊，如有紧急情况请拨打120。',
      confirmText: '确认标记',
      confirmColor: '#E17055',
      success: (res) => {
        if (res.confirm) {
          setIsAbnormal(true);
          Taro.showToast({ title: '已标记异常', icon: 'none' });
        }
      }
    });
  };

  const handleAddTest = () => {
    Taro.showActionSheet({
      itemList: ['尿检验孕', '抽血HCG'],
      success: (res) => {
        const chosenType = res.tapIndex === 0 ? 'urine' : 'blood';
        setNewTest({
          testType: chosenType,
          result: 'pending',
          hcgValue: chosenType === 'blood' ? '' : '',
          notes: '',
          daysAfterTransfer: daysAfterTransfer > 0 ? String(daysAfterTransfer) : ''
        });
        setShowTestModal(true);
      }
    });
  };

  const saveTest = () => {
    const days = parseInt(newTest.daysAfterTransfer);
    if (!days || days <= 0) {
      Taro.showToast({ title: '请填写移植后天数', icon: 'none' });
      return;
    }

    const testRecord: PregnancyTest = {
      id: `test-u${Date.now()}`,
      date: formatDate(addDays(transferDate, days)),
      daysAfterTransfer: days,
      testType: newTest.testType,
      result: newTest.result,
      hcgValue: newTest.testType === 'blood' && newTest.hcgValue ? parseFloat(newTest.hcgValue) : undefined,
      notes: newTest.notes.trim() || undefined
    };

    setTestsList(prev => [testRecord, ...prev]);
    setShowTestModal(false);
    Taro.showToast({
      title: newTest.result === 'positive' ? '🎉 恭喜！好孕记录已保存' : '验孕记录已保存',
      icon: 'none'
    });
  };

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
          <View className={styles.modalBody}>{content}</View>
          <View className={styles.modalFooter}>
            <View className={styles.cancelBtn} onClick={onClose}><Text>取消</Text></View>
            <View className={styles.submitBtn} onClick={onSubmit}><Text>{submitText}</Text></View>
          </View>
        </View>
      </View>
    );
  };

  const trendDays = 7;
  const tempTrendData = useMemo(() => {
    const data = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const date = addDays(new Date(), -i);
      const record = recordsList.find(r => r.date === formatDate(date));
      data.push({
        date,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        value: record?.temperature ? String(record.temperature) : (36.5 + Math.random() * 0.3).toFixed(1)
      });
    }
    return data;
  }, [recordsList]);

  const weightTrendData = useMemo(() => {
    const data = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const date = addDays(new Date(), -i);
      const record = recordsList.find(r => r.date === formatDate(date));
      data.push({
        date,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        value: record?.weight ? String(record.weight) : (51.5 + Math.random() * 1).toFixed(1)
      });
    }
    return data;
  }, [recordsList]);

  const moodCalendarData = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const cells: Array<{ day: number | null; level: number; hasRecord: boolean }> = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, level: 0, hasRecord: false });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(new Date(year, month, d));
      const record = recordsList.find(r => r.date === dateStr);
      if (d <= today.getDate()) {
        cells.push({
          day: d,
          level: record?.moodLevel || Math.floor(Math.random() * 3) + 3,
          hasRecord: !!record
        });
      } else {
        cells.push({ day: d, level: 0, hasRecord: false });
      }
    }

    return cells;
  }, [recordsList]);

  const renderDiaryTab = () => (
    <View>
      <View className={styles.todayCard}>
        <View className={styles.cardHeader}>
          <View>
            <Text className={styles.cardTitle}>今日身体记录</Text>
            <Text className={styles.cardSubtitle}>
              {todayStr.slice(5)} · 坚持记录有助于医生了解你的情况
            </Text>
          </View>
          <View className={styles.abnormalBtn} onClick={markAbnormal}>
            <Text className={styles.abnormalIcon}>🚨</Text>
            <Text className={styles.abnormalText}>异常标记</Text>
          </View>
        </View>

        <View className={styles.vitalsGrid}>
          <View className={styles.vitalItem}>
            <Text className={styles.vitalLabel}>
              <Text className={styles.vitalIcon}>🌡️</Text>
              基础体温
            </Text>
            <View>
              <Text className={styles.vitalValue}>
                {temperature}
                <Text className={styles.vitalUnit}>°C</Text>
              </Text>
            </View>
            <Text className={styles.vitalTrend}>↗️ 比昨天高0.1°C</Text>
          </View>
          <View className={styles.vitalItem}>
            <Text className={styles.vitalLabel}>
              <Text className={styles.vitalIcon}>⚖️</Text>
              当前体重
            </Text>
            <View>
              <Text className={styles.vitalValue}>
                {weight}
                <Text className={styles.vitalUnit}>kg</Text>
              </Text>
            </View>
            <Text className={styles.vitalTrend} style={{ color: '#FF8BA7' }}>↗️ +0.2kg</Text>
          </View>
        </View>

        <View className={styles.sectionBlock}>
          <Text className={styles.sectionLabel}>
            <Text>😊</Text> 今日心情
          </Text>
          <View className={styles.moodGrid}>
            {moodOptions.map((mood, idx) => (
              <View
                key={idx}
                className={classnames(styles.moodItem, selectedMood === mood.level && styles.selected)}
                onClick={() => setSelectedMood(mood.level)}
              >
                <Text className={styles.moodEmoji}>{mood.emoji}</Text>
                <Text className={styles.moodLabel}>{mood.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.sectionBlock}>
          <Text className={styles.sectionLabel}>
            <Text>🏷️</Text> 身体症状（可多选）
          </Text>
          <View className={styles.symptomsWrap}>
            {symptomOptions.slice(0, 16).map(symptom => (
              <View
                key={symptom}
                className={classnames(
                  styles.symptomTag,
                  selectedSymptoms.includes(symptom) && styles.selected,
                  abnormalSymptoms.includes(symptom) && styles.abnormal
                )}
                onClick={() => toggleSymptom(symptom)}
              >
                {symptom}
              </View>
            ))}
          </View>
        </View>

        <View className={styles.sectionBlock}>
          <Text className={styles.sectionLabel}>
            <Text>💭</Text> 想说点什么...
          </Text>
          <View className={styles.notesInputWrap}>
            <Text
              className={styles.notesInput}
              onClick={() => Taro.showModal({
                title: '记录备注',
                editable: true,
                placeholderText: '记录今天的感受、疑问或其他情况...',
                content: notes,
                confirmText: '保存',
                success: (res) => {
                  if (res.confirm && res.content !== undefined) {
                    setNotes(res.content);
                  }
                }
              })}
            >
              {notes || '点击添加备注...'}
            </Text>
          </View>
        </View>

        {isAbnormal && (
          <View style={{
            padding: '16rpx 20rpx',
            background: '#FFF6F4',
            borderRadius: '12rpx',
            marginBottom: '20rpx',
            border: '2rpx solid #FAB1A0'
          }}>
            <Text style={{ fontSize: '24rpx', color: '#E17055', fontWeight: 600 }}>
              ⚠️ 本条记录将标记为异常
            </Text>
          </View>
        )}

        <View className={styles.saveBtn} onClick={handleSave}>
          <Text className={styles.saveBtnText}>💾 保存今日记录</Text>
        </View>
      </View>

      <View className={styles.historyHeader}>
        <Text className={styles.historyTitle}>
          <Text>📚</Text> 历史记录
        </Text>
        <Text style={{ fontSize: '24rpx', color: '#B2BEC3' }}>共 {recordsList.length} 条</Text>
      </View>

      <View className={styles.historyList}>
        {recordsList.length === 0 ? (
          <View style={{ padding: '40rpx 0' }}>
            <EmptyState icon='📝' title='暂无历史记录' description='保存今日记录后，这里会显示你的身体记录时间线' />
          </View>
        ) : (
          recordsList.map(record => {
            const date = parseDate(record.date);
            const moodInfo = moodOptions.find(m => m.level === record.moodLevel) || moodOptions[1];
            return (
              <View
                key={record.id}
                className={classnames(styles.historyItem, record.isAbnormal && styles.abnormal)}
              >
                <View className={styles.historyDate}>
                  <Text className={styles.historyDay}>{date.getDate()}</Text>
                  <Text className={styles.historyMonth}>{date.getMonth() + 1}月</Text>
                </View>
                <View className={styles.historyContent}>
                  <View className={styles.historyTop}>
                    <View className={styles.historyMood}>
                      <Text className={styles.historyMoodEmoji}>{moodInfo.emoji}</Text>
                      <Text className={styles.historyMoodText}>{moodInfo.label}</Text>
                    </View>
                    {record.isAbnormal && (
                      <Text className={styles.historyAbnormalTag}>⚠️ 异常</Text>
                    )}
                  </View>
                  <View className={styles.historyVitals}>
                    {record.temperature && (
                      <Text className={styles.historyVital}>
                        🌡️ <Text className={styles.historyVitalValue}>{record.temperature}°C</Text>
                      </Text>
                    )}
                    {record.weight && (
                      <Text className={styles.historyVital}>
                        ⚖️ <Text className={styles.historyVitalValue}>{record.weight}kg</Text>
                      </Text>
                    )}
                  </View>
                  {record.symptoms.length > 0 && (
                    <View className={styles.historySymptoms}>
                      {record.symptoms.slice(0, 5).map(s => (
                        <Text key={s} className={styles.historySymptom}>{s}</Text>
                      ))}
                      {record.symptoms.length > 5 && (
                        <Text className={styles.historySymptom}>+{record.symptoms.length - 5}</Text>
                      )}
                    </View>
                  )}
                  {record.notes && (
                    <Text style={{
                      fontSize: '22rpx',
                      color: '#86909C',
                      marginTop: '8rpx',
                      lineHeight: 1.5
                    }}>
                      💭 {record.notes}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );

  const testModalContent = (
    <View>
      <View className={styles.formGroup}>
        <Text className={styles.formLabel}>检测方式</Text>
        <View className={styles.chipGroup}>
          <View
            className={classnames(styles.chip, newTest.testType === 'urine' && styles.active)}
            onClick={() => setNewTest(prev => ({ ...prev, testType: 'urine' }))}
          >
            <Text>🧪 尿检验孕</Text>
          </View>
          <View
            className={classnames(styles.chip, newTest.testType === 'blood' && styles.active)}
            onClick={() => setNewTest(prev => ({ ...prev, testType: 'blood' }))}
          >
            <Text>🩸 抽血HCG</Text>
          </View>
        </View>
      </View>

      <View className={styles.formGroup}>
        <Text className={styles.formLabel}>检测结果</Text>
        <View className={styles.chipGroup}>
          <View
            className={classnames(styles.chip, styles.negative, newTest.result === 'negative' && styles.active)}
            onClick={() => setNewTest(prev => ({ ...prev, result: 'negative' }))}
          >
            <Text>❌ 阴性</Text>
          </View>
          <View
            className={classnames(styles.chip, styles.pending, newTest.result === 'pending' && styles.active)}
            onClick={() => setNewTest(prev => ({ ...prev, result: 'pending' }))}
          >
            <Text>⏳ 待定/灰印</Text>
          </View>
          <View
            className={classnames(styles.chip, styles.positive, newTest.result === 'positive' && styles.active)}
            onClick={() => setNewTest(prev => ({ ...prev, result: 'positive' }))}
          >
            <Text>✅ 阳性</Text>
          </View>
        </View>
      </View>

      <View className={styles.formGroup}>
        <Text className={styles.formLabel}>移植后天数（Dxx）</Text>
        <Input
          className={styles.formInput}
          type='number'
          placeholder='例如：12'
          placeholderClass={styles.formPlaceholder}
          value={newTest.daysAfterTransfer}
          onInput={e => setNewTest(prev => ({ ...prev, daysAfterTransfer: e.detail.value }))}
        />
        <Text className={styles.inputInlineHint}>
          今天是移植后第 {daysAfterTransfer} 天（D{daysAfterTransfer}）
        </Text>
      </View>

      {newTest.testType === 'blood' && (
        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>HCG 数值（mIU/mL）</Text>
          <Input
            className={styles.formInput}
            type='digit'
            placeholder='例如：356.8（血检必填）'
            placeholderClass={styles.formPlaceholder}
            value={newTest.hcgValue}
            onInput={e => setNewTest(prev => ({ ...prev, hcgValue: e.detail.value }))}
          />
          <Text className={styles.inputInlineHint}>
            💡 一般 D14 > 100 mIU/mL 表示好孕概率高
          </Text>
        </View>
      )}

      <View className={styles.formGroup}>
        <Text className={styles.formLabel}>备注（可选）</Text>
        <Input
          className={styles.formTextarea}
          placeholder='记录试纸颜色深浅、身体感受等...'
          placeholderClass={styles.formPlaceholder}
          value={newTest.notes}
          onInput={e => setNewTest(prev => ({ ...prev, notes: e.detail.value }))}
        />
      </View>
    </View>
  );

  const renderTestTab = () => (
    <View>
      <View className={styles.testCountdown}>
        <Text className={styles.countdownLabel}>距离官方抽血验孕</Text>
        <Text className={styles.countdownDays}>
          {daysUntilTest}
          <Text className={styles.countdownUnit}>天</Text>
        </Text>
        <Text className={styles.countdownDesc}>
          移植后第 {daysAfterTransfer} 天 · 建议第14天抽血确认
        </Text>
        <View style={{ display: 'block', marginTop: '16rpx' }}>
          <Text className={styles.countdownTips}>
            💡 移植后请保持轻松心情，避免过度焦虑
          </Text>
        </View>
      </View>

      <View className={styles.addRecordBtn} onClick={handleAddTest}>
        <Text className={styles.addRecordIcon}>➕</Text>
        <Text className={styles.addRecordText}>添加验孕记录</Text>
      </View>

      {allTests.length > 0 ? (
        <View className={styles.testTimeline}>
          <Text style={{
            fontSize: '28rpx',
            fontWeight: 600,
            color: '#2D3436',
            marginBottom: '24rpx',
            display: 'block'
          }}>
            📋 验孕记录（{allTests.length}条）
          </Text>
          {allTests.map(test => (
            <View key={test.id} className={styles.testItem}>
              <View className={classnames(
                styles.testDot,
                test.result === 'positive' && styles.testDotPositive,
                test.result === 'negative' && styles.testDotNegative,
                test.result === 'pending' && styles.testDotPending
              )}>
                <Text className={styles.testDotIcon}>
                  {test.result === 'positive' ? '✅' : test.result === 'negative' ? '❌' : '⏳'}
                </Text>
              </View>
              <View className={styles.testContent}>
                <View className={styles.testHeader}>
                  <Text className={styles.testTitle}>
                    {test.testType === 'blood' ? '抽血HCG检查' : '尿检验孕'}
                  </Text>
                  <Text className={styles.testDaysAfter}>
                    D{test.daysAfterTransfer}
                  </Text>
                </View>
                <View className={styles.testMeta}>
                  <Text className={styles.testMetaItem}>📅 {test.date.slice(5)}</Text>
                  {test.hcgValue && (
                    <Text className={styles.testMetaItem}>🔬 HCG: {test.hcgValue} mIU/mL</Text>
                  )}
                </View>
                <View>
                  <Text className={classnames(
                    styles.testResult,
                    test.result === 'positive' && styles.resultPositive,
                    test.result === 'negative' && styles.resultNegative,
                    test.result === 'pending' && styles.resultPending
                  )}>
                    {test.result === 'positive' ? '🤰 阳性 · 好孕！' :
                     test.result === 'negative' ? '📋 阴性' :
                     '⏳ 等待结果'}
                  </Text>
                </View>
                {test.notes && (
                  <View className={styles.testNotes}>
                    💬 {test.notes}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={{ background: '#fff', borderRadius: '16rpx', overflow: 'hidden' }}>
          <EmptyState
            icon='🤞'
            title='还没有验孕记录'
            description={`距离官方验孕还有 ${daysUntilTest} 天，点击上方按钮添加验孕记录！`}
          />
        </View>
      )}

      {renderModal(
        showTestModal,
        newTest.testType === 'blood' ? '🩸 记录抽血HCG结果' : '🧪 记录尿检验孕结果',
        () => setShowTestModal(false),
        testModalContent,
        saveTest,
        '保存验孕记录'
      )}
    </View>
  );

  const renderTrendTab = () => (
    <View>
      <View className={styles.trendCard}>
        <View className={styles.trendHeader}>
          <Text className={styles.trendTitle}>
            <Text>🌡️</Text> 基础体温趋势
          </Text>
          <View>
            <Text className={styles.trendValue}>
              {temperature}
              <Text className={styles.trendUnit}> °C</Text>
            </Text>
          </View>
        </View>
        <View className={styles.barChart}>
          {tempTrendData.map((item, idx) => {
            const tempValue = parseFloat(item.value as string);
            const minTemp = 36.3;
            const maxTemp = 37.0;
            const height = Math.max(20, Math.min(100, ((tempValue - minTemp) / (maxTemp - minTemp)) * 100));
            return (
              <View key={idx} className={styles.barItem}>
                <View className={styles.barWrap}>
                  <View
                    className={styles.bar}
                    style={{ height: `${height}%` }}
                    data-value={item.value}
                  />
                </View>
                <Text className={styles.barLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.trendCard}>
        <View className={styles.trendHeader}>
          <Text className={styles.trendTitle}>
            <Text>⚖️</Text> 体重变化趋势
          </Text>
          <View>
            <Text className={styles.trendValue}>
              {weight}
              <Text className={styles.trendUnit}> kg</Text>
            </Text>
          </View>
        </View>
        <View className={styles.barChart}>
          {weightTrendData.map((item, idx) => {
            const wValue = parseFloat(item.value as string);
            const minW = 51.0;
            const maxW = 53.0;
            const height = Math.max(20, Math.min(100, ((wValue - minW) / (maxW - minW)) * 100));
            return (
              <View key={idx} className={styles.barItem}>
                <View className={styles.barWrap}>
                  <View
                    className={styles.bar}
                    style={{
                      height: `${height}%`,
                      background: 'linear-gradient(180deg, #6EC6B7 0%, #A8DDD3 100%)'
                    }}
                    data-value={item.value}
                  />
                </View>
                <Text className={styles.barLabel}>{item.label}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View className={styles.trendCard}>
        <View className={styles.trendHeader}>
          <Text className={styles.trendTitle}>
            <Text>😊</Text> 本月情绪日历
          </Text>
        </View>

        <View className={styles.moodWeekHeader}>
          {['日', '一', '二', '三', '四', '五', '六'].map(w => (
            <Text key={w} className={styles.moodWeekLabel}>{w}</Text>
          ))}
        </View>

        <View className={styles.moodCalendar}>
          {moodCalendarData.map((cell, idx) => (
            <View
              key={idx}
              className={classnames(
                styles.moodCell,
                cell.hasRecord && styles.hasRecord,
                cell.level === 5 && styles.level5,
                cell.level === 4 && styles.level4,
                cell.level === 3 && styles.level3,
                cell.level === 2 && styles.level2,
                cell.level === 1 && styles.level1
              )}
            >
              {cell.day}
            </View>
          ))}
        </View>

        <View className={styles.moodLegend}>
          {[
            { level: 5, label: '愉快', color: '#E8F8F5' },
            { level: 4, label: '平静', color: '#EBF5FF' },
            { level: 3, label: '一般', color: '#FFF9E6' },
            { level: 2, label: '焦虑', color: '#FFF0F3' },
            { level: 1, label: '低落', color: '#FDF0EC' }
          ].map(item => (
            <View key={item.level} className={styles.legendItem}>
              <View className={styles.legendDot} style={{ background: item.color }} />
              <Text className={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView className={styles.page} scrollY>
      <View className='page-container'>
        <View className={styles.tabBar}>
          {tabs.map(tab => (
            <View
              key={tab.key}
              className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text className={styles.tabIcon}>{tab.icon}</Text>
              <Text className={styles.tabLabel}>{tab.label}</Text>
            </View>
          ))}
        </View>

        {activeTab === 'diary' && renderDiaryTab()}
        {activeTab === 'test' && renderTestTab()}
        {activeTab === 'trend' && renderTrendTab()}

        <View style={{ height: '40rpx' }} />
      </View>
    </ScrollView>
  );
};

export default RecordsPage;
