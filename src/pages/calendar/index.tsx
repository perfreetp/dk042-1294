import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import StageBadge from '@/components/StageBadge';
import EmptyState from '@/components/EmptyState';

import { stageList, calendarEvents } from '@/data/treatmentData';
import { formatDate, getMonthDays, getFirstDayOfMonth, getWeekdayCN, isSameDay, isToday, formatDateCN, padZero, parseDate, diffDays } from '@/utils/dateUtils';
import type { CalendarEvent, StageInfo, TreatmentStage } from '@/types';

interface DayData {
  date: Date;
  dateStr: string;
  inMonth: boolean;
  stage?: TreatmentStage;
  events: CalendarEvent[];
}

const stageBgMap: Record<TreatmentStage, string> = {
  initial: styles.dayBgInitial,
  check: styles.dayBgCheck,
  ovulation: styles.dayBgOvulation,
  retrieval: styles.dayBgRetrieval,
  transfer: styles.dayBgTransfer,
  test: styles.dayBgTest
};

const eventColorMap: Record<string, string> = {
  checkup: '#A29BFE',
  medication: '#74B9FF',
  injection: '#E17055',
  appointment: '#FF8BA7',
  stage: '#FDCB6E',
  reminder: '#8B5CF6'
};

const eventIconMap: Record<string, string> = {
  checkup: '🔬',
  medication: '💊',
  injection: '💉',
  appointment: '🏥',
  stage: '⭐',
  reminder: '🔔'
};

