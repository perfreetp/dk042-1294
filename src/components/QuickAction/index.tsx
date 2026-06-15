import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

interface QuickActionProps {
  icon: string;
  label: string;
  color?: string;
  bgColor?: string;
  onClick?: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({
  icon,
  label,
  color = '#FF8BA7',
  bgColor = '#FFF0F3',
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  return (
    <View className={styles.action} onClick={handleClick}>
      <View className={styles.iconWrap} style={{ backgroundColor: bgColor }}>
        <Text className={styles.icon} style={{ color }}>{icon}</Text>
      </View>
      <Text className={styles.label}>{label}</Text>
    </View>
  );
};

export default QuickAction;
