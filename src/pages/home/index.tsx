import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import StatCard from '@/components/StatCard';
import TodoItem from '@/components/TodoItem';
import StageBadge from '@/components/StageBadge';
import QuickAction from '@/components/QuickAction';

import { stageList, timelineNodes, tabooList } from '@/data/treatmentData';
import { todoList } from '@/data/checklistData';
import { formatDateCN, getRelativeDateStr, isToday, formatDate, diffDays, addDays, parseDate } from '@/utils/dateUtils';
import type { TimelineNode, TodoItem as TodoItemType } from '@/types';

const HomePage: React.FC = () => {
  const [todos, setTodos] = useState<TodoItemType[]>(todoList);
  const [refreshing, setRefreshing] = useState(false);

  useDidShow(() => {
    console.log('[HomePage] 页面显示');
  });

  const currentStage = stageList.find(s => s.status === 'current') || stageList[0];
  const completedStages = stageList.filter(s => s.status === 'completed').length;
  const todayStr = formatDate(new Date());

  const todayTodos = todos.filter(t => t.date === todayStr);
  const completedToday = todayTodos.filter(t => t.completed).length;

  const totalChecks = 6;
  const completedChecks = 4;

  const nextAppointment = timelineNodes.find(n => n.status === 'pending' || n.status === 'current');
  const daysLeft = nextAppointment ? diffDays(parseDate(nextAppointment.date), new Date()) : 0;

  const totalDays = diffDays(new Date(), parseDate(stageList[0].startDate)) + 1;

  const upcomingTimeline = timelineNodes
    .filter(n => n.status !== 'completed')
    .slice(0, 5);

  const currentTaboos = tabooList.filter(t => t.stage === currentStage.id).slice(0, 4);

  const handleTodoToggle = (id: string, completed: boolean) => {
    setTodos(prev => prev.map(t =>
      t.id === id ? { ...t, completed, completedAt: completed ? formatDate(new Date()) + ' ' + new Date().toTimeString().slice(0, 5) : undefined } : t
    ));
    Taro.showToast({
      title: completed ? '打卡成功！' : '已取消',
      icon: 'none'
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    console.log('[HomePage] 开始下拉刷新');
    setTimeout(() => {
      setRefreshing(false);
      Taro.showToast({ title: '已更新', icon: 'success' });
    }, 1000);
  };

  const navigateTo = (page: string) => {
    const pageMap: Record<string, string> = {
      calendar: '/pages/calendar/index',
      checklist: '/pages/checklist/index',
      records: '/pages/records/index',
      messages: '/pages/messages/index'
    };
    if (pageMap[page]) {
      Taro.switchTab({ url: pageMap[page] });
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  return (
    <ScrollView
      className={styles.page}
      scrollY
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className='page-container'>
        {/* 顶部渐变欢迎区 */}
        <View className={styles.hero}>
          <View className={styles.heroContent}>
            <View className={styles.greeting}>
              <View className={styles.greetingLeft}>
                <Text className={styles.greetingTitle}>早上好，准妈妈 🌸</Text>
                <Text className={styles.greetingSub}>今天也是充满希望的一天，加油！</Text>
              </View>
              <View
                className={styles.shareBtn}
                onClick={() => Taro.showToast({ title: '已生成共享链接', icon: 'none' })}
              >
                <Text className={styles.shareIcon}>👨‍👩‍👧</Text>
                <Text className={styles.shareText}>家属共享</Text>
              </View>
            </View>

            {/* 当前阶段进度卡片 */}
            <View className={styles.currentStage}>
              <View className={styles.stageHeader}>
                <View style={{ display: 'flex', alignItems: 'center', gap: '16rpx' }}>
                  <StageBadge stage={currentStage.id} size='md' color='#fff' bgColor='rgba(255,255,255,0.25)' />
                  <Text className={styles.stageName}>{currentStage.name}</Text>
                </View>
                <Text className={styles.stageDays}>第 {totalDays - completedStages * 5} 天</Text>
              </View>
              <Text className={styles.stageDesc}>{currentStage.description}</Text>
              <View className={styles.progressBar}>
                <View className={styles.progressFill} style={{ width: `${currentStage.progress}%` }} />
              </View>
              <View className={styles.progressRow}>
                <Text className={styles.progressText}>阶段进度 {currentStage.progress}%</Text>
                <Text className={styles.nextNode}>
                  {nextAppointment ? `下一节点：${nextAppointment.title} · ${daysLeft > 0 ? `${daysLeft}天后` : '今天'}` : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 数据统计卡片 2x2 */}
        <View className={styles.statsGrid}>
          <StatCard
            icon='✅'
            label='检查完成'
            value={completedChecks}
            suffix={`/ ${totalChecks}`}
            color='#A29BFE'
          />
          <StatCard
            icon='💊'
            label='今日用药'
            value={completedToday}
            suffix={`/ ${todayTodos.length}`}
            color='#74B9FF'
            highlight
          />
          <StatCard
            icon='📅'
            label='下次就诊'
            value={daysLeft <= 0 ? '今天' : daysLeft}
            suffix={daysLeft <= 0 ? '' : '天后'}
            color='#FF8BA7'
          />
          <StatCard
            icon='⏳'
            label='累计天数'
            value={totalDays}
            suffix='天'
            color='#6EC6B7'
          />
        </View>

        {/* 今日待办 */}
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>📋</Text>
              今日待办
            </Text>
            <View className={styles.moreLink} onClick={() => navigateTo('checklist')}>
              <Text>查看全部</Text>
              <Text className={styles.moreArrow}>›</Text>
            </View>
          </View>

          {todayTodos.length > 0 ? (
            <View>
              {todayTodos.slice(0, 3).map(todo => (
                <TodoItem
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
          ) : (
            <View style={{ padding: '32rpx 0', textAlign: 'center' }}>
              <Text style={{ fontSize: '28rpx', color: '#B2BEC3' }}>🎉 今日待办已全部完成！</Text>
            </View>
          )}
        </View>

        {/* 禁忌提醒 */}
        <View className={styles.tabooCard}>
          <Text className={styles.tabooTitle}>
            ⚠️ {currentStage.name}阶段 · 重要提示
          </Text>
          <View className={styles.tabooList}>
            {currentTaboos.map(taboo => (
              <View key={taboo.id} className={styles.tabooItem}>
                <Text className={classnames(styles.tabooMark, taboo.isAllowed ? styles.tabooAllow : styles.tabooForbid)}>
                  {taboo.isAllowed ? '✓' : '✗'}
                </Text>
                <Text className={styles.tabooText}>
                  <Text style={{ fontWeight: 500 }}>{taboo.title}：</Text>
                  {taboo.description}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 快速操作入口 */}
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>⚡</Text>
              快速操作
            </Text>
          </View>
          <View className={styles.quickGrid}>
            <QuickAction
              icon='💉'
              label='用药打卡'
              color='#74B9FF'
              bgColor='#EBF5FF'
              onClick={() => navigateTo('checklist')}
            />
            <QuickAction
              icon='📝'
              label='记录症状'
              color='#FF8BA7'
              bgColor='#FFF0F3'
              onClick={() => navigateTo('records')}
            />
            <QuickAction
              icon='❓'
              label='问题卡片'
              color='#8B5CF6'
              bgColor='#EDE9FE'
              onClick={() => navigateTo('checklist')}
            />
            <QuickAction
              icon='📷'
              label='拍照归档'
              color='#6EC6B7'
              bgColor='#E8F8F5'
              onClick={() => Taro.chooseImage({ count: 1 }).then(() => Taro.showToast({ title: '上传成功', icon: 'success' }))}
            />
            <QuickAction
              icon='💰'
              label='费用记录'
              color='#FDCB6E'
              bgColor='#FFF9E6'
              onClick={() => navigateTo('checklist')}
            />
            <QuickAction
              icon='🤰'
              label='验孕记录'
              color='#00B894'
              bgColor='#E8F8F5'
              onClick={() => navigateTo('records')}
            />
            <QuickAction
              icon='🚨'
              label='异常标记'
              color='#E17055'
              bgColor='#FDF0EC'
              onClick={() => Taro.showModal({
                title: '标记异常情况',
                content: '是否将当前情况标记为异常？建议及时联系医生或前往就诊。',
                confirmText: '确认标记',
                confirmColor: '#E17055',
                success: (res) => {
                  if (res.confirm) {
                    Taro.showToast({ title: '已标记异常', icon: 'none' });
                  }
                }
              })}
            />
            <QuickAction
              icon='💬'
              label='消息中心'
              color='#A29BFE'
              bgColor='#F0EEFF'
              onClick={() => navigateTo('messages')}
            />
          </View>
        </View>

        {/* 疗程时间线预览 */}
        <View className={styles.sectionCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>
              <Text className={styles.sectionIcon}>🗺️</Text>
              疗程时间线
            </Text>
            <View className={styles.moreLink} onClick={() => navigateTo('calendar')}>
              <Text>查看日历</Text>
              <Text className={styles.moreArrow}>›</Text>
            </View>
          </View>

          <View className={styles.timelinePreview}>
            {upcomingTimeline.map((node: TimelineNode) => (
              <View
                key={node.id}
                className={classnames(styles.timelineItem, node.status === 'current' && styles.timelineCurrent)}
              >
                <View className={classnames(
                  styles.timelineDot,
                  node.status === 'completed' && styles.dotCompleted,
                  node.status === 'current' && styles.dotCurrent,
                  node.status === 'pending' && styles.dotPending,
                  node.status === 'warning' && styles.dotCurrent
                )}>
                  <Text className={styles.timelineDotIcon}>
                    {node.status === 'completed' ? '✓' : node.status === 'current' ? '📍' : '○'}
                  </Text>
                </View>
                <View className={styles.timelineContent}>
                  <View className={styles.timelineTop}>
                    <View style={{ display: 'flex', alignItems: 'center' }}>
                      <Text className={styles.timelineTitle}>{node.title}</Text>
                      {node.status === 'current' && <Text className={styles.timelineStatus}>进行中</Text>}
                    </View>
                    <Text className={styles.timelineDate}>{getRelativeDateStr(node.date)}</Text>
                  </View>
                  <Text className={styles.timelineDesc}>
                    {node.time && `⏰ ${node.time} · `}
                    {node.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 底部留白 */}
        <View style={{ height: '40rpx' }} />
      </View>
    </ScrollView>
  );
};

export default HomePage;
