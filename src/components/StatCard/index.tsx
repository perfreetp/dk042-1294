import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
  color?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  suffix,
  highlight = false,
  color = '#FF8BA7'
}) => {
  return (
    <View className={styles.card} style={highlight ? { borderColor: color } : {}}>
      <View className={styles.iconWrap} style={{ backgroundColor: `${color}15` }}>
        <Text className={styles.icon}>{icon}</Text>
      </View>
      <View className={styles.content}>
        <View className={styles.valueRow}>
          <Text className={styles.value} style={{ color }}>{value}</Text>
          {suffix && <Text className={styles.suffix}>{suffix}</Text>}
        </View>
        <Text className={styles.label}>{label}</Text>
      </View>
    </View>
  );
};

export default StatCard;