const CalendarPage: React.FC = () => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [activeStage, setActiveStage] = useState<TreatmentStage | 'all'>('all');

  const getStageForDate = (date: Date): TreatmentStage | undefined => {
    for (const stage of stageList) {
      const start = parseDate(stage.startDate);
      const end = stage.endDate ? parseDate(stage.endDate) : start;
      if (date >= start && date <= end) {
        return stage.id;
      }
    }
    return undefined;
  };

  const calendarDays = useMemo((): DayData[] => {
    const days: DayData[] = [];
    const monthDays = getMonthDays(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonthDays = getMonthDays(prevYear, prevMonth);

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(prevYear, prevMonth, prevMonthDays - i);
      const dateStr = formatDate(d);
      days.push({
        date: d,
        dateStr,
        inMonth: false,
        stage: getStageForDate(d),
        events: calendarEvents.filter(e => e.date === dateStr)
      });
    }

    for (let i = 1; i <= monthDays; i++) {
      const d = new Date(currentYear, currentMonth, i);
      const dateStr = formatDate(d);
      const events = calendarEvents.filter(e => e.date === dateStr);
      const filteredEvents = activeStage === 'all'
        ? events
        : events.filter(e => e.stage === activeStage);
      days.push({
        date: d,
        dateStr,
        inMonth: true,
        stage: getStageForDate(d),
        events: filteredEvents
      });
    }

    while (days.length < 42) {
      const lastDay = days[days.length - 1];
      const d = new Date(lastDay.date);
      d.setDate(d.getDate() + 1);
      const dateStr = formatDate(d);
      days.push({
        date: d,
        dateStr,
        inMonth: false,
        stage: getStageForDate(d),
        events: calendarEvents.filter(e => e.date === dateStr)
      });
    }

    return days;
  }, [currentYear, currentMonth, activeStage]);

  const selectedDateStr = formatDate(selectedDate);
  const selectedEvents = calendarEvents.filter(e => e.date === selectedDateStr);
  const selectedStage = getStageForDate(selectedDate);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(y => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(y => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    const t = new Date();
    setCurrentYear(t.getFullYear());
    setCurrentMonth(t.getMonth());
    setSelectedDate(t);
  };

  const handleDayClick = (day: DayData) => {
    setSelectedDate(day.date);
  };

  const handleStageClick = (stageId: TreatmentStage | 'all') => {
    setActiveStage(stageId);
    if (stageId !== 'all') {
      const stage = stageList.find(s => s.id === stageId);
      if (stage) {
        const stageStart = parseDate(stage.startDate);
        setCurrentYear(stageStart.getFullYear());
        setCurrentMonth(stageStart.getMonth());
      }
    }
    Taro.showToast({
      title: stageId === 'all' ? '显示全部' : `聚焦${stageList.find(s => s.id === stageId)?.name || ''}阶段`,
      icon: 'none'
    });
  };

  const getEventDots = (events: CalendarEvent[]) => {
    const colors: string[] = [];
    const seenTypes = new Set<string>();
    for (const e of events) {
      if (!seenTypes.has(e.type)) {
        seenTypes.add(e.type);
        colors.push(eventColorMap[e.type] || '#FF8BA7');
        if (colors.length >= 3) break;
      }
    }
    return colors;
  };

  const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <ScrollView className={styles.page} scrollY>
      <View className='page-container'>
        {/* 阶段切换条 */}
        <ScrollView scrollX className={styles.stageTabs} showScrollbar={false}>
          <View
            className={classnames(styles.stageTab, activeStage === 'all' && styles.active)}
            onClick={() => handleStageClick('all')}
          >
            <View className={styles.stageDot} style={{ background: 'linear-gradient(135deg, #FF8BA7, #FDCB6E)' }} />
            <Text className={styles.stageTabText}>全部阶段</Text>
          </View>
          {stageList.map(stage => (
            <View
              key={stage.id}
              className={classnames(styles.stageTab, activeStage === stage.id && styles.active)}
              onClick={() => handleStageClick(stage.id)}
            >
              <View className={styles.stageDot} style={{ background: stage.color }} />
              <Text className={styles.stageTabText}>{stage.name}</Text>
            </View>
          ))}
        </ScrollView>

        {/* 日历主体 */}
        <View className={styles.calendarCard}>
          {/* 月份控制 */}
          <View className={styles.calendarHeader}>
            <View className={styles.navBtn} onClick={goToPrevMonth}>
              <Text className={styles.navIcon}>‹</Text>
            </View>
            <Text className={styles.monthTitle}>
              {currentYear}年{padZero(currentMonth + 1)}月
            </Text>
            <View className={styles.todayBtn} onClick={goToToday}>
              <Text className={styles.todayBtnText}>今天</Text>
            </View>
            <View className={styles.navBtn} onClick={goToNextMonth}>
              <Text className={styles.navIcon}>›</Text>
            </View>
          </View>

          {/* 星期标题 */}
          <View className={styles.weekHeader}>
            {weekdayLabels.map((label, idx) => (
              <View
                key={label}
                className={classnames(styles.weekCell, (idx === 0 || idx === 6) && styles.weekend)}
              >
                {label}
              </View>
            ))}
          </View>

          {/* 日期网格 */}
          <View className={styles.calendarGrid}>
            {calendarDays.map((day, idx) => {
              const dayOfWeek = day.date.getDay();
              const isSelected = isSameDay(day.date, selectedDate);
              const eventDots = getEventDots(day.events);
              const hasMore = day.events.length > 3;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const stageBg = day.stage ? stageBgMap[day.stage] : '';

              return (
                <View
                  key={idx}
                  className={classnames(
                    styles.dayCell,
                    !day.inMonth && styles.otherMonth,
                    isToday(day.dateStr) && styles.today,
                    isSelected && styles.selected,
                    stageBg && styles.hasBg,
                    stageBg
                  )}
                  onClick={() => handleDayClick(day)}
                >
                  <View className={styles.dayContent}>
                    <Text className={styles.dayNumber} style={isWeekend && !isToday(day.dateStr) && !isSelected ? { color: '#FF8BA7' } : {}}>
                      {day.date.getDate()}
                    </Text>
                    {eventDots.length > 0 && (
                      <View className={styles.eventDots}>
                        {eventDots.map((c, i) => (
                          <View key={i} className={styles.eventDot} style={{ background: c }} />
                        ))}
                        {hasMore && <View className={styles.moreEvents} />}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* 选中日期详情 */}
        <View className={styles.detailCard}>
          <View className={styles.detailHeader}>
            <View>
              <Text className={styles.detailDate}>
                {formatDateCN(selectedDate)}
                <Text className={styles.detailWeekday}>{getWeekdayCN(selectedDate)}</Text>
              </Text>
            </View>
            {selectedStage && (
              <View className={styles.detailBadge}>
                <StageBadge stage={selectedStage} size='sm' />
              </View>
            )}
          </View>

          {selectedEvents.length > 0 ? (
            <View className={styles.eventList}>
              {selectedEvents.map(event => (
                <View
                  key={event.id}
                  className={styles.eventItem}
                  style={{ borderLeftColor: eventColorMap[event.type] || '#FF8BA7' }}
                >
                  <View
                    className={styles.eventIconWrap}
                    style={{ backgroundColor: `${eventColorMap[event.type] || '#FF8BA7'}20` }}
                  >
                    <Text className={styles.eventIcon}>{eventIconMap[event.type] || '📌'}</Text>
                  </View>
                  <View className={styles.eventContent}>
                    <View className={styles.eventTop}>
                      <Text className={styles.eventTitle}>{event.title}</Text>
                    </View>
                    {event.stage && (
                      <Text className={styles.eventDesc}>
                        <StageBadge stage={event.stage} size='sm' />
                        {event.isImportant && (
                          <View className={styles.eventImportant} style={{ marginTop: '12rpx' }}>
                            <Text className={styles.eventImportantText}>⭐ 重要提醒</Text>
                          </View>
                        )}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <EmptyState
              icon='🌿'
              title='当日暂无安排'
              description='是个放松的好日子，保持心情愉快哦~'
            />
          )}
        </View>

        {/* 图例说明 */}
        <View className={styles.legendCard}>
          <Text className={styles.legendTitle}>📖 图例说明</Text>
          <View className={styles.legendGrid}>
            {Object.entries(eventColorMap).map(([type, color]) => (
              <View key={type} className={styles.legendItem}>
                <View className={styles.legendDot} style={{ background: color }} />
                <Text className={styles.legendText}>
                  {type === 'checkup' && '检查项目'}
                  {type === 'medication' && '口服用药'}
                  {type === 'injection' && '注射针剂'}
                  {type === 'appointment' && '就诊预约'}
                  {type === 'stage' && '阶段节点'}
                  {type === 'reminder' && '提醒事项'}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ marginTop: '24rpx', paddingTop: '24rpx', borderTop: '1rpx solid #FFF0F3' }}>
            <View className={styles.legendGrid}>
              {stageList.slice(0, 4).map(stage => (
                <View key={stage.id} className={styles.legendItem}>
                  <View className={styles.legendDot} style={{ background: stage.color, opacity: 0.35 }} />
                  <Text className={styles.legendText}>{stage.name}背景</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: '40rpx' }} />
      </View>
    </ScrollView>
  );
};

export default CalendarPage;
