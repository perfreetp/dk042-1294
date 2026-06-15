import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StageBadgeProps {
  stage: string;
  color?: string;
  bgColor?: string;
  size?: 'sm' | 'md';
}

const stageNameMap: Record<string, string> = {
  initial: '初诊',
  check: '检查',
  ovulation: '促排',
  retrieval: '取卵',
  transfer: '移植',
  test: '验孕'
};

const stageColorMap: Record<string, { color: string; bgColor: string }> = {
  initial: { color: '#74B9FF', bgColor: '#EBF5FF' },
  check: { color: '#A29BFE', bgColor: '#F0EEFF' },
  ovulation: { color: '#FDCB6E', bgColor: '#FFF9E6' },
  retrieval: { color: '#E17055', bgColor: '#FDF0EC' },
  transfer: { color: '#FF8BA7', bgColor: '#FFF0F3' },
  test: { color: '#00B894', bgColor: '#E8F8F5' }
};

const StageBadge: React.FC<StageBadgeProps> = ({ stage, color, bgColor, size = 'sm' }) => {
  const colors = stageColorMap[stage] || { color: '#FF8BA7', bgColor: '#FFF0F3' };
  const name = stageNameMap[stage] || stage;

  return (
    <View
      className={classnames(styles.badge, styles[size])}
      style={{ backgroundColor: bgColor || colors.bgColor, color: color || colors.color }}
    >
      <Text className={styles.text}>{name}</Text>
    </View>
  );
};

export default StageBadge;
