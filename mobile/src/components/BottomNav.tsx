import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenName } from '../types';
import { theme } from '../theme';

type NavItem = {
  key: ScreenName;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const navItems: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home-outline' },
  { key: 'history', label: 'History', icon: 'search-outline' },
  { key: 'importReceipt', label: 'Upload', icon: 'camera-outline' },
  { key: 'activity', label: 'Activity', icon: 'pie-chart-outline' },
  { key: 'profile', label: 'Profile', icon: 'person-outline' }
];

export function BottomNav({ active, onNavigate }: { active: ScreenName; onNavigate: (screen: ScreenName) => void }) {
  return (
    <View style={styles.wrapper}>
      {navItems.map((item) => {
        const isActive = active === item.key || (item.key === 'importReceipt' && ['importReceipt', 'receiptReview', 'splitSetup', 'assignItems', 'summary'].includes(active));
        const isCamera = item.key === 'importReceipt';
        return (
          <Pressable key={item.key} onPress={() => onNavigate(item.key)} style={styles.item}>
            <View style={[styles.iconBox, isCamera && styles.cameraBox, isActive && !isCamera && styles.activeIconBox]}>
              <Ionicons name={item.icon} size={isCamera ? 26 : 22} color={isCamera || isActive ? '#FFFFFF' : theme.color.muted} />
            </View>
            <Text style={[styles.label, isActive && styles.activeLabel]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: theme.color.card,
    borderTopWidth: 1,
    borderTopColor: theme.color.line
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 58
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  activeIconBox: {
    backgroundColor: theme.color.blue
  },
  cameraBox: {
    width: 50,
    height: 42,
    borderRadius: 18,
    backgroundColor: theme.color.blue,
    ...theme.shadow
  },
  label: {
    fontSize: 11,
    color: theme.color.muted,
    fontWeight: '600'
  },
  activeLabel: {
    color: theme.color.blue
  }
});
