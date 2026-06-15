import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import StageBadge from '@/components/StageBadge';
import type { TodoType } from '@/types';

interface TodoItemProps {
  id: string;
  type: TodoType;
  title: string;
  time?: string;
  description?: string;
  completed: boolean;
  isImportant: boolean;
  stage: string;
  onToggle?: (id: string, completed: boolean) => void;
}

const typeInfo: Record<TodoType, { icon: string; label: string; color: string }> = {
  checkup: { icon: '🔬', label: '检查', color: '#A29BFE' },
  medication: { icon: '💊', label: '用药', color: '#74B9FF' },
  injection: { icon: '💉', label: '注射', color: '#E17055' },
  appointment: { icon: '🏥', label: '就诊', color: '#FF8BA7' },
  other: { icon: '📝', label: '其他', color: '#8B5CF6' }
};

const TodoItem: React.FC<TodoItemProps> = ({
  id,
  type,
  title,
  time,
  description,
  completed,
  isImportant,
  stage,
  onToggle
}) => {
  const info = typeInfo[type];

  const handleToggle = () => {
    if (onToggle) {
      onToggle(id, !completed);
    } else {
      Taro.showToast({
        title: completed ? '已取消完成' : '打卡成功',
        icon: 'none'
      });
    }
  };

  return (
    <View className={classnames(styles.item, completed && styles.completed)}>
      <View
        className={classnames(styles.checkbox, completed && styles.checked)}
        style={completed ? { backgroundColor: info.color, borderColor: info.color } : {}}
        onClick={handleToggle}
      >
        {completed && <Text className={styles.checkIcon}>✓</Text>}
      </View>

      <View className={styles.content}>
        <View className={styles.header}>
          <View className={styles.typeTag} style={{ color: info.color }}>
            <Text className={styles.typeIcon}>{info.icon}</Text>
            <Text className={styles.typeLabel}>{info.label}</Text>
          </View>
          {isImportant && !completed && (
            <View className={styles.importantTag}>
              <Text className={styles.importantText}>重要</Text>
            </View>
          )}
          <StageBadge stage={stage} />
        </View>

        <Text className={classnames(styles.title, completed && styles.lineThrough)}>
          {title}
        </Text>

        {time && !completed && (
          <View className={styles.timeRow}>
            <Text className={styles.timeIcon}>⏰</Text>
            <Text className={styles.timeText}>{time}</Text>
          </View>
        )}

        {description && (
          <Text className={styles.description}>{description}</Text>
        )}
      </View>
    </View>
  );
};

export default TodoItem;
