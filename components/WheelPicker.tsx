import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

export const WHEEL_ITEM_H = 48;
export const WHEEL_VISIBLE = 5;
export const WHEEL_H = WHEEL_ITEM_H * WHEEL_VISIBLE;

interface WheelPickerProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  flex?: number;
}

export function WheelPicker({ items, selectedIndex, onSelect, flex = 1 }: WheelPickerProps) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * WHEEL_ITEM_H, animated: false });
    }, 80);
    return () => clearTimeout(t);
  }, []);

  function snap(y: number) {
    const idx = Math.max(0, Math.min(Math.round(y / WHEEL_ITEM_H), items.length - 1));
    ref.current?.scrollTo({ y: idx * WHEEL_ITEM_H, animated: true });
    if (idx !== selectedIndex) {
      try { Haptics.selectionAsync(); } catch {}
      onSelect(idx);
    }
  }

  return (
    <View style={[styles.container, { flex }]}>
      <View pointerEvents="none" style={styles.highlight} />
      <View pointerEvents="none" style={styles.lineTop} />
      <View pointerEvents="none" style={styles.lineBottom} />
      <ScrollView
        ref={ref}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) => snap(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => snap(e.nativeEvent.contentOffset.y)}
        contentContainerStyle={{ paddingVertical: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2) }}
      >
        {items.map((item, i) => {
          const dist = Math.abs(i - selectedIndex);
          return (
            <View key={i} style={styles.item}>
              <Text style={[
                styles.itemText,
                dist === 0 && styles.itemTextSelected,
                { opacity: dist === 0 ? 1 : dist === 1 ? 0.55 : 0.25 },
              ]}>
                {item}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: WHEEL_H,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2),
    left: 0,
    right: 0,
    height: WHEEL_ITEM_H,
    backgroundColor: Colors.accentPink + '35',
    borderRadius: 12,
    zIndex: 2,
  },
  lineTop: {
    position: 'absolute',
    top: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2),
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: Colors.accentPink + '90',
    zIndex: 3,
  },
  lineBottom: {
    position: 'absolute',
    top: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2) + WHEEL_ITEM_H - 1,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: Colors.accentPink + '90',
    zIndex: 3,
  },
  item: {
    height: WHEEL_ITEM_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontFamily: 'Lato_400Regular',
    fontSize: 16,
    color: Colors.textSecondary,
  },
  itemTextSelected: {
    fontFamily: 'Lato_700Bold',
    fontSize: 22,
    color: Colors.textPrimary,
  },
});
