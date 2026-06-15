import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import classnames from 'classnames';

import EmptyState from '@/components/EmptyState';
import StageBadge from '@/components/StageBadge';

import { messageList } from '@/data/messagesData';
import { formatDate, addDays, diffDays } from '@/utils/dateUtils';
import type { MessageItem, MessageType } from '@/types';

type FilterType = 'all' | MessageType;

interface FilterTab {
  key: FilterType;
  label: string;
  icon: string;
}

const filters: FilterTab[] = [
  { key: 'all', label: '全部', icon: '📬' },
  { key: 'appointment', label: '就诊', icon: '🏥' },
  { key: 'medication', label: '用药', icon: '💊' },
  { key: 'family', label: '家属', icon: '💝' },
  { key: 'reminder', label: '提醒', icon: '⏰' },
  { key: 'system', label: '系统', icon: '🔧' }
];

const typeIcons: Record<MessageType, string> = {
  appointment: '📅',
  medication: '💉',
  family: '💕',
  reminder: '🔔',
  system: '📢'
};

const typeLabels: Record<MessageType, string> = {
  appointment: '就诊提醒',
  medication: '用药提醒',
  family: '家属消息',
  reminder: '温馨提示',
  system: '系统通知'
};

const MessagesPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [messages, setMessages] = useState<MessageItem[]>(messageList);

  const today = new Date();
  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(addDays(today, -1));

  const unreadTotal = useMemo(() => {
    return messages.filter(m => !m.isRead).length;
  }, [messages]);

  const unreadByType = useMemo(() => {
    const result: Record<string, number> = {
      appointment: 0,
      medication: 0,
      family: 0,
      reminder: 0
    };
    messages.forEach(m => {
      if (!m.isRead && result[m.type] !== undefined) {
        result[m.type]++;
      }
    });
    return result;
  }, [messages]);

  const filteredMessages = useMemo(() => {
    if (activeFilter === 'all') return messages;
    return messages.filter(m => m.type === activeFilter);
  }, [messages, activeFilter]);

  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: { title: string; items: MessageItem[] } } = {
      today: { title: '今天', items: [] },
      yesterday: { title: '昨天', items: [] },
      week: { title: '本周', items: [] },
      earlier: { title: '更早', items: [] }
    };

    filteredMessages.forEach(msg => {
      const msgDate = new Date(msg.date);
      if (msg.date === todayStr) {
        groups.today.items.push(msg);
      } else if (msg.date === yesterdayStr) {
        groups.yesterday.items.push(msg);
      } else if (diffDays(today, msgDate) <= 7) {
        groups.week.items.push(msg);
      } else {
        groups.earlier.items.push(msg);
      }
    });

    return Object.values(groups).filter(g => g.items.length > 0);
  }, [filteredMessages, todayStr, yesterdayStr, today]);

  const handleMarkAllRead = () => {
    if (unreadTotal === 0) {
      Taro.showToast({ title: '暂无未读消息', icon: 'none' });
      return;
    }
    Taro.showModal({
      title: '全部标为已读',
      content: `确定将 ${unreadTotal} 条未读消息全部标记为已读吗？`,
      confirmColor: '#FF8BA7',
      success: (res) => {
        if (res.confirm) {
          setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
          Taro.showToast({ title: '已全部标记为已读', icon: 'success' });
        }
      }
    });
  };

  const handleMessageTap = (msg: MessageItem) => {
    if (!msg.isRead) {
      setMessages(prev => prev.map(m =>
        m.id === msg.id ? { ...m, isRead: true } : m
      ));
    }

    switch (msg.type) {
      case 'appointment':
        Taro.switchTab({ url: '/pages/calendar/index' });
        break;
      case 'medication':
        Taro.switchTab({ url: '/pages/checklist/index' });
        break;
      case 'family':
        Taro.showToast({ title: '跳转到家属共享', icon: 'none' });
        break;
      default:
        Taro.showToast({ title: `查看: ${msg.title}`, icon: 'none' });
    }
  };

  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
  };

  const renderSummaryCard = () => (
    <View className={styles.summaryCard}>
      <View className={styles.summaryHeader}>
        <View>
          <Text className={styles.summaryTitle}>🔔 消息中心</Text>
        </View>
        <View
          className={styles.readAllBtn}
          onClick={handleMarkAllRead}
        >
          <Text>✓ 全部已读</Text>
        </View>
      </View>

      <View className={styles.unreadGrid}>
        <View className={styles.unreadItem}>
          <Text className={styles.unreadCount}>{unreadTotal}</Text>
          <Text className={styles.unreadLabel}>未读总数</Text>
        </View>
        <View className={styles.unreadItem}>
          <Text className={styles.unreadCount}>{unreadByType.appointment}</Text>
          <Text className={styles.unreadLabel}>就诊提醒</Text>
        </View>
        <View className={styles.unreadItem}>
          <Text className={styles.unreadCount}>{unreadByType.medication}</Text>
          <Text className={styles.unreadLabel}>用药提醒</Text>
        </View>
        <View className={styles.unreadItem}>
          <Text className={styles.unreadCount}>{unreadByType.family}</Text>
          <Text className={styles.unreadLabel}>家属消息</Text>
        </View>
      </View>
    </View>
  );

  const renderFilterTabs = () => (
    <View className={styles.filterTabs}>
      {filters.map(f => {
        const unreadForFilter = f.key === 'all'
          ? unreadTotal
          : messages.filter(m => m.type === f.key && !m.isRead).length;
        return (
          <View
            key={f.key}
            className={classnames(styles.filterTab, {
              [styles.active]: activeFilter === f.key
            })}
            onClick={() => handleFilterChange(f.key)}
          >
            <Text>{f.icon}</Text>
            <Text>{f.label}</Text>
            {unreadForFilter > 0 && (
              <Text className={styles.tabBadge}>{unreadForFilter}</Text>
            )}
          </View>
        );
      })}
    </View>
  );

  const renderMessageCard = (msg: MessageItem) => (
    <View
      key={msg.id}
      className={classnames(styles.messageCard, {
        [styles.unread]: !msg.isRead
      })}
      onClick={() => handleMessageTap(msg)}
    >
      {!msg.isRead && <View className={styles.unreadDot} />}

      <View className={classnames(
        styles.iconWrap,
        styles[`iconWrap_${msg.type}`]
      )}>
        <Text>{typeIcons[msg.type]}</Text>
      </View>

      <View className={styles.messageContent}>
        <View className={styles.messageHeader}>
          <Text className={styles.messageTitle}>{msg.title}</Text>
          <Text className={styles.messageTime}>{msg.time}</Text>
        </View>

        <Text className={styles.messageBody}>{msg.content}</Text>

        <View className={styles.messageFooter}>
          <View className={styles.typeTags}>
            <Text className={classnames(
              styles.typeTag,
              styles[`typeTag_${msg.type}`]
            )}>
              {typeLabels[msg.type]}
            </Text>
            {msg.stage && (
              <View style={{ marginLeft: '12rpx' }}>
                <StageBadge stage={msg.stage} size="sm" />
              </View>
            )}
          </View>
          <Text className={styles.arrowIcon}>›</Text>
        </View>
      </View>
    </View>
  );

  const renderMessageList = () => {
    if (filteredMessages.length === 0) {
      return (
        <EmptyState
          icon="📭"
          title="暂无消息"
          description="当前分类下还没有消息哦~"
        />
      );
    }

    return (
      <View>
        {groupedMessages.map(group => (
          <View key={group.title} className={styles.dateSection}>
            <View className={styles.dateHeader}>
              <Text className={styles.dateTitle}>📆 {group.title}</Text>
              <View className={styles.dateLine} />
            </View>
            {group.items.map(msg => renderMessageCard(msg))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      className={styles.page}
      scrollY
      enableBackToTop
      refresherEnabled
      refresherTriggered={false}
      onRefresherRefresh={() => {
        Taro.showToast({ title: '刷新中...', icon: 'loading', duration: 800 });
      }}
    >
      {renderSummaryCard()}
      {renderFilterTabs()}
      {renderMessageList()}
    </ScrollView>
  );
};

export default MessagesPage;
